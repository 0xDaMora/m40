import { prisma } from '@/lib/db/prisma'
import { generarCodigoEstrategia } from '@/lib/utils/strategy'

// Generar número de orden único
export const generateOrderNumber = async (): Promise<string> => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  
  // Usar timestamp para evitar duplicados
  const timestamp = Date.now().toString().slice(-6) // Últimos 6 dígitos del timestamp
  
  // Intentar crear un número único con reintentos
  let attempts = 0
  const maxAttempts = 5
  
  while (attempts < maxAttempts) {
    const sequence = String(attempts + 1).padStart(3, '0')
    const orderNumber = `ORD-${year}${month}-${sequence}-${timestamp}`
    
    // Verificar si ya existe
    const existing = await prisma.order.findUnique({
      where: { orderNumber }
    })
    
    if (!existing) {
      return orderNumber
    }
    
    attempts++
  }
  
  // Fallback: usar timestamp completo si hay muchos intentos
  return `ORD-${year}${month}-${timestamp}`
}

// Validar datos de orden
export const validateOrderData = (data: any): string[] => {
  const errors: string[] = []
  
  if (!data.amount || data.amount <= 0) {
    errors.push('Amount debe ser mayor a 0')
  }
  
  if (!data.planType || !['basic', 'premium'].includes(data.planType)) {
    errors.push('Plan type inválido')
  }
  
  if (data.planType === 'basic' && !data.strategyData) {
    errors.push('Strategy data es requerido para plan básico')
  }
  
  return errors
}

// Procesar pago aprobado
export const processApprovedPayment = async (order: any, payment: any) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Actualizar orden
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'paid',
        mercadopagoId: payment.id.toString(),
        paymentMethod: payment.payment_method_id,
        paidAt: new Date()
      }
    })
    
    // 2. Crear estrategia guardada (si es plan básico)
    if (order.planType === 'basic' && order.strategyData && order.userData) {
      // Generar código de estrategia con formato correcto
      let strategyCode
      
      if (order.strategyData.familyMemberId) {
        // Formato: integration_[familyMemberId]_[estrategia]_[uma]_[meses]_[edad]_[mesAño]
        const fechaInicio = order.userData.inicioM40 || order.strategyData.inicioM40 || "2024-02-01"
        const fecha = new Date(fechaInicio)
        const mes = fecha.getMonth() + 1
        const año = fecha.getFullYear()
        const mesAño = `${mes.toString().padStart(2, '0')}${año}`
        
        strategyCode = `integration_${order.strategyData.familyMemberId}_${order.strategyData.estrategia}_${order.strategyData.umaElegida}_${order.strategyData.mesesM40}_${order.userData.edad}_${mesAño}`
      } else {
        // Fallback al formato anterior
        strategyCode = generarCodigoEstrategia('compra', order.strategyData)
      }
      
      await tx.estrategiaGuardada.create({
        data: {
          userId: order.userId,
          familyMemberId: order.strategyData.familyMemberId,
          debugCode: strategyCode,
          datosEstrategia: order.strategyData,
          datosUsuario: order.userData,
          activa: true
        }
      })
      
      // 3. Actualizar orden con código de estrategia
      await tx.order.update({
        where: { id: order.id },
        data: { strategyCode: strategyCode }
      })
    }
    
    // 4. Actualizar usuario a premium (si es plan premium)
    if (order.planType === 'premium') {
      await tx.user.update({
        where: { id: order.userId },
        data: { subscription: 'premium' }
      })
    }
    
    console.log(`[PAYMENT_APPROVED] Order: ${order.id}, Payment: ${payment.id}`)
    return updatedOrder
  })
}

// Procesar pago rechazado
export const processRejectedPayment = async (order: any, payment: any) => {
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'failed',
      mercadopagoId: payment.id.toString(),
      paymentMethod: payment.payment_method_id
    }
  })
  
  console.log(`[PAYMENT_REJECTED] Order: ${order.id}, Payment: ${payment.id}`)
}

// Log de eventos de pago
export const logPaymentEvent = (event: string, data: any) => {
  console.log(`[PAYMENT_EVENT] ${event}:`, {
    timestamp: new Date().toISOString(),
    orderId: data.orderId,
    paymentId: data.paymentId,
    status: data.status,
    userId: data.userId
  })
}
