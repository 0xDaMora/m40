import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { processApprovedPayment } from '@/lib/mercadopago/utils'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { orderId } = await params

    // Buscar la orden
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        orderItems: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    // Verificar que la orden pertenece al usuario
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado para esta orden' }, { status: 403 })
    }

    // Verificar que la orden esté pendiente
    if (order.status !== 'pending') {
      return NextResponse.json({ 
        error: 'La orden ya fue procesada',
        currentStatus: order.status 
      }, { status: 400 })
    }

    // Simular pago aprobado (para desarrollo)
    const mockPayment = {
      id: 'mock_payment_' + Date.now(),
      status: 'approved',
      transaction_amount: order.amount,
      payment_method_id: 'credit_card',
      date_approved: new Date().toISOString()
    }

    // Procesar el pago
    await processApprovedPayment(order, mockPayment)

    // Obtener la orden actualizada
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId }
    })

    return NextResponse.json({
      message: 'Orden procesada exitosamente',
      order: updatedOrder
    })

  } catch (error) {
    console.error('Error processing order:', error)
    return NextResponse.json({ 
      error: 'Error al procesar la orden',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
