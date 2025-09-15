import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const { orderId } = await params
    
    // Buscar orden por ID
    const order = await prisma.order.findFirst({
      where: { 
        id: orderId,
        userId: session.user.id // Solo órdenes del usuario autenticado
      },
      include: {
        orderItems: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })
    
    if (!order) {
      return NextResponse.json({ 
        error: 'Orden no encontrada' 
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: true,
      order 
    })
    
  } catch (error) {
    console.error('Error fetching order by id:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
