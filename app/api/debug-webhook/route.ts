import { NextRequest, NextResponse } from 'next/server'

// Endpoint temporal para diagnosticar webhooks
export async function POST(req: NextRequest) {
  try {
    console.log('🔍 [DEBUG_WEBHOOK] === INICIO DEBUG WEBHOOK ===')
    
    // 1. Log de headers
    const headers: Record<string, string> = {}
    req.headers.forEach((value, key) => {
      headers[key] = value
    })
    console.log('🔍 [DEBUG_WEBHOOK] Headers recibidos:', JSON.stringify(headers, null, 2))
    
    // 2. Log de query parameters
    const url = new URL(req.url)
    const queryParams: Record<string, string> = {}
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value
    })
    console.log('🔍 [DEBUG_WEBHOOK] Query params:', JSON.stringify(queryParams, null, 2))
    
    // 3. Log del body
    const body = await req.text()
    console.log('🔍 [DEBUG_WEBHOOK] Body recibido:', body)
    
    // 4. Intentar parsear JSON
    let parsedBody
    try {
      parsedBody = JSON.parse(body)
      console.log('🔍 [DEBUG_WEBHOOK] Body parseado:', JSON.stringify(parsedBody, null, 2))
    } catch (e) {
      console.log('🔍 [DEBUG_WEBHOOK] Error parseando JSON:', e)
    }
    
    // 5. Log de información del request
    console.log('🔍 [DEBUG_WEBHOOK] URL completa:', req.url)
    console.log('🔍 [DEBUG_WEBHOOK] Método:', req.method)
    console.log('🔍 [DEBUG_WEBHOOK] User Agent:', req.headers.get('user-agent'))
    console.log('🔍 [DEBUG_WEBHOOK] Content-Type:', req.headers.get('content-type'))
    
    // 6. Verificar si es de MercadoPago
    const userAgent = req.headers.get('user-agent') || ''
    const isMercadoPago = userAgent.includes('restclient-node') || userAgent.includes('MercadoPago')
    console.log('🔍 [DEBUG_WEBHOOK] ¿Es de MercadoPago?', isMercadoPago)
    
    // 7. Verificar headers específicos de MercadoPago
    const xSignature = req.headers.get('x-signature')
    const xRequestId = req.headers.get('x-request-id')
    console.log('🔍 [DEBUG_WEBHOOK] X-Signature:', xSignature)
    console.log('🔍 [DEBUG_WEBHOOK] X-Request-ID:', xRequestId)
    
    console.log('🔍 [DEBUG_WEBHOOK] === FIN DEBUG WEBHOOK ===')
    
    return NextResponse.json({
      success: true,
      message: 'Webhook debug completado',
      timestamp: new Date().toISOString(),
      received: {
        headers: Object.keys(headers).length,
        queryParams: Object.keys(queryParams).length,
        bodyLength: body.length,
        isMercadoPago,
        hasSignature: !!xSignature,
        hasRequestId: !!xRequestId
      }
    })
    
  } catch (error) {
    console.error('❌ [DEBUG_WEBHOOK] Error en debug:', error)
    return NextResponse.json({
      error: 'Error en debug webhook',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'Endpoint de debug para webhooks',
    usage: 'POST a este endpoint para diagnosticar webhooks',
    timestamp: new Date().toISOString()
  })
}
