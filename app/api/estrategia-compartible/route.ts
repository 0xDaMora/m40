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
    // Aceptar códigos integration_ y yam40_
    if (!code.startsWith("integration_") && !code.startsWith("yam40_")) {
      return NextResponse.json({ error: "Código inválido - Solo se aceptan códigos integration_ o yam40_" }, { status: 400 })
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

    // Reconstruir los parámetros para el cálculo
    const datosEstrategia = estrategiaGuardada.datosEstrategia as any
    const datosUsuario = estrategiaGuardada.datosUsuario as any
    
    // Verificar si es estrategia yam40 (tiene registros guardados o tipo yam40)
    const esYam40 = datosEstrategia.tipo === 'yam40' || 
                    (datosEstrategia.registros && Array.isArray(datosEstrategia.registros) && datosEstrategia.registros.length > 0)

    let resultado: any

    if (esYam40) {
      // Usar calculator recrear compatible con yam40
      const { calcularEscenarioYam40Recrear } = await import('@/lib/yam40/calculatorYam40Recrear')
      
      // Extraer fechas inicio/fin desde datos guardados (prioridad) o registros
      let fechaInicioM40 = { mes: 1, año: 2024 }
      let fechaFinM40 = { mes: 1, año: 2024 }
      let tipoPago: 'uma' | 'aportacion' = 'aportacion'
      let valorInicial = 5000

      // Prioridad 1: Usar fechas guardadas directamente si están disponibles
      if (datosEstrategia.fechaInicioM40 && datosEstrategia.fechaFinM40) {
        const inicio = new Date(datosEstrategia.fechaInicioM40)
        const fin = new Date(datosEstrategia.fechaFinM40)
        fechaInicioM40 = { mes: inicio.getMonth() + 1, año: inicio.getFullYear() }
        fechaFinM40 = { mes: fin.getMonth() + 1, año: fin.getFullYear() }
      } else if (datosEstrategia.registros && datosEstrategia.registros.length > 0) {
        // Prioridad 2: Extraer desde registros
        const primerRegistro = datosEstrategia.registros[0]
        const ultimoRegistro = datosEstrategia.registros[datosEstrategia.registros.length - 1]
        const fechaInicio = new Date(primerRegistro.fecha)
        const fechaFin = new Date(ultimoRegistro.fecha)
        fechaInicioM40 = { mes: fechaInicio.getMonth() + 1, año: fechaInicio.getFullYear() }
        fechaFinM40 = { mes: fechaFin.getMonth() + 1, año: fechaFin.getFullYear() }
      } else if (datosEstrategia.inicioM40) {
        // Prioridad 3: Usar inicioM40 y calcular fin
        const inicio = new Date(datosEstrategia.inicioM40)
        fechaInicioM40 = { mes: inicio.getMonth() + 1, año: inicio.getFullYear() }
        // Estimar fin basado en meses M40
        const mesesM40 = datosEstrategia.mesesM40 || 12
        const fin = new Date(inicio)
        fin.setMonth(fin.getMonth() + mesesM40 - 1)
        fechaFinM40 = { mes: fin.getMonth() + 1, año: fin.getFullYear() }
      }

      // Determinar tipo de pago y valor inicial
      if (datosEstrategia.tipoPago) {
        tipoPago = datosEstrategia.tipoPago
        valorInicial = datosEstrategia.valorInicial || (tipoPago === 'uma' ? datosEstrategia.umaElegida || 15 : 5000)
      } else if (datosEstrategia.umaElegida && datosEstrategia.registros && datosEstrategia.registros.length > 0) {
        // Intentar determinar desde registros
        const primerRegistro = datosEstrategia.registros[0]
        // Si todos los registros tienen la misma UMA, es UMA fijo
        const umasUnicas = new Set(datosEstrategia.registros.map((r: any) => r.uma))
        if (umasUnicas.size === 1) {
          tipoPago = 'uma'
          valorInicial = datosEstrategia.umaElegida
        } else {
          tipoPago = 'aportacion'
          valorInicial = primerRegistro.cuotaMensual || 5000
        }
      } else {
        // Fallback
        tipoPago = datosEstrategia.umaElegida ? 'uma' : 'aportacion'
        valorInicial = datosEstrategia.umaElegida || datosEstrategia.valorInicial || 5000
      }

      const fechaNacimiento = datosUsuario.fechaNacimiento 
        ? new Date(datosUsuario.fechaNacimiento)
        : new Date('1970-01-01')

      // Si hay listaSDI guardada (modo manual), usarla directamente
      const listaSDI = datosEstrategia.listaSDI || null

      resultado = calcularEscenarioYam40Recrear({
        fechaNacimiento,
        semanasPrevias: datosEstrategia.semanasPrevias || datosUsuario.semanasPrevias || 500,
        sdiHistorico: datosEstrategia.sdiHistorico || datosUsuario.sdiHistorico || 150,
        fechaInicioM40,
        fechaFinM40,
        tipoPago,
        valorInicial,
        edadJubilacion: datosEstrategia.edad || datosUsuario.edadJubilacion || 65,
        dependiente: datosEstrategia.dependiente || datosUsuario.dependiente || "conyuge",
        listaSDI: listaSDI
      })
    } else {
      // Usar calculator normal para estrategias desde cero
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

      resultado = calcularEscenarioDetallado(params)
    }
    
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
    // Para yam40, priorizar datos guardados; para otras estrategias, usar datos calculados
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
        // Usar datos guardados primero; si no existen, usar datos calculados como fallback
        factorEdad: datosEstrategia.factorEdad ?? resultado.factorEdad ?? null,
        conFactorEdad: datosEstrategia.conFactorEdad ?? resultado.conFactorEdad ?? null,
        conLeyFox: datosEstrategia.conLeyFox ?? resultado.conLeyFox ?? null,
        conDependiente: datosEstrategia.conDependiente ?? resultado.conDependiente ?? null,
        // Para yam40, usar registros guardados si están disponibles; sino usar los calculados
        registros: (esYam40 && datosEstrategia.registros && datosEstrategia.registros.length > 0) 
          ? datosEstrategia.registros 
          : (resultado.registros || []),
        // Campos específicos de yam40
        tipo: datosEstrategia.tipo || (esYam40 ? 'yam40' : undefined),
        fechaInicioM40: datosEstrategia.fechaInicioM40,
        fechaFinM40: datosEstrategia.fechaFinM40,
        tipoPago: datosEstrategia.tipoPago,
        modoEntradaPagos: datosEstrategia.modoEntradaPagos,
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
