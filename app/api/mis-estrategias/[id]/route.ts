import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    // Obtener el usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Verificar que la estrategia pertenece al usuario
    const estrategia = await prisma.estrategiaGuardada.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!estrategia) {
      return NextResponse.json({ error: "Estrategia no encontrada" }, { status: 404 })
    }

    // Eliminar la estrategia (marcar como inactiva en lugar de eliminar físicamente)
    await prisma.estrategiaGuardada.update({
      where: { id: id },
      data: { activa: false }
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("❌ Error en /api/mis-estrategias/[id]:", error)
    return NextResponse.json(
      {
        error: error?.message || "Error desconocido",
        stack: error?.stack || "Sin stack"
      },
      { status: 500 }
    )
  }
}
