import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getToken } from "next-auth/jwt"
import { authOptions } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

// GET - Listar familiares del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const token = !session ? await getToken({ req: request as any }) : null
    const userId = session?.user?.id || (token?.sub as string | undefined)
    
    if (!userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Tolerancia a caídas: si falla Prisma por red, devuelve array vacío (evita romper dashboard)
    const familyMembers = await prisma.familyMember.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(familyMembers)
  } catch (error: any) {
    console.error("Error al obtener familiares:", error)
    const msg = String(error?.message || '')
    if (msg.includes("Can't reach database server")) {
      // Responder con datos vacíos para no romper UI; el cliente puede reintentar
      return NextResponse.json([], { status: 200 })
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// POST - Crear nuevo familiar
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const token = !session ? await getToken({ req: request as any }) : null
    const userId = session?.user?.id || (token?.sub as string | undefined)
    
    if (!userId) {
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
        userId: userId
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
        userId: userId,
        name,
        birthDate: new Date(birthDate),
        weeksContributed,
        lastGrossSalary,
        civilStatus
      }
    })

    return NextResponse.json(familyMember, { status: 201 })
  } catch (error: any) {
    console.error("Error al crear familiar:", error)
    
    // Log detallado para debugging
    console.log("🔍 Error details:", {
      code: error.code,
      message: error.message,
      meta: error.meta,
      stack: error.stack
    })
    
    // Manejar errores específicos de Prisma
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "Error: Usuario no encontrado. Por favor, inicia sesión nuevamente." },
        { status: 400 }
      )
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Ya existe un familiar con ese nombre." },
        { status: 400 }
      )
    }
    
    const msg = String(error?.message || '')
    if (msg.includes("Can't reach database server") || msg.includes("connect")) {
      return NextResponse.json({ error: 'Base de datos no disponible, intenta en unos segundos.' }, { status: 503 })
    }
    
    return NextResponse.json({ 
      error: "Error interno del servidor", 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
