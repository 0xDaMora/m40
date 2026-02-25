import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

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

// GET - Obtener detalles de una asesoría específica con todos los mensajes
export async function GET(
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

    // Obtener advisory con mensajes
    const advisory = await prisma.premiumAdvisory.findUnique({
      where: {
        id: advisoryId
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        },
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

    // Verificar que el advisory pertenece al usuario
    if (advisory.userId !== session!.user!.id) {
      return NextResponse.json(
        { error: "No tienes permiso para ver esta asesoría" },
        { status: 403 }
      )
    }

    // Marcar mensajes del admin como leídos
    await prisma.premiumAdvisoryMessage.updateMany({
      where: {
        advisoryId,
        senderType: 'admin',
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({
      success: true,
      advisory
    })
  } catch (error: any) {
    console.error("Error al obtener asesoría:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
