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

    const { debugCode, datosEstrategia, datosUsuario, familyMemberId } = await req.json()



    if (!debugCode || !datosEstrategia || !datosUsuario) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }



    // Obtener el usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        subscription: true,
        hasUsedFreeStrategy: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Verificar que hasUsedFreeStrategy existe (por si acaso no se migró correctamente)
    if (user.hasUsedFreeStrategy === undefined) {
      console.warn('⚠️ hasUsedFreeStrategy no existe en el usuario, usando false por defecto')
      // Actualizar el usuario para agregar el campo si no existe
      await prisma.user.update({
        where: { id: user.id },
        data: { hasUsedFreeStrategy: false }
      })
      user.hasUsedFreeStrategy = false
    }

    // Verificar si ya existe una estrategia con ese código
    const estrategiaExistente = await prisma.estrategiaGuardada.findUnique({
      where: { debugCode }
    })

    if (estrategiaExistente) {
      return NextResponse.json({ error: "Estrategia ya guardada" }, { status: 409 })
    }

    // Verificar si el usuario puede guardar gratis (solo una vez)
    // Asegurar que hasUsedFreeStrategy sea un booleano
    const hasUsedFree = user.hasUsedFreeStrategy === true || user.hasUsedFreeStrategy === 1 || user.hasUsedFreeStrategy === 'true'
    const puedeGuardarGratis = !hasUsedFree && user.subscription !== 'premium'
    
    console.log('🔍 Verificando estrategia gratis:', {
      userId: user.id,
      email: user.email,
      hasUsedFreeStrategy: user.hasUsedFreeStrategy,
      hasUsedFreeStrategyType: typeof user.hasUsedFreeStrategy,
      hasUsedFree: hasUsedFree,
      subscription: user.subscription,
      puedeGuardarGratis
    })
    
    // Si el usuario no es premium y ya usó su estrategia gratis, rechazar
    if (!puedeGuardarGratis && user.subscription !== 'premium') {
      console.log('❌ Usuario ya usó su estrategia gratis')
      return NextResponse.json({ 
        error: "Ya has usado tu estrategia gratis. Actualiza a Premium para guardar más estrategias.",
        requiresPremium: true
      }, { status: 403 })
    }

    // Usar transacción para asegurar que ambas operaciones se ejecuten correctamente
    const resultado = await prisma.$transaction(async (tx) => {
      // Guardar la estrategia
      const estrategiaGuardada = await tx.estrategiaGuardada.create({
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

      // Si el usuario guardó gratis, marcar que ya usó su estrategia gratis
      if (puedeGuardarGratis) {
        console.log('🎁 Marcando hasUsedFreeStrategy = true para usuario:', user.id)
        const usuarioActualizado = await tx.user.update({
          where: { id: user.id },
          data: { hasUsedFreeStrategy: true }
        })
        console.log('✅ Usuario actualizado exitosamente en transacción:', {
          id: usuarioActualizado.id,
          email: usuarioActualizado.email,
          hasUsedFreeStrategy: usuarioActualizado.hasUsedFreeStrategy,
          subscription: usuarioActualizado.subscription
        })
        
        return { estrategiaGuardada, usuarioActualizado }
      } else {
        console.log('ℹ️ Usuario no puede guardar gratis:', {
          hasUsedFreeStrategy: user.hasUsedFreeStrategy,
          subscription: user.subscription,
          puedeGuardarGratis
        })
        return { estrategiaGuardada, usuarioActualizado: null }
      }
    })

    const { estrategiaGuardada, usuarioActualizado } = resultado

    // Verificar que realmente se actualizó después de la transacción
    if (usuarioActualizado) {
      const usuarioVerificado = await prisma.user.findUnique({
        where: { id: user.id },
        select: { hasUsedFreeStrategy: true }
      })
      console.log('🔍 Verificación post-transacción:', {
        hasUsedFreeStrategy: usuarioVerificado?.hasUsedFreeStrategy,
        esperado: true
      })
      
      if (usuarioVerificado?.hasUsedFreeStrategy !== true) {
        console.error('⚠️ ADVERTENCIA: hasUsedFreeStrategy no se actualizó correctamente después de la transacción')
        // Intentar actualizar nuevamente como fallback
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { hasUsedFreeStrategy: true }
          })
          console.log('✅ Actualización de fallback exitosa')
        } catch (fallbackError: any) {
          console.error('❌ Error en actualización de fallback:', fallbackError)
        }
      }
    }



    return NextResponse.json({
      success: true,
      estrategia: estrategiaGuardada,
      linkCompartible: `${process.env.NEXTAUTH_URL}/estrategia/${debugCode}`
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
