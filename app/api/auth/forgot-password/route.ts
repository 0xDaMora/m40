import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      )
    }

    // Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      // Pero tampoco creamos tokens para emails inexistentes
      return NextResponse.json(
        { message: "Si el email existe, recibirás un enlace de recuperación" },
        { status: 200 }
      )
    }

    // Generar token único
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Eliminar tokens anteriores para este email
    await prisma.passwordResetToken.deleteMany({
      where: { email }
    })

    // Crear nuevo token solo si el usuario existe
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt
      }
    })

    // Enviar email (por ahora solo simulamos)
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    
    console.log('🔗 Enlace de recuperación:', resetUrl)
    console.log('📧 Email:', email)
    console.log('⏰ Expira:', expiresAt)

    // TODO: Implementar envío real de email
    // Por ahora solo simulamos el envío

    return NextResponse.json(
      { 
        message: "Si el email existe, recibirás un enlace de recuperación",
        // Solo en desarrollo
        resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("Error en forgot-password:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
