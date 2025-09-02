import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { plan, strategyData, userData } = await request.json()

    // Simular procesamiento de pago (aquí iría la integración con Stripe)
    console.log('Simulando compra:', { plan, strategyData, userData })

    // Actualizar el plan del usuario en la base de datos
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { 
        subscription: plan === 'premium' ? 'premium' : 'basic',
        // Aquí podrías agregar más campos como fecha de compra, etc.
      }
    })

    // Crear un registro de la compra
    const purchaseRecord = await prisma.purchase.create({
      data: {
        userId: updatedUser.id,
        plan: plan,
        amount: plan === 'premium' ? 200 : 50,
        status: 'completed',
        strategyData: strategyData,
        userData: userData
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Compra procesada exitosamente',
      purchaseId: purchaseRecord.id,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        subscription: updatedUser.subscription
      }
    })

  } catch (error) {
    console.error('Error en simulate-purchase:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}
