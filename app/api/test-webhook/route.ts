import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'

// Endpoint para simular webhooks de MercadoPago (solo para desarrollo)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { paymentId, status = 'approved' } = await req.json()

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId es requerido' }, { status: 400 })
    }

    // Simular webhook payload
    const webhookPayload = {
      id: Date.now(),
      live_mode: false,
      type: 'payment',
      date_created: new Date().toISOString(),
      user_id: 123456789,
      api_version: 'v1',
      action: 'payment.updated',
      data: {
        id: paymentId
      }
    }

    // Simular headers
    const headers = {
      'x-signature': 'ts=1742505638683,v1=test_signature_for_development',
      'x-request-id': 'test-request-' + Date.now(),
      'content-type': 'application/json'
    }

    // Crear URL con query parameters
    const testUrl = new URL('/api/webhooks/mercadopago', req.url)
    testUrl.searchParams.set('data.id', paymentId)
    testUrl.searchParams.set('type', 'payment')

    console.log('🧪 [TEST_WEBHOOK] Simulando webhook para payment:', paymentId)
    console.log('🧪 [TEST_WEBHOOK] Payload:', JSON.stringify(webhookPayload, null, 2))

    // Hacer llamada interna al webhook
    const webhookResponse = await fetch(testUrl.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify(webhookPayload)
    })

    const webhookResult = await webhookResponse.json()

    return NextResponse.json({
      message: 'Webhook simulado exitosamente',
      webhookPayload,
      webhookResponse: webhookResult,
      status: webhookResponse.status
    })

  } catch (error) {
    console.error('Error simulando webhook:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

// Endpoint GET para mostrar información sobre el endpoint de prueba
export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de prueba para webhooks de MercadoPago',
    usage: {
      method: 'POST',
      body: {
        paymentId: 'ID del pago a simular (requerido)',
        status: 'Estado del pago (opcional, default: approved)'
      },
      example: {
        paymentId: '123456789',
        status: 'approved'
      }
    },
    note: 'Este endpoint solo funciona en desarrollo y requiere autenticación'
  })
}
