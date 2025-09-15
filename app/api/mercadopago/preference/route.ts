import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { preference, MERCADOPAGO_CONFIG, validateMercadoPagoConfig } from '@/lib/mercadopago/client'
import { CreatePreferenceRequest, MercadoPagoPreference } from '@/types/mercadopago'

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar configuración de MercadoPago
    validateMercadoPagoConfig()
    
    // 2. Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    // 3. Parsear datos
    const body: CreatePreferenceRequest = await req.json()
    const { orderId, amount, strategyData, userData } = body
    
    if (!orderId || !amount) {
      return NextResponse.json({ 
        error: 'orderId y amount son requeridos' 
      }, { status: 400 })
    }
    
    // 4. Buscar orden
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    })
    
    if (!order) {
      return NextResponse.json({ 
        error: 'Orden no encontrada' 
      }, { status: 404 })
    }
    
    // 5. Verificar que la orden pertenece al usuario
    if (order.userId !== session.user.id) {
      return NextResponse.json({ 
        error: 'No autorizado para esta orden' 
      }, { status: 403 })
    }
    
    // 6. Verificar que la orden no haya expirado
    if (order.expiresAt < new Date()) {
      return NextResponse.json({ 
        error: 'La orden ha expirado' 
      }, { status: 400 })
    }
    
    // 7. Configurar preferencia
    // Para desarrollo local, usar URLs genéricas ya que MercadoPago no puede acceder a localhost
    const isDevelopment = MERCADOPAGO_CONFIG.baseUrl.includes('localhost')
    
    const backUrls = isDevelopment ? {
      success: 'https://www.mercadopago.com.mx/checkout/v1/redirect?from=checkout',
      pending: 'https://www.mercadopago.com.mx/checkout/v1/redirect?from=checkout',
      failure: 'https://www.mercadopago.com.mx/checkout/v1/redirect?from=checkout'
    } : {
      success: `${MERCADOPAGO_CONFIG.baseUrl}/pago-exitoso`,
      pending: `${MERCADOPAGO_CONFIG.baseUrl}/pago-pendiente`,
      failure: `${MERCADOPAGO_CONFIG.baseUrl}/pago-error`
    }
    
    console.log('🔧 URLs de retorno configuradas:', backUrls)
    console.log('🔧 Modo desarrollo:', isDevelopment)
    
    // Crear preferencia ultra-simplificada para debug
    const preferenceData: any = {
      items: [{
        title: 'Test Product',
        quantity: 1,
        unit_price: Number(amount)
      }],
      external_reference: order.externalReference!
    }

    // Solo agregar back_urls si no estamos en desarrollo
    if (!isDevelopment) {
      preferenceData.back_urls = backUrls
      preferenceData.auto_return = 'approved'
    }

    // Habilitar webhooks (funcionará en producción)
    if (!isDevelopment) {
      preferenceData.notification_url = `${MERCADOPAGO_CONFIG.baseUrl}/api/webhooks/mercadopago`
    }

    // Agregar payer solo si tenemos datos válidos
    if (order.user.name && order.user.email) {
      preferenceData.payer = {
        name: order.user.name,
        email: order.user.email
      }
    }
    
    console.log('🔧 Preferencia configurada:', JSON.stringify(preferenceData, null, 2))
    
    // 8. Crear preferencia en MercadoPago
    console.log('🔧 Intentando crear preferencia en MercadoPago...')
    console.log('🔧 Access Token configurado:', !!MERCADOPAGO_CONFIG.accessToken)
    console.log('🔧 Public Key configurado:', !!MERCADOPAGO_CONFIG.publicKey)
    
    // Verificar que las credenciales estén configuradas
    if (!MERCADOPAGO_CONFIG.accessToken) {
      console.error('❌ MERCADOPAGO_ACCESS_TOKEN no está configurado')
      return NextResponse.json({ 
        error: 'Credenciales de MercadoPago no configuradas' 
      }, { status: 500 })
    }
    
    if (!MERCADOPAGO_CONFIG.publicKey) {
      console.error('❌ MERCADOPAGO_PUBLIC_KEY no está configurado')
      return NextResponse.json({ 
        error: 'Public Key de MercadoPago no configurado' 
      }, { status: 500 })
    }
    
    console.log('🔧 Access Token (primeros 10 caracteres):', MERCADOPAGO_CONFIG.accessToken.substring(0, 10))
    console.log('🔧 Public Key (primeros 10 caracteres):', MERCADOPAGO_CONFIG.publicKey.substring(0, 10))
    
    try {
      const response = await preference.create({ body: preferenceData })
      console.log('✅ Preferencia creada exitosamente:', response.id)
      
      // 9. Actualizar orden con ID de MercadoPago
      await prisma.order.update({
        where: { id: order.id },
        data: { 
          mercadopagoId: response.id,
          updatedAt: new Date()
        }
      })
      
      return NextResponse.json({ 
        init_point: response.init_point,
        preference_id: response.id,
        order_id: order.id
      })
      
    } catch (error: any) {
      console.error('❌ Error creando preferencia:', error)
      console.error('❌ Error details:', {
        message: error.message,
        status: error.status,
        cause: error.cause,
        errors: error.errors
      })
      
      return NextResponse.json({ 
        error: 'Error al crear preferencia en MercadoPago',
        details: error.message,
        status: error.status || 500
      }, { status: error.status || 500 })
    }
    
  } catch (error) {
    console.error('Error creating preference:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}
