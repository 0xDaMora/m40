import { NextRequest, NextResponse } from 'next/server'

// Endpoint de prueba muy simple para webhooks
export async function POST(req: NextRequest) {
  try {
    console.log('🧪 [TEST_WEBHOOK_SIMPLE] Webhook de prueba recibido')
    
    const body = await req.text()
    console.log('🧪 [TEST_WEBHOOK_SIMPLE] Body:', body)
    
    const headers: Record<string, string> = {}
    req.headers.forEach((value, key) => {
      headers[key] = value
    })
    console.log('🧪 [TEST_WEBHOOK_SIMPLE] Headers:', JSON.stringify(headers, null, 2))
    
    return NextResponse.json({
      success: true,
      message: 'Test webhook received successfully',
      timestamp: new Date().toISOString(),
      received: {
        bodyLength: body.length,
        headersCount: Object.keys(headers).length
      }
    })
    
  } catch (error) {
    console.error('❌ [TEST_WEBHOOK_SIMPLE] Error:', error)
    return NextResponse.json({
      error: 'Error in test webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test webhook endpoint',
    usage: 'POST to this endpoint to test webhook functionality'
  })
}
