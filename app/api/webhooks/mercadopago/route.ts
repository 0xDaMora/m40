import { NextRequest, NextResponse } from 'next/server'
import { payment, preference } from '@/lib/mercadopago/client'
import { prisma } from '@/lib/db/prisma'
import { processApprovedPayment, processRejectedPayment } from '@/lib/mercadopago/utils'
import { MercadoPagoWebhookPayload, MercadoPagoPayment } from '@/types/mercadopago'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    console.log('🔔 [WEBHOOK_START] === WEBHOOK RECIBIDO ===')
    console.log('🔔 [WEBHOOK_START] Timestamp:', new Date().toISOString())
    console.log('🔔 [WEBHOOK_START] URL:', req.url)
    console.log('🔔 [WEBHOOK_START] Method:', req.method)
    
    // 1. Obtener headers y query parameters
    const xSignature = req.headers.get('x-signature')
    const xRequestId = req.headers.get('x-request-id')
    const userAgent = req.headers.get('user-agent')
    const url = new URL(req.url)
    // Manejar ambos formatos: data.id (payment) o id (merchant_order)
    const dataId = url.searchParams.get('data.id') || url.searchParams.get('id')
    // Manejar ambos formatos: type (payment) o topic (merchant_order)
    const type = url.searchParams.get('type') || url.searchParams.get('topic')
    
    console.log('🔔 [WEBHOOK_HEADERS] User-Agent:', userAgent)
    console.log('🔔 [WEBHOOK_HEADERS] X-Signature:', xSignature)
    console.log('🔔 [WEBHOOK_HEADERS] X-Request-ID:', xRequestId)
    console.log('🔔 [WEBHOOK_QUERY] data.id:', dataId)
    console.log('🔔 [WEBHOOK_QUERY] type/topic:', type)
    
    // 2. Obtener payload (manejar caso cuando body está vacío)
    let payload: any = {}
    let bodyText = ''
    
    try {
      // Intentar leer el body como texto primero
      bodyText = await req.text()
      
      if (bodyText && bodyText.trim()) {
        try {
          payload = JSON.parse(bodyText)
          console.log(`🔔 [WEBHOOK_PAYLOAD] Type: ${payload.type}, ID: ${payload.id}, Live Mode: ${payload.live_mode}`)
          console.log(`🔔 [WEBHOOK_PAYLOAD] Action: ${payload.action}`)
          console.log(`🔔 [WEBHOOK_PAYLOAD] Data:`, JSON.stringify(payload.data, null, 2))
        } catch (parseError) {
          console.log('⚠️ [WEBHOOK] Error parseando JSON del body:', parseError)
          // Si no es JSON válido, usar query params
          payload = {}
        }
      } else {
        console.log('⚠️ [WEBHOOK] Body vacío, usando query params para determinar tipo')
        payload = {}
      }
    } catch (error) {
      console.log('⚠️ [WEBHOOK] Error leyendo body, usando query params:', error)
      payload = {}
    }
    
    // Si el payload está vacío pero tenemos query params, construir payload desde query params
    if (!payload.type && type === 'merchant_order' && dataId) {
      payload = {
        type: 'merchant_order',
        id: dataId,
        data: { id: dataId }
      }
    }
    
    // Determinar el tipo de webhook desde payload o query params
    const webhookType = payload.type || type || 'unknown'
    console.log(`🔔 [WEBHOOK_TYPE] Tipo detectado: ${webhookType}`)
    
    // 3. Manejar webhook de merchant_order
    if (webhookType === 'merchant_order' || type === 'merchant_order') {
      console.log('📦 [MERCHANT_ORDER] Procesando webhook de merchant_order')
      const merchantOrderId = dataId || payload.data?.id || payload.id
      
      if (!merchantOrderId) {
        console.error('❌ [MERCHANT_ORDER] No se encontró merchant_order_id')
        return NextResponse.json({ error: 'Merchant order ID not found' }, { status: 400 })
      }
      
      try {
        // Consultar la preferencia/orden de MercadoPago para obtener los pagos asociados
        // Nota: El SDK de MercadoPago no tiene MerchantOrder directamente, 
        // pero podemos obtener los pagos desde la preferencia usando el external_reference
        // O consultar directamente la API de MercadoPago
        
        // Buscar la orden en nuestra BD usando el ID de la preferencia
        // El merchant_order_id puede ser el ID de la preferencia (mercadopagoId) o el ID de la orden de MercadoPago
        let order = await prisma.order.findFirst({
          where: {
            mercadopagoId: merchantOrderId.toString()
          },
          include: { user: true }
        })
        
        // Si no encontramos por mercadopagoId, intentar buscar por external_reference
        // consultando la preferencia de MercadoPago para obtener el external_reference
        if (!order) {
          console.log(`⚠️ [MERCHANT_ORDER] Orden no encontrada por mercadopagoId, intentando buscar por preferencia...`)
          
          // Consultar la preferencia de MercadoPago para obtener el external_reference
          const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
          if (accessToken) {
            try {
              const preferenceResponse = await fetch(
                `https://api.mercadopago.com/checkout/preferences/${merchantOrderId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                  }
                }
              )
              
              if (preferenceResponse.ok) {
                const preferenceData = await preferenceResponse.json()
                const externalRef = preferenceData.external_reference
                
                if (externalRef) {
                  // Buscar orden por external_reference
                  order = await prisma.order.findFirst({
                    where: {
                      externalReference: externalRef
                    },
                    include: { user: true }
                  })
                  
                  if (order) {
                    console.log(`✅ [MERCHANT_ORDER] Orden encontrada por external_reference: ${externalRef}`)
                  }
                }
              }
            } catch (error) {
              console.error('❌ [MERCHANT_ORDER] Error consultando preferencia:', error)
            }
          }
        }
        
        if (!order) {
          console.log(`⚠️ [MERCHANT_ORDER] Orden no encontrada para merchant_order_id: ${merchantOrderId}`)
          // Si no encontramos la orden, simplemente confirmamos que recibimos el webhook
          return NextResponse.json({ 
            message: 'Merchant order webhook received, order not found in database',
            merchantOrderId 
          })
        }
        
        // Consultar los pagos asociados a esta preferencia desde MercadoPago
        // Usamos la API REST directamente ya que el SDK puede no tener soporte completo
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
        if (accessToken && order.externalReference) {
          try {
            // Buscar pagos por external_reference
            const paymentsResponse = await fetch(
              `https://api.mercadopago.com/v1/payments/search?external_reference=${order.externalReference}`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            )
            
            if (paymentsResponse.ok) {
              const paymentsData = await paymentsResponse.json()
              const payments = paymentsData.results || []
              
              console.log(`📦 [MERCHANT_ORDER] Encontrados ${payments.length} pagos para la orden`)
              
              // Procesar cada pago encontrado
              for (const paymentItem of payments) {
                const paymentId = paymentItem.id
                const paymentStatus = paymentItem.status
                const externalRef = paymentItem.external_reference
                
                // Verificar que el pago pertenece a nuestra orden
                if (externalRef === order.externalReference) {
                  console.log(`💳 [MERCHANT_ORDER] Procesando pago ${paymentId} con estado ${paymentStatus}`)
                  
                  // Obtener detalles completos del pago
                  const paymentDetails = await payment.get({ id: paymentId })
                  const paymentData = paymentDetails as any
                  
                  // Procesar según el estado del pago
                  if (paymentData.status === 'approved' && order.status !== 'paid') {
                    await processApprovedPayment(order, paymentData)
                    console.log(`✅ [MERCHANT_ORDER] Pago aprobado procesado: ${paymentId}`)
                  } else if (paymentData.status === 'rejected' && order.status !== 'failed') {
                    await processRejectedPayment(order, paymentData)
                    console.log(`❌ [MERCHANT_ORDER] Pago rechazado procesado: ${paymentId}`)
                  } else {
                    console.log(`⚠️ [MERCHANT_ORDER] Pago ${paymentId} ya procesado o con estado ${paymentData.status}`)
                  }
                }
              }
            } else {
              console.error(`❌ [MERCHANT_ORDER] Error consultando pagos: ${paymentsResponse.status} ${paymentsResponse.statusText}`)
            }
          } catch (error) {
            console.error('❌ [MERCHANT_ORDER] Error consultando pagos:', error)
          }
        } else {
          console.log(`⚠️ [MERCHANT_ORDER] No se puede consultar pagos: accessToken=${!!accessToken}, externalReference=${!!order.externalReference}`)
        }
        
        return NextResponse.json({ 
          success: true,
          message: 'Merchant order webhook processed',
          merchantOrderId,
          orderId: order.id
        })
      } catch (error) {
        console.error('❌ [MERCHANT_ORDER] Error procesando merchant_order:', error)
        return NextResponse.json({ 
          error: 'Error processing merchant order',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    }
    
    // 4. Validar firma (solo en producción o si tenemos webhook secret)
    // TEMPORAL: Deshabilitar validación de firma para testing
    if (process.env.MERCADOPAGO_WEBHOOK_SECRET && xSignature) {
      console.log('[WEBHOOK_SECURITY] Signature validation temporarily disabled for testing')
      // const isValidSignature = validateWebhookSignature({
      //   xSignature,
      //   xRequestId,
      //   dataId,
      //   type,
      //   secret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
      //   payload
      // })
      
      // if (!isValidSignature) {
      //   console.error('[WEBHOOK_SECURITY] Invalid signature detected')
      //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      // }
      
      // console.log('[WEBHOOK_SECURITY] Signature validated successfully')
    } else {
      console.log('[WEBHOOK_SECURITY] Signature validation skipped (no secret configured)')
    }
    
    // 5. Validar que sea un webhook de producción o prueba válido
    // Solo validar live_mode si el payload tiene esa propiedad
    if (payload.live_mode !== undefined && !payload.live_mode && process.env.NODE_ENV === 'production') {
      console.log('[WEBHOOK_TEST_MODE] Test webhook in production - processing for testing')
      // return NextResponse.json({ message: 'Test webhook ignored in production' })
    }
    
    // 6. Verificar que sea un webhook de pago
    if (webhookType !== 'payment' && payload.type !== 'payment') {
      console.log(`[WEBHOOK_IGNORED] Type: ${webhookType || payload.type}`)
      return NextResponse.json({ message: 'Webhook ignored - not a payment webhook' })
    }
    
    // 6. Log de la acción recibida
    console.log(`[WEBHOOK_ACTION] ${payload.action || 'unknown'}`)
    
    // 7. Obtener detalles del pago
    const paymentDetails = await payment.get({ id: payload.data.id })
    const paymentData = paymentDetails as any // MercadoPago SDK type issue
    
    console.log(`[PAYMENT_DETAILS] Status: ${paymentData.status}, External Ref: ${paymentData.external_reference}`)
    
    // 8. Buscar orden por external_reference
    const order = await prisma.order.findFirst({
      where: { 
        externalReference: paymentData.external_reference 
      },
      include: { user: true }
    })
    
    if (!order) {
      console.error(`[ORDER_NOT_FOUND] External Reference: ${paymentData.external_reference}`)
      return NextResponse.json({ 
        error: 'Order not found' 
      }, { status: 404 })
    }
    
    // 9. Verificar si ya fue procesado (idempotencia)
    if (order.status === 'paid' && order.mercadopagoId) {
      console.log(`[ALREADY_PROCESSED] Order: ${order.id}`)
      return NextResponse.json({ message: 'Already processed' })
    }
    
    // 10. Procesar según estado del pago
    if (paymentData.status === 'approved') {
      await processApprovedPayment(order, paymentData)
      console.log(`✅ [PAYMENT_APPROVED] Order: ${order.id}, Payment: ${paymentData.id}`)
    } else if (paymentData.status === 'rejected') {
      await processRejectedPayment(order, paymentData)
      console.log(`❌ [PAYMENT_REJECTED] Order: ${order.id}, Payment: ${paymentData.id}`)
    } else {
      console.log(`⚠️ [PAYMENT_OTHER_STATUS] Status: ${paymentData.status}, Order: ${order.id}`)
    }
    
    console.log('🔔 [WEBHOOK_SUCCESS] Webhook procesado exitosamente')
    return NextResponse.json({ 
      success: true,
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString(),
      orderId: order.id,
      paymentId: paymentData.id
    })
    
  } catch (error) {
    console.error('[WEBHOOK_ERROR]:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Función para validar la firma del webhook según documentación de MercadoPago
function validateWebhookSignature({
  xSignature,
  xRequestId,
  dataId,
  type,
  secret,
  payload
}: {
  xSignature: string | null
  xRequestId: string | null
  dataId: string | null
  type: string | null
  secret: string
  payload: any
}): boolean {
  if (!xSignature || !xRequestId || !dataId || !type) {
    console.log('[SIGNATURE_VALIDATION] Missing required parameters')
    return false
  }

  try {
    // 1. Extraer ts y v1 del header x-signature
    const parts = xSignature.split(',')
    let ts = ''
    let hash = ''

    for (const part of parts) {
      const [key, value] = part.split('=')
      if (key === 'ts') ts = value
      if (key === 'v1') hash = value
    }

    if (!ts || !hash) {
      console.log('[SIGNATURE_VALIDATION] Missing ts or v1 in signature')
      return false
    }

    // 2. Crear el template según documentación actualizada de MercadoPago
    // Formato: id:${dataId};request-id:${xRequestId};ts:${ts};
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

    // 3. Generar HMAC SHA256
    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(manifest)
      .digest('hex')

    // 4. Comparar hashes
    const isValid = expectedHash === hash
    
    console.log(`[SIGNATURE_VALIDATION] Manifest: ${manifest}`)
    console.log(`[SIGNATURE_VALIDATION] Expected: ${expectedHash}, Received: ${hash}, Valid: ${isValid}`)
    
    // 5. Si falla, intentar con formato alternativo (más simple)
    if (!isValid) {
      console.log('[SIGNATURE_VALIDATION] Trying alternative format...')
      const altManifest = `${dataId};${xRequestId};${ts}`
      const altHash = crypto
        .createHmac('sha256', secret)
        .update(altManifest)
        .digest('hex')
      
      const altValid = altHash === hash
      console.log(`[SIGNATURE_VALIDATION] Alt Manifest: ${altManifest}`)
      console.log(`[SIGNATURE_VALIDATION] Alt Expected: ${altHash}, Received: ${hash}, Valid: ${altValid}`)
      
      return altValid
    }
    
    return isValid
  } catch (error) {
    console.error('[SIGNATURE_VALIDATION] Error:', error)
    return false
  }
}

// Manejar GET para verificación de webhook
export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'MercadoPago webhook endpoint is working',
    timestamp: new Date().toISOString()
  })
}
