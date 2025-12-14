import { NextRequest, NextResponse } from "next/server"
import { calcularPensionActual } from "@/lib/yam40/calcularPensionActual"
import { calcularEscenarioYam40Recrear } from "@/lib/yam40/calculatorYam40Recrear"
import { MesConSDI } from "@/types/yam40"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 🔍 LOG: Datos recibidos del frontend
    console.log('📥 ====== REQUEST RECIBIDO EN BACKEND ======')
    console.log('📥 Body completo:', JSON.stringify(body, null, 2))
    
    const {
      profile,
      mesesPagados,
      sdiHistorico,
      // Nuevos parámetros para el calculator recrear
      fechaInicioM40,
      fechaFinM40,
      tipoPago,
      valorInicial
    }: {
      profile: {
        birthDate: string
        retirementAge: number
        totalWeeksContributed: number
        civilStatus: 'soltero' | 'casado'
      }
      mesesPagados?: MesConSDI[]
      sdiHistorico: {
        value: number
        isDirectSDI: boolean
      }
      // Nuevos parámetros opcionales
      fechaInicioM40?: { mes: number, año: number }
      fechaFinM40?: { mes: number, año: number }
      tipoPago?: 'uma' | 'aportacion'
      valorInicial?: number
    } = body

    // Validaciones
    if (!profile || !sdiHistorico) {
      console.error('❌ ERROR: Datos requeridos incompletos')
      return NextResponse.json(
        { error: "Datos requeridos incompletos" },
        { status: 400 }
      )
    }

    // Si tenemos los nuevos parámetros, usar el nuevo calculator
    if (fechaInicioM40 && fechaFinM40 && tipoPago && valorInicial !== undefined) {
      console.log('📥 Usando nuevo calculator con parámetros de fechas')
      
      // Normalizar SDI histórico a formato diario si es necesario
      let sdiHistoricoDiario = sdiHistorico.value
      if (sdiHistoricoDiario > 10000) {
        console.warn(`⚠️ SDI histórico detectado como mensual (${sdiHistoricoDiario}), convirtiendo a diario`)
        sdiHistoricoDiario = sdiHistoricoDiario / 30.4
      }

      const resultado = calcularEscenarioYam40Recrear({
        fechaNacimiento: new Date(profile.birthDate),
        semanasPrevias: profile.totalWeeksContributed,
        sdiHistorico: sdiHistoricoDiario,
        fechaInicioM40,
        fechaFinM40,
        tipoPago,
        valorInicial,
        edadJubilacion: profile.retirementAge,
        dependiente: profile.civilStatus === 'casado' ? 'conyuge' : 'ninguno'
      })

      if (resultado.error) {
        return NextResponse.json(
          { error: resultado.error, resultado },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        estrategia: resultado
      })
    }

    // Si no tenemos los nuevos parámetros, usar el método antiguo con mesesPagados
    if (!mesesPagados || mesesPagados.length === 0) {
      return NextResponse.json(
        { error: "Debes seleccionar al menos un mes pagado o proporcionar fechas inicio/fin" },
        { status: 400 }
      )
    }

    if (sdiHistorico.value <= 0) {
      return NextResponse.json(
        { error: "SDI histórico debe ser mayor a 0" },
        { status: 400 }
      )
    }

    // Las semanas totales ahora son solo las semanas ANTES de M40
    // Las semanas de M40 se calculan automáticamente
    const semanasM40 = Math.floor(mesesPagados.length * 4.33)
    const semanasPrevias = profile.totalWeeksContributed // Ya son solo las semanas antes de M40

    // Normalizar SDI histórico a formato diario si es necesario
    // Usar umbral de 10,000 para detectar SDI mensual (SDI diario típico: 100-5000)
    let sdiHistoricoDiario = sdiHistorico.value
    if (sdiHistoricoDiario > 10000) {
      console.warn(`⚠️ SDI histórico detectado como mensual (${sdiHistoricoDiario}), convirtiendo a diario`)
      sdiHistoricoDiario = sdiHistoricoDiario / 30.4
    }

    // Normalizar SDI de meses pagados a formato diario
    const mesesPagadosNormalizados = mesesPagados.map(m => ({
      ...m,
      sdi: m.sdi > 10000 ? m.sdi / 30.4 : m.sdi
    }))

    // 🔍 LOG: Datos normalizados y preparados para cálculo
    console.log('📊 ====== DATOS NORMALIZADOS ======')
    console.log('📊 Total meses pagados:', mesesPagadosNormalizados.length)
    console.log('📊 SDI histórico (diario):', sdiHistoricoDiario)
    console.log('📊 Semanas previas:', semanasPrevias)
    console.log('📊 Semanas M40:', semanasM40)
    console.log('📊 Semanas totales:', semanasPrevias + semanasM40)
    console.log('📊 Edad jubilación:', profile.retirementAge)
    console.log('📊 Dependiente:', profile.civilStatus === 'casado' ? 'conyuge' : 'ninguno')
    console.log('📊 Detalle de meses (primeros 5 y últimos 5):', {
      primeros5: mesesPagadosNormalizados.slice(0, 5).map(m => ({ mes: m.mes, año: m.año, sdi: m.sdi, uma: m.uma })),
      ultimos5: mesesPagadosNormalizados.slice(-5).map(m => ({ mes: m.mes, año: m.año, sdi: m.sdi, uma: m.uma }))
    })

    // Calcular pensión actual
    const resultado = calcularPensionActual({
      mesesPagados: mesesPagadosNormalizados,
      sdiHistorico: sdiHistoricoDiario, // SDI diario normalizado
      semanasPrevias,
      edadJubilacion: profile.retirementAge,
      dependiente: profile.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
      fechaNacimiento: new Date(profile.birthDate)
    })

    // 🔍 LOG: Resultado del cálculo
    console.log('💰 ====== RESULTADO DEL CÁLCULO ======')
    console.log('💰 Meses M40:', resultado.mesesM40)
    console.log('💰 SDI Promedio (mensual):', resultado.sdiPromedio)
    console.log('💰 SDI Promedio (diario):', resultado.sdiPromedio ? resultado.sdiPromedio / 30.4 : 'N/A')
    console.log('💰 Semanas totales:', resultado.semanasTotales)
    console.log('💰 Porcentaje pensión:', resultado.porcentajePension, '%')
    console.log('💰 Pensión mensual:', resultado.pensionMensual)
    console.log('💰 Pensión con aguinaldo:', resultado.pensionConAguinaldo)
    console.log('💰 Inversión total:', resultado.inversionTotal)
    console.log('💰 ROI:', resultado.ROI)
    console.log('💰 Recuperación (meses):', resultado.recuperacionMeses)
    if (resultado.debug) {
      console.log('💰 Debug SDI Promedio:', resultado.debug.logSDIPromedio)
      console.log('💰 Debug Datos Pensión:', resultado.debug.logDatosPension)
      console.log('💰 Debug Cálculo Pensión:', resultado.debug.logCalculoPension)
      console.log('💰 Debug Pensión Final:', resultado.debug.logPensionFinal)
    }

    if (resultado.error) {
      return NextResponse.json(
        { error: resultado.error, resultado },
        { status: 400 }
      )
    }

    // 🔍 LOG: Preparando respuesta
    console.log('📤 ====== ENVIANDO RESPUESTA AL FRONTEND ======')
    console.log('📤 Success:', true)
    console.log('📤 Pensión mensual:', resultado.pensionMensual)
    console.log('📤 Inversión total:', resultado.inversionTotal)
    
    // Incluir logs en la respuesta para que el cliente los muestre
    return NextResponse.json({
      success: true,
      estrategia: resultado,
      semanasPrevias,
      semanasM40,
      debug: {
        datosRecibidos: {
          mesesPagados: mesesPagadosNormalizados.length,
          mesesDetalle: mesesPagadosNormalizados.map(m => ({ mes: m.mes, sdi: m.sdi, uma: m.uma, año: m.año })),
          sdiHistorico: sdiHistoricoDiario,
          semanasPrevias,
          semanasM40,
          semanasTotales: semanasPrevias + semanasM40,
          edadJubilacion: profile.retirementAge,
          dependiente: profile.civilStatus === 'casado' ? 'conyuge' : 'ninguno'
        },
        calculoSDIPromedio: resultado.debug?.logSDIPromedio,
        datosPension: resultado.debug?.logDatosPension,
        calculoPension: resultado.debug?.logCalculoPension,
        pensionFinal: resultado.debug?.logPensionFinal,
        resultado: {
          mesesM40: resultado.mesesM40,
          sdiPromedio: resultado.sdiPromedio,
          semanasTotales: resultado.semanasTotales,
          pensionMensual: resultado.pensionMensual,
          inversionTotal: resultado.inversionTotal,
          porcentajePension: resultado.porcentajePension
        }
      }
    })

  } catch (error: any) {
    console.error("Error al calcular pensión actual:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}

