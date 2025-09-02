import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando actualización de plan...')
    
    const session = await getServerSession(authOptions)
    console.log('Session obtenida:', !!session, 'Email:', session?.user?.email)
    
    if (!session?.user?.email) {
      console.log('No hay sesión válida')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Body recibido:', body)
    
    const { subscription } = body

    if (subscription !== 'premium') {
      console.log('Subscription no válida:', subscription)
      return NextResponse.json({ error: 'Subscription no válida' }, { status: 400 })
    }

    console.log('Actualizando usuario:', session.user.email, 'a subscription:', subscription)

    // Actualizar el usuario en la base de datos
    const updatedUser = await prisma.user.update({
      where: {
        email: session.user.email
      },
      data: {
        subscription: 'premium'
      }
    })

    console.log('Usuario actualizado exitosamente:', updatedUser.id, updatedUser.subscription)

    return NextResponse.json({ 
      success: true, 
      message: 'Plan actualizado exitosamente',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        subscription: updatedUser.subscription
      }
    })

  } catch (error) {
    console.error('Error actualizando plan:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
