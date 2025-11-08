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
        // Consultar la merchant_order de MercadoPago para obtener el preference_id
        // El merchant_order_id es el ID de la orden de MercadoPago, no el preference_id
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
        if (!accessToken) {
          console.error('❌ [MERCHANT_ORDER] Access token no configurado')
          return NextResponse.json({ error: 'Access token not configured' }, { status: 500 })
        }
        
        // Consultar merchant_order de MercadoPago
        let merchantOrderData: any = null
        let preferenceId: string | null = null
        let externalRef: string | null = null
        
        try {
          console.log(`🔍 [MERCHANT_ORDER] Consultando merchant_order: ${merchantOrderId}`)
          const merchantOrderResponse = await fetch(
            `https://api.mercadopago.com/merchant_orders/${merchantOrderId}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          )
          
          if (merchantOrderResponse.ok) {
            merchantOrderData = await merchantOrderResponse.json()
            preferenceId = merchantOrderData.preference_id || null
            externalRef = merchantOrderData.external_reference || null
            
            console.log(`✅ [MERCHANT_ORDER] Merchant order obtenida:`, {
              preferenceId,
              externalRef,
              orderStatus: merchantOrderData.status,
              paymentsCount: merchantOrderData.payments?.length || 0
            })
          } else {
            const errorText = await merchantOrderResponse.text()
            console.error(`❌ [MERCHANT_ORDER] Error consultando merchant_order: ${merchantOrderResponse.status}`, errorText)
            return NextResponse.json({ 
              error: 'Merchant order not found',
              details: `Status: ${merchantOrderResponse.status}`
            }, { status: merchantOrderResponse.status })
          }
        } catch (error) {
          console.error('❌ [MERCHANT_ORDER] Error consultando merchant_order:', error)
          return NextResponse.json({ 
            error: 'Error fetching merchant order',
            details: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 })
        }
        
        // Buscar la orden en nuestra BD usando el preference_id
        let order = null
        if (preferenceId) {
          console.log(`🔍 [MERCHANT_ORDER] Buscando orden por preference_id: ${preferenceId}`)
          order = await prisma.order.findFirst({
            where: {
              mercadopagoId: preferenceId
            },
            include: { user: true }
          })
          
          if (order) {
            console.log(`✅ [MERCHANT_ORDER] Orden encontrada por preference_id: ${order.id}`)
          }
        }
        
        // Si no encontramos por preference_id, intentar por external_reference
        if (!order && externalRef) {
          console.log(`🔍 [MERCHANT_ORDER] Buscando orden por external_reference: ${externalRef}`)
          order = await prisma.order.findFirst({
            where: {
              externalReference: externalRef
            },
            include: { user: true }
          })
          
          if (order) {
            console.log(`✅ [MERCHANT_ORDER] Orden encontrada por external_reference: ${order.id}`)
          }
        }
        
        if (!order) {
          console.log(`⚠️ [MERCHANT_ORDER] Orden no encontrada para merchant_order_id: ${merchantOrderId}`)
          console.log(`⚠️ [MERCHANT_ORDER] Datos disponibles:`, {
            preferenceId,
            externalRef,
            merchantOrderStatus: merchantOrderData?.status
          })
          // Si no encontramos la orden, simplemente confirmamos que recibimos el webhook
          return NextResponse.json({ 
            message: 'Merchant order webhook received, order not found in database',
            merchantOrderId,
            preferenceId,
            externalRef
          })
        }
        
        // Obtener pagos desde la merchant_order o consultar por external_reference
        const paymentsToProcess: any[] = []
        
        // Primero, intentar obtener pagos directamente desde la merchant_order
        if (merchantOrderData?.payments && Array.isArray(merchantOrderData.payments)) {
          console.log(`📦 [MERCHANT_ORDER] Obteniendo pagos desde merchant_order: ${merchantOrderData.payments.length} pagos`)
          for (const paymentInfo of merchantOrderData.payments) {
            if (paymentInfo.id) {
              paymentsToProcess.push({
                id: paymentInfo.id,
                status: paymentInfo.status,
                external_reference: externalRef || order.externalReference
              })
            }
          }
        }
        
        // Si no hay pagos en la merchant_order, consultar por external_reference
        if (paymentsToProcess.length === 0 && order.externalReference) {
          console.log(`🔍 [MERCHANT_ORDER] Consultando pagos por external_reference: ${order.externalReference}`)
          try {
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
              
              console.log(`📦 [MERCHANT_ORDER] Encontrados ${payments.length} pagos por external_reference`)
              
              for (const paymentItem of payments) {
                if (paymentItem.external_reference === order.externalReference) {
                  paymentsToProcess.push(paymentItem)
                }
              }
            } else {
              console.error(`❌ [MERCHANT_ORDER] Error consultando pagos: ${paymentsResponse.status} ${paymentsResponse.statusText}`)
            }
          } catch (error) {
            console.error('❌ [MERCHANT_ORDER] Error consultando pagos:', error)
          }
        }
        
        // Procesar cada pago encontrado
        if (paymentsToProcess.length > 0) {
          console.log(`💳 [MERCHANT_ORDER] Procesando ${paymentsToProcess.length} pagos`)
          
          for (const paymentItem of paymentsToProcess) {
            const paymentId = paymentItem.id
            const paymentStatus = paymentItem.status
            
            try {
              console.log(`💳 [MERCHANT_ORDER] Procesando pago ${paymentId} con estado ${paymentStatus}`)
              
              // Obtener detalles completos del pago
              const paymentDetails = await payment.get({ id: paymentId })
              const paymentData = paymentDetails as any
              
              // Verificar que el pago pertenece a nuestra orden
              if (paymentData.external_reference === order.externalReference) {
                // Procesar según el estado del pago
                if (paymentData.status === 'approved' && order.status !== 'paid') {
                  await processApprovedPayment(order, paymentData)
                  
                  // Actualizar preferencia con payment_id en metadatos para tracking de calidad
                  if (order.mercadopagoId && paymentData.id) {
                    try {
                      await preference.update({
                        id: order.mercadopagoId,
                        body: {
                          metadata: {
                            payment_id: paymentData.id.toString(),
                            order_id: order.id,
                            updated_at: new Date().toISOString()
                          }
                        }
                      })
                      console.log(`✅ [PAYMENT_TRACKING] Preferencia actualizada con payment_id: ${paymentData.id}`)
                    } catch (error) {
                      console.error(`⚠️ [PAYMENT_TRACKING] Error actualizando preferencia:`, error)
                      // No fallar el procesamiento si la actualización de metadatos falla
                    }
                  }
                  
                  console.log(`✅ [MERCHANT_ORDER] Pago aprobado procesado: ${paymentId}`)
                } else if (paymentData.status === 'rejected' && order.status !== 'failed') {
                  await processRejectedPayment(order, paymentData)
                  console.log(`❌ [MERCHANT_ORDER] Pago rechazado procesado: ${paymentId}`)
                } else {
                  console.log(`⚠️ [MERCHANT_ORDER] Pago ${paymentId} ya procesado o con estado ${paymentData.status}`)
                }
              } else {
                console.log(`⚠️ [MERCHANT_ORDER] Pago ${paymentId} no pertenece a esta orden (external_ref: ${paymentData.external_reference})`)
              }
            } catch (error) {
              console.error(`❌ [MERCHANT_ORDER] Error procesando pago ${paymentId}:`, error)
            }
          }
        } else {
          console.log(`⚠️ [MERCHANT_ORDER] No se encontraron pagos para procesar`)
        }
        
        return NextResponse.json({ 
          success: true,
          message: 'Merchant order webhook processed',
          merchantOrderId,
          preferenceId,
          orderId: order.id,
          paymentsProcessed: paymentsToProcess.length
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
      
      // Actualizar preferencia con payment_id en metadatos para tracking de calidad
      if (order.mercadopagoId && paymentData.id) {
        try {
          await preference.update({
            id: order.mercadopagoId,
            body: {
              metadata: {
                payment_id: paymentData.id.toString(),
                order_id: order.id,
                updated_at: new Date().toISOString()
              }
            }
          })
          console.log(`✅ [PAYMENT_TRACKING] Preferencia actualizada con payment_id: ${paymentData.id}`)
        } catch (error) {
          console.error(`⚠️ [PAYMENT_TRACKING] Error actualizando preferencia:`, error)
          // No fallar el procesamiento si la actualización de metadatos falla
        }
      }
      
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
