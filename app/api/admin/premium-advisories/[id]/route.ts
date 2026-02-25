import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

// Verificar que el usuario sea admin
async function verifyAdminAccess(session: any) {
  if (!session?.user?.email) {
    return false
  }
  
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  return adminEmails.includes(session.user.email)
}

// GET - Ver detalles de una asesoría específica (admin)
export async function GET(
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

    const advisory = await prisma.premiumAdvisory.findUnique({
      where: { id: advisoryId },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            subscription: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
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

    // Marcar mensajes del usuario como leídos por el admin
    await prisma.premiumAdvisoryMessage.updateMany({
      where: {
        advisoryId,
        senderType: 'user',
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
    console.error("Error al obtener asesoría (admin):", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
