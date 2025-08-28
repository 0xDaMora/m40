import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

// GET - Obtener un familiar específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

             const familyMember = await prisma.familyMember.findFirst({
           where: {
             id: id,
             userId: session.user.id
           }
         })

    if (!familyMember) {
      return NextResponse.json(
        { error: "Familiar no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(familyMember)
  } catch (error) {
    console.error("Error al obtener familiar:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT - Actualizar familiar
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

    // Verificar que el familiar existe y pertenece al usuario
    const existingFamilyMember = await prisma.familyMember.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!existingFamilyMember) {
      return NextResponse.json(
        { error: "Familiar no encontrado" },
        { status: 404 }
      )
    }

    // Validaciones para campos proporcionados
    if (weeksContributed !== undefined && weeksContributed < 0) {
      return NextResponse.json(
        { error: "Semanas cotizadas no puede ser negativo" },
        { status: 400 }
      )
    }

    if (lastGrossSalary !== undefined && lastGrossSalary < 0) {
      return NextResponse.json(
        { error: "Salario no puede ser negativo" },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (birthDate !== undefined) updateData.birthDate = new Date(birthDate)
    if (weeksContributed !== undefined) updateData.weeksContributed = weeksContributed
    if (lastGrossSalary !== undefined) updateData.lastGrossSalary = lastGrossSalary
    if (civilStatus !== undefined) updateData.civilStatus = civilStatus

    const updatedFamilyMember = await prisma.familyMember.update({
      where: {
        id: id
      },
      data: updateData
    })

    return NextResponse.json(updatedFamilyMember)
  } catch (error) {
    console.error("Error al actualizar familiar:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar familiar
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Verificar que el familiar existe y pertenece al usuario
    const existingFamilyMember = await prisma.familyMember.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!existingFamilyMember) {
      return NextResponse.json(
        { error: "Familiar no encontrado" },
        { status: 404 }
      )
    }

    await prisma.familyMember.delete({
      where: {
        id: id
      }
    })

    return NextResponse.json({ message: "Familiar eliminado exitosamente" })
  } catch (error) {
    console.error("Error al eliminar familiar:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
