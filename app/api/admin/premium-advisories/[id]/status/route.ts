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

// PATCH - Actualizar estado de una asesoría (admin)
export async function PATCH(
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
    const { status } = body

    // Validar status
    const validStatuses = ['pending', 'in_progress', 'resolved']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Verificar que el advisory existe
    const advisory = await prisma.premiumAdvisory.findUnique({
      where: { id: advisoryId }
    })

    if (!advisory) {
      return NextResponse.json(
        { error: "Asesoría no encontrada" },
        { status: 404 }
      )
    }

    // Actualizar estado
    const updatedAdvisory = await prisma.premiumAdvisory.update({
      where: { id: advisoryId },
      data: {
        status,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: "Estado actualizado exitosamente",
      advisory: updatedAdvisory
    })
  } catch (error: any) {
    console.error("Error al actualizar estado (admin):", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
