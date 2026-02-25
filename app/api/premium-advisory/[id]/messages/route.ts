import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

const MAX_MESSAGE_LENGTH = 5000
const MIN_MESSAGE_LENGTH = 10
const MAX_MESSAGES_PER_HOUR = 10

// Validar que el usuario sea Premium
async function validatePremiumUser(session: any) {
  if (!session?.user?.id) {
    return { valid: false, error: "No autenticado" }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscription: true }
  })

  if (!user || user.subscription !== 'premium') {
    return { valid: false, error: "Solo usuarios Premium pueden acceder a asesorías" }
  }

  return { valid: true }
}

// Verificar rate limiting de mensajes
async function checkMessageRateLimit(advisoryId: string): Promise<boolean> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const recentMessages = await prisma.premiumAdvisoryMessage.count({
      where: {
        advisoryId,
        senderType: 'user',
        createdAt: {
          gte: oneHourAgo
        }
      }
    })
    
    return recentMessages < MAX_MESSAGES_PER_HOUR
  } catch (error) {
    console.error("Error checking message rate limit:", error)
    return true
  }
}

// POST - Enviar nuevo mensaje a una asesoría
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Validar usuario Premium
    const validation = await validatePremiumUser(session)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.error === "No autenticado" ? 401 : 403 }
      )
    }

    const advisoryId = params.id
    const body = await request.json()

    // Validar que el advisory existe y pertenece al usuario
    const advisory = await prisma.premiumAdvisory.findUnique({
      where: { id: advisoryId },
      select: { userId: true, status: true }
    })

    if (!advisory) {
      return NextResponse.json(
        { error: "Asesoría no encontrada" },
        { status: 404 }
      )
    }

    if (advisory.userId !== session!.user!.id) {
      return NextResponse.json(
        { error: "No tienes permiso para enviar mensajes a esta asesoría" },
        { status: 403 }
      )
    }

    // No permitir mensajes en asesorías resueltas
    if (advisory.status === 'resolved') {
      return NextResponse.json(
        { error: "Esta asesoría ya está resuelta. Crea una nueva si necesitas más ayuda." },
        { status: 400 }
      )
    }

    // Validar mensaje
    const { message } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: "El mensaje es requerido" },
        { status: 400 }
      )
    }

    const sanitizedMessage = message.trim()

    if (sanitizedMessage.length < MIN_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `El mensaje debe tener al menos ${MIN_MESSAGE_LENGTH} caracteres` },
        { status: 400 }
      )
    }

    if (sanitizedMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `El mensaje no puede exceder ${MAX_MESSAGE_LENGTH} caracteres` },
        { status: 400 }
      )
    }

    // Verificar rate limiting
    const canProceed = await checkMessageRateLimit(advisoryId)
    if (!canProceed) {
      return NextResponse.json(
        { error: `Has alcanzado el límite de ${MAX_MESSAGES_PER_HOUR} mensajes por hora` },
        { status: 429 }
      )
    }

    // Crear mensaje
    const newMessage = await prisma.premiumAdvisoryMessage.create({
      data: {
        advisoryId,
        senderType: 'user',
        senderId: session!.user!.id,
        message: sanitizedMessage,
        isRead: false
      }
    })

    // Actualizar timestamp del advisory
    await prisma.premiumAdvisory.update({
      where: { id: advisoryId },
      data: { updatedAt: new Date() }
    })

    // TODO: Enviar notificación al admin (Fase 6)

    return NextResponse.json({
      success: true,
      message: "Mensaje enviado exitosamente",
      data: newMessage
    }, { status: 201 })
  } catch (error: any) {
    console.error("Error al enviar mensaje:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
