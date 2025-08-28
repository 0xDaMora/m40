import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

// GET - Listar familiares del usuario
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const familyMembers = await prisma.familyMember.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(familyMembers)
  } catch (error) {
    console.error("Error al obtener familiares:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo familiar
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, birthDate, weeksContributed, lastGrossSalary, civilStatus } = body

    // Validaciones
    if (!name || !birthDate || !weeksContributed || !lastGrossSalary || !civilStatus) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      )
    }

    if (weeksContributed < 0 || lastGrossSalary < 0) {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      )
    }

    // Verificar límite de 10 familiares
    const existingCount = await prisma.familyMember.count({
      where: {
        userId: session.user.id
      }
    })

    if (existingCount >= 10) {
      return NextResponse.json(
        { error: "Límite de 10 familiares alcanzado" },
        { status: 400 }
      )
    }

    const familyMember = await prisma.familyMember.create({
      data: {
        userId: session.user.id,
        name,
        birthDate: new Date(birthDate),
        weeksContributed,
        lastGrossSalary,
        civilStatus
      }
    })

    return NextResponse.json(familyMember, { status: 201 })
  } catch (error) {
    console.error("Error al crear familiar:", error)
    
    // Manejar errores específicos de Prisma
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "Error: Usuario no encontrado. Por favor, inicia sesión nuevamente." },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
