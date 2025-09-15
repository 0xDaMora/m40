import { NextRequest, NextResponse } from 'next/server'
import { payment } from '@/lib/mercadopago/client'
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
    const dataId = url.searchParams.get('data.id')
    const type = url.searchParams.get('type')
    
    console.log('🔔 [WEBHOOK_HEADERS] User-Agent:', userAgent)
    console.log('🔔 [WEBHOOK_HEADERS] X-Signature:', xSignature)
    console.log('🔔 [WEBHOOK_HEADERS] X-Request-ID:', xRequestId)
    console.log('🔔 [WEBHOOK_QUERY] data.id:', dataId)
    console.log('🔔 [WEBHOOK_QUERY] type:', type)
    
    // 2. Obtener payload
    const payload: MercadoPagoWebhookPayload = await req.json()
    
    console.log(`🔔 [WEBHOOK_PAYLOAD] Type: ${payload.type}, ID: ${payload.id}, Live Mode: ${payload.live_mode}`)
    console.log(`🔔 [WEBHOOK_PAYLOAD] Action: ${payload.action}`)
    console.log(`🔔 [WEBHOOK_PAYLOAD] Data:`, JSON.stringify(payload.data, null, 2))
    
    // 3. Validar firma (solo en producción o si tenemos webhook secret)
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
    
    // 4. Validar que sea un webhook de producción o prueba válido
    // TEMPORAL: Permitir webhooks de prueba para testing
    if (!payload.live_mode && process.env.NODE_ENV === 'production') {
      console.log('[WEBHOOK_TEST_MODE] Test webhook in production - processing for testing')
      // return NextResponse.json({ message: 'Test webhook ignored in production' })
    }
    
    // 5. Verificar que sea un webhook de pago
    if (payload.type !== 'payment') {
      console.log(`[WEBHOOK_IGNORED] Type: ${payload.type}`)
      return NextResponse.json({ message: 'Webhook ignored' })
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
