import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

const MAX_MESSAGE_LENGTH = 5000
const MIN_MESSAGE_LENGTH = 10

// Verificar que el usuario sea admin
async function verifyAdminAccess(session: any) {
  if (!session?.user?.email) {
    return false
  }
  
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  return adminEmails.includes(session.user.email)
}

// POST - Responder a una asesoría (admin)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    const isAdmin = await verifyAdminAccess(session)
    if (!isAdmin) {
      return NextResponse.json(
        { error: "No tienes permisos de administrador" },
        { status: 403 }
      )
    }

    const advisoryId = params.id
    const body = await request.json()

    // Verificar que el advisory existe
    const advisory = await prisma.premiumAdvisory.findUnique({
      where: { id: advisoryId },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    if (!advisory) {
      return NextResponse.json(
        { error: "Asesoría no encontrada" },
        { status: 404 }
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

    // Crear mensaje del admin
    const newMessage = await prisma.premiumAdvisoryMessage.create({
      data: {
        advisoryId,
        senderType: 'admin',
        senderId: session.user.email, // Guardar email del admin
        message: sanitizedMessage,
        isRead: false // Usuario no lo ha leído aún
      }
    })

    // Actualizar advisory status si es necesario
    const updates: any = {
      updatedAt: new Date()
    }

    if (advisory.status === 'pending') {
      updates.status = 'in_progress'
    }

    await prisma.premiumAdvisory.update({
      where: { id: advisoryId },
      data: updates
    })

    // TODO: Enviar notificación por email al usuario (Fase 6)
    // sendEmailToUser(advisory.user.email, advisory.user.name, newMessage.message)

    return NextResponse.json({
      success: true,
      message: "Respuesta enviada exitosamente",
      data: newMessage
    }, { status: 201 })
  } catch (error: any) {
    console.error("Error al responder asesoría (admin):", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
