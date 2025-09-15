import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { generateOrderNumber, validateOrderData } from '@/lib/mercadopago/utils'
import { CreateOrderRequest } from '@/types/mercadopago'

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    // 2. Parsear y validar datos
    const body: CreateOrderRequest = await req.json()
    const errors = validateOrderData(body)
    
    if (errors.length > 0) {
      return NextResponse.json({ 
        error: 'Datos inválidos', 
        details: errors 
      }, { status: 400 })
    }
    
    // 3. Generar número de orden único
    const orderNumber = await generateOrderNumber()
    
    // 4. Crear orden en la base de datos
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        orderNumber: orderNumber,
        status: 'pending',
        planType: body.planType,
        amount: body.amount,
        strategyData: body.strategyData || null,
        userData: body.userData || null,
        externalReference: `order_${orderNumber}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      }
    })
    
    // 5. Crear items de la orden
    if (body.planType === 'basic') {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          itemType: 'strategy',
          itemName: 'Estrategia Modalidad 40',
          quantity: 1,
          unitPrice: body.amount,
          totalPrice: body.amount
        }
      })
    } else {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          itemType: 'premium',
          itemId: 'premium',
          itemName: 'Plan Premium Modalidad 40',
          quantity: 1,
          unitPrice: body.amount,
          totalPrice: body.amount
        }
      })
    }
    
    // 6. Log de creación
    console.log(`[ORDER_CREATED] Order ID: ${order.id}, Number: ${orderNumber}`)
    
    return NextResponse.json({ 
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        amount: order.amount,
        planType: order.planType,
        expiresAt: order.expiresAt
      }
    })
    
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    // Obtener órdenes del usuario
    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        orderItems: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10 // Últimas 10 órdenes
    })
    
    return NextResponse.json({ 
      success: true,
      orders 
    })
    
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
