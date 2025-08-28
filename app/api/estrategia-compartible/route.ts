import { NextResponse } from "next/server"
import { calcularEscenarioDetallado } from "@/lib/all/calculatorDetailed"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: Request) {
  try {
    const { code } = await req.json()

    if (!code) {
      return NextResponse.json({ error: "Código requerido" }, { status: 400 })
    }

    // Verificar si el código es válido
    if (!code.startsWith("compra_") && !code.startsWith("integration_")) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 })
    }

    // Buscar la estrategia en la base de datos
    const estrategiaGuardada = await prisma.estrategiaGuardada.findFirst({
      where: {
        debugCode: code,
        activa: true // Solo estrategias activas
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        },
        familiar: {
          select: {
            id: true,
            name: true,
            birthDate: true,
            weeksContributed: true,
            lastGrossSalary: true,
            civilStatus: true
          }
        }
      }
    })

    if (!estrategiaGuardada) {
      return NextResponse.json({ error: "Estrategia no encontrada" }, { status: 404 })
    }

    // Verificar si la estrategia ha expirado (30 días)
    const fechaCreacion = new Date(estrategiaGuardada.createdAt)
    const fechaExpiracion = new Date(fechaCreacion.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 días
    
    if (new Date() > fechaExpiracion) {
      return NextResponse.json({ error: "Estrategia expirada" }, { status: 410 })
    }

    // Reconstruir los parámetros para el cálculo
    const datosEstrategia = estrategiaGuardada.datosEstrategia as any
    
    const params = {
      mesesM40: datosEstrategia.mesesM40 || 36,
      estrategia: datosEstrategia.estrategia || "fijo",
      umaElegida: datosEstrategia.umaElegida || 15,
      edad: datosEstrategia.edad || 58,
      dependiente: datosEstrategia.dependiente || "conyuge",
      sdiHistorico: datosEstrategia.sdiHistorico || 150,
      semanasPrevias: datosEstrategia.semanasPrevias || 500,
      inicioM40: datosEstrategia.inicioM40 ? new Date(datosEstrategia.inicioM40) : new Date()
    }

    // Calcular la estrategia
    const resultado = calcularEscenarioDetallado(params)

    // Incrementar contador de visualizaciones
    await prisma.estrategiaGuardada.update({
      where: { id: estrategiaGuardada.id },
      data: { visualizaciones: { increment: 1 } }
    })

    return NextResponse.json({
      estrategia: {
        mesesM40: resultado.mesesM40,
        estrategia: resultado.estrategia,
        umaElegida: resultado.umaElegida,
        inversionTotal: resultado.inversionTotal,
        pensionMensual: resultado.pensionMensual,
        pensionConAguinaldo: resultado.pensionConAguinaldo,
        ROI: resultado.ROI,
        recuperacionMeses: resultado.recuperacionMeses,
        factorEdad: resultado.factorEdad,
        conFactorEdad: resultado.conFactorEdad,
        conLeyFox: resultado.conLeyFox,
        conDependiente: resultado.conDependiente,
        registros: resultado.registros || []
      },
      datosUsuario: {
        inicioM40: datosEstrategia.inicioM40 || "2024-02-01",
        edad: datosEstrategia.edad || 58,
        dependiente: datosEstrategia.dependiente || "conyuge",
        sdiHistorico: datosEstrategia.sdiHistorico || 150,
        semanasPrevias: datosEstrategia.semanasPrevias || 500
      },
      infoCompartida: {
        creadoPor: estrategiaGuardada.user.email,
        familiar: estrategiaGuardada.familiar?.name || "No especificado",
        fechaCreacion: estrategiaGuardada.createdAt,
        visualizaciones: estrategiaGuardada.visualizaciones + 1
      }
    })

  } catch (error: any) {
    console.error("❌ Error en /api/estrategia-compartible:", error)
    return NextResponse.json(
      {
        error: error?.message || "Error desconocido",
        stack: error?.stack || "Sin stack"
      },
      { status: 500 }
    )
  }
}
