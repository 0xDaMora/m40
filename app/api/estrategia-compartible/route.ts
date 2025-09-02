import { NextResponse } from "next/server"
import { calcularEscenarioDetallado } from "@/lib/all/calculatorDetailed"
import { prisma } from "@/lib/db/prisma"

export async function POST(req: Request) {
  try {
    const { code } = await req.json()

    if (!code) {
      return NextResponse.json({ error: "Código requerido" }, { status: 400 })
    }

    // Verificar si el código es válido (SISTEMA UNIFICADO)
    if (!code.startsWith("integration_")) {
      return NextResponse.json({ error: "Código inválido - Solo se aceptan códigos integration_" }, { status: 400 })
    }

    // Buscar la estrategia en la base de datos (con reintentos ante fallas de conexión)
    const buscarConRetry = async (intentos = 2) => {
      let ultimoError: any
      for (let i = 0; i <= intentos; i++) {
        try {
          const r = await prisma.estrategiaGuardada.findFirst({
            where: {
              debugCode: code,
              activa: true
            },
            include: {
              user: { select: { id: true, email: true } },
              familiar: { select: { id: true, name: true, birthDate: true, weeksContributed: true, lastGrossSalary: true, civilStatus: true } }
            }
          })
          return r
        } catch (err: any) {
          ultimoError = err
          // Pequeño backoff
          await new Promise(res => setTimeout(res, 200))
        }
      }
      throw ultimoError
    }

    let estrategiaGuardada
    try {
      estrategiaGuardada = await buscarConRetry(2)
    } catch (err: any) {
      const msg = String(err?.message || '')
      if (msg.includes("Can't reach database server")) {
        // Forzar fallback del cliente devolviendo 404
        return NextResponse.json({ error: 'DB temporalmente no disponible' }, { status: 404 })
      }
      throw err
    }



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
    const datosUsuario = estrategiaGuardada.datosUsuario as any
    

    
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

    // Calcular la estrategia usando los parámetros guardados
    const resultado = calcularEscenarioDetallado(params)
    
    // Verificar que los resultados coincidan con los datos guardados
    console.log('🔍 Verificando consistencia de datos:')
    console.log('📊 Datos guardados:', {
      mesesM40: datosEstrategia.mesesM40,
      estrategia: datosEstrategia.estrategia,
      umaElegida: datosEstrategia.umaElegida,
      pensionMensual: datosEstrategia.pensionMensual,
      inversionTotal: datosEstrategia.inversionTotal
    })
    console.log('📊 Datos recalculados:', {
      mesesM40: resultado.mesesM40,
      estrategia: resultado.estrategia,
      umaElegida: resultado.umaElegida,
      pensionMensual: resultado.pensionMensual,
      inversionTotal: resultado.inversionTotal
    })

    // Incrementar contador de visualizaciones
    await prisma.estrategiaGuardada.update({
      where: { id: estrategiaGuardada.id },
      data: { visualizaciones: { increment: 1 } }
    })

    // Preparar datos de respuesta - USAR DATOS GUARDADOS para mantener consistencia
    const responseData = {
      estrategia: {
        // Usar datos guardados para mantener consistencia con la compra
        mesesM40: datosEstrategia.mesesM40 || resultado.mesesM40,
        estrategia: datosEstrategia.estrategia || resultado.estrategia,
        umaElegida: datosEstrategia.umaElegida || resultado.umaElegida,
        inversionTotal: datosEstrategia.inversionTotal || resultado.inversionTotal,
        pensionMensual: datosEstrategia.pensionMensual || resultado.pensionMensual,
        pensionConAguinaldo: datosEstrategia.pensionConAguinaldo || resultado.pensionConAguinaldo,
        ROI: datosEstrategia.ROI || resultado.ROI,
        recuperacionMeses: datosEstrategia.recuperacionMeses || resultado.recuperacionMeses,
        // Usar datos calculados para campos que no se guardan
        factorEdad: resultado.factorEdad,
        conFactorEdad: resultado.conFactorEdad,
        conLeyFox: resultado.conLeyFox,
        conDependiente: resultado.conDependiente,
        registros: resultado.registros || [],
        // Incluir campos adicionales guardados
        puntaje: datosEstrategia.puntaje,
        ranking: datosEstrategia.ranking
      },
      datosUsuario: {
        inicioM40: datosUsuario.inicioM40 || datosEstrategia.inicioM40 || "2024-02-01",
        edad: datosUsuario.edad || datosEstrategia.edad || 58,
        dependiente: datosUsuario.dependiente || datosEstrategia.dependiente || "conyuge",
        sdiHistorico: datosUsuario.sdiHistorico || datosEstrategia.sdiHistorico || 150,
        semanasPrevias: datosUsuario.semanasPrevias || datosEstrategia.semanasPrevias || 500,
        // Información personalizada del familiar - PRIORIZAR datos del familiar de la base de datos
        nombreFamiliar: estrategiaGuardada.familiar?.name || datosUsuario.nombreFamiliar || "No especificado",
        edadActual: datosUsuario.edadActual || null,
        semanasCotizadas: estrategiaGuardada.familiar?.weeksContributed || datosUsuario.semanasCotizadas || datosUsuario.semanasPrevias || datosEstrategia.semanasPrevias || 500,
        sdiActual: (estrategiaGuardada.familiar?.lastGrossSalary / 30.4) || datosUsuario.sdiActual || datosUsuario.sdiHistorico || datosEstrategia.sdiHistorico || 150,
        salarioMensual: estrategiaGuardada.familiar?.lastGrossSalary || datosUsuario.salarioMensual || null,
        estadoCivil: estrategiaGuardada.familiar?.civilStatus || datosUsuario.estadoCivil || "soltero",
        fechaNacimiento: estrategiaGuardada.familiar?.birthDate?.toISOString().split('T')[0] || datosUsuario.fechaNacimiento || null,
        edadJubilacion: datosUsuario.edadJubilacion || datosUsuario.edad || datosEstrategia.edad || 58,
        aportacionPromedio: datosUsuario.aportacionPromedio || null
      },
      infoCompartida: {
        creadoPor: estrategiaGuardada.user.email,
        familiar: estrategiaGuardada.familiar?.name || "No especificado",
        fechaCreacion: estrategiaGuardada.createdAt,
        visualizaciones: estrategiaGuardada.visualizaciones + 1
      }
    }



    return NextResponse.json(responseData)
    


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
