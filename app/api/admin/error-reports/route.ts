import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

// Función para verificar si el usuario es administrador
async function isAdmin(session: any): Promise<boolean> {
  if (!session?.user?.email) return false
  
  // Lista de emails de administradores (configurar en variables de entorno)
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || []
  
  return adminEmails.includes(session.user.email.toLowerCase())
}

// GET - Listar todos los reportes de error (solo administradores)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Verificar que sea administrador
    if (!(await isAdmin(session))) {
      return NextResponse.json(
        { error: "Acceso denegado. Solo administradores pueden ver estos reportes." },
        { status: 403 }
      )
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // 'pending' | 'reviewed' | 'resolved' | 'rewarded' | null (todos)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    // Validar límites de paginación
    const validLimit = Math.min(Math.max(1, limit), 100) // Máximo 100 por página
    const validSkip = Math.max(0, skip)

    // Construir filtro
    const where: any = {}
    if (status && ["pending", "reviewed", "resolved", "rewarded"].includes(status)) {
      where.status = status
    }

    // Obtener reportes con paginación
    const [reports, total] = await Promise.all([
      prisma.errorReport.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip: validSkip,
        take: validLimit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.errorReport.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: reports,
      pagination: {
        page,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    })
  } catch (error: any) {
    console.error("Error al obtener reportes de error:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar estado de un reporte (solo administradores)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Verificar que sea administrador
    if (!(await isAdmin(session))) {
      return NextResponse.json(
        { error: "Acceso denegado. Solo administradores pueden actualizar reportes." },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validar que el body sea un objeto
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      )
    }

    const { id, status } = body

    // Validar ID
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "ID de reporte requerido" },
        { status: 400 }
      )
    }

    // Validar status
    if (!status || !["pending", "reviewed", "resolved", "rewarded"].includes(status)) {
      return NextResponse.json(
        { error: "Estado inválido. Debe ser: pending, reviewed, resolved o rewarded" },
        { status: 400 }
      )
    }

    // Actualizar el reporte
    const updatedReport = await prisma.errorReport.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: "Reporte actualizado exitosamente",
      data: updatedReport,
    })
  } catch (error: any) {
    console.error("Error al actualizar reporte de error:", error)
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Reporte no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

