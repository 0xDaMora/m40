import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { debugCode, datosEstrategia, datosUsuario, familyMemberId, esMejora } = await req.json()



    if (!debugCode || !datosEstrategia || !datosUsuario) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }



    // Obtener el usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Verificar si ya existe una estrategia con ese código
    const estrategiaExistente = await prisma.estrategiaGuardada.findUnique({
      where: { debugCode }
    })

    if (estrategiaExistente) {
      return NextResponse.json({ error: "Estrategia ya guardada" }, { status: 409 })
    }

    // Guardar la estrategia
    const estrategiaGuardada = await prisma.estrategiaGuardada.create({
      data: {
        userId: user.id,
        familyMemberId: familyMemberId || null,
        debugCode,
        datosEstrategia,
        datosUsuario,
        activa: true,
        visualizaciones: 0
      },
      include: {
        familiar: true
      }
    })

    console.log('✅ Estrategia guardada exitosamente:', estrategiaGuardada.id)



    // Determinar la ruta correcta según el tipo de estrategia
    const esYam40 = debugCode.startsWith('yam40_')
    const ruta = esYam40 ? `/yam40-estrategia/${debugCode}` : `/estrategia/${debugCode}`
    
    return NextResponse.json({
      success: true,
      estrategia: estrategiaGuardada,
      linkCompartible: `${process.env.NEXTAUTH_URL}${ruta}`
    })

  } catch (error: any) {
    console.error("❌ Error en /api/guardar-estrategia:", error)
    console.error("❌ Detalles del error:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack
    })
    return NextResponse.json(
      {
        error: error?.message || "Error desconocido",
        code: error?.code || "UNKNOWN_ERROR",
        details: error?.meta || null,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}
