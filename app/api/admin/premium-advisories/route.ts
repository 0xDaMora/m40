import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

// Verificar que el usuario sea admin (simplificado - ajustar según tu lógica de admin)
async function verifyAdminAccess(session: any) {
  if (!session?.user?.email) {
    return false
  }
  
  // Ajustar según tu lógica de verificación de admin
  // Por ejemplo, verificar email específico o rol en BD
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  return adminEmails.includes(session.user.email)
}

// GET - Listar todas las asesorías Premium (admin)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }

    // Obtener asesorías con paginación
    const [advisories, total] = await Promise.all([
      prisma.premiumAdvisory.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              name: true
            }
          },
          messages: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          },
          _count: {
            select: {
              messages: true
            }
          }
        },
        orderBy: [
          { status: 'asc' }, // pending primero
          { updatedAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.premiumAdvisory.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: advisories.map(advisory => ({
        ...advisory,
        messageCount: advisory._count.messages,
        lastMessage: advisory.messages[0] || null
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error("Error al listar asesorías (admin):", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
