import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { MERCADOPAGO_CONFIG } from '@/lib/mercadopago/client'

export async function GET() {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar configuración
    const config = {
      hasAccessToken: !!MERCADOPAGO_CONFIG.accessToken,
      accessTokenPrefix: MERCADOPAGO_CONFIG.accessToken?.substring(0, 10),
      hasPublicKey: !!MERCADOPAGO_CONFIG.publicKey,
      publicKeyPrefix: MERCADOPAGO_CONFIG.publicKey?.substring(0, 10),
      hasBaseUrl: !!MERCADOPAGO_CONFIG.baseUrl,
      baseUrl: MERCADOPAGO_CONFIG.baseUrl,
      isTestMode: MERCADOPAGO_CONFIG.accessToken?.startsWith('APP_USR-')
    }

    return NextResponse.json({
      message: 'Configuración de MercadoPago',
      config,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error testing MercadoPago config:', error)
    return NextResponse.json({ 
      error: 'Error al verificar configuración',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
