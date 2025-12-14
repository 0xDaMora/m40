import { StrategyResult } from "@/types/strategy"
import { MesConSDI, MesManual } from "@/types/yam40"
import { getTasaM40, getUMA } from "@/lib/all/constants"
import { calcularCuotaMensual } from "@/lib/all/utils"
import { convertirAportacionesManuales } from "./convertirAportacionesManuales"

export interface ConstruirDatosYam40Params {
  pensionActual: StrategyResult
  mesesConSDI: MesConSDI[]
  fechaInicioM40: { mes: number; año: number }
  fechaFinM40: { mes: number; año: number }
  modoEntradaPagos: 'rango' | 'manual'
  paymentMethod?: 'aportacion' | 'uma'
  paymentValue?: number
  mesesManuales?: MesManual[]
  datosUsuario: {
    name: string
    birthDate: Date | null
    retirementAge: number
    totalWeeksContributed: number
    civilStatus: 'soltero' | 'casado'
    sdiHistorico: number // En flujo yam40: salario mensual bruto. En otros flujos: puede ser SDI diario
  }
}

/**
 * Construye los datos de estrategia y usuario para guardar en BD
 * Compatible con calcularEscenarioYam40Recrear para recrear la estrategia
 */
export function construirDatosYam40ParaGuardar(params: ConstruirDatosYam40Params) {
  const {
    pensionActual,
    mesesConSDI,
    fechaInicioM40,
    fechaFinM40,
    modoEntradaPagos,
    paymentMethod,
    paymentValue,
    mesesManuales,
    datosUsuario
  } = params

  // Validaciones
  if (!pensionActual || !datosUsuario.birthDate) {
    throw new Error("Datos incompletos para construir estrategia")
  }

  const fechaNacimiento = datosUsuario.birthDate instanceof Date 
    ? datosUsuario.birthDate 
    : new Date(datosUsuario.birthDate)

  // Calcular fecha inicio/fin en formato ISO
  const fechaInicioISO = new Date(fechaInicioM40.año, fechaInicioM40.mes - 1, 1).toISOString().split('T')[0]
  const fechaFinISO = new Date(fechaFinM40.año, fechaFinM40.mes - 1, 1).toISOString().split('T')[0]

  // Determinar tipoPago y valorInicial según modo
  let tipoPago: 'aportacion' | 'uma' = 'aportacion'
  let valorInicial = 0

  if (modoEntradaPagos === 'rango') {
    tipoPago = paymentMethod || 'aportacion'
    valorInicial = paymentValue || 0
  } else {
    // Modo manual: usar primera aportación o calcular desde mesesConSDI
    if (mesesManuales && mesesManuales.length > 0) {
      const mesesConAportacion = mesesManuales.filter(m => m.aportacion !== null && m.aportacion > 0)
      if (mesesConAportacion.length > 0) {
        valorInicial = mesesConAportacion[0].aportacion || 0
        tipoPago = 'aportacion' // En modo manual solo se permite aportación fija
      }
    } else if (mesesConSDI.length > 0) {
      // Calcular aportación desde primer mes
      const primerMes = mesesConSDI[0]
      const sdiMensual = primerMes.sdi * 30.4
      const tasa = getTasaM40(primerMes.año)
      valorInicial = sdiMensual * tasa
      tipoPago = 'aportacion'
    }
  }

  // Generar registros completos desde mesesConSDI
  const registros: Array<{
    fecha: string
    uma: number
    tasaM40?: number
    sdiMensual: number
    cuotaMensual: number
    acumulado: number
  }> = []

  let acumulado = 0
  const mesesOrdenados = [...mesesConSDI].sort((a, b) => {
    const fechaA = a.año * 12 + a.mes
    const fechaB = b.año * 12 + b.mes
    return fechaA - fechaB
  })

  mesesOrdenados.forEach((mes) => {
    const sdiMensual = mes.sdi * 30.4
    const tasa = getTasaM40(mes.año)
    const cuotaMensual = calcularCuotaMensual(sdiMensual, mes.año)
    acumulado += cuotaMensual

    // Usar aportacionMensual si está disponible (mes del año 1-12), sino usar mes (puede ser 1-58)
    const mesDelAño = (mes as any).aportacionMensual || mes.mes
    // Asegurar que mesDelAño esté en rango 1-12
    const mesValido = mesDelAño > 12 ? ((mesDelAño - 1) % 12) + 1 : mesDelAño
    const fecha = `${mes.año}-${mesValido.toString().padStart(2, '0')}-02`

    registros.push({
      fecha,
      uma: mes.uma,
      tasaM40: +(tasa * 100).toFixed(3),
      sdiMensual: Math.round(sdiMensual),
      cuotaMensual: Math.round(cuotaMensual),
      acumulado: Math.round(acumulado)
    })
  })

  // Si no hay registros pero hay pensionActual.registros, usarlos
  if (registros.length === 0 && (pensionActual as any).registros) {
    registros.push(...(pensionActual as any).registros)
  }

  // Construir datosEstrategia
  const datosEstrategia = {
    tipo: 'yam40' as const,
    mesesM40: mesesConSDI.length,
    fechaInicioM40: fechaInicioISO,
    fechaFinM40: fechaFinISO,
    tipoPago,
    valorInicial,
    modoEntradaPagos,
    // Resultados calculados
    pensionMensual: pensionActual.pensionMensual || 0,
    pensionConAguinaldo: pensionActual.pensionConAguinaldo || pensionActual.pensionMensual || 0,
    inversionTotal: acumulado || pensionActual.inversionTotal || 0,
    ROI: pensionActual.ROI || null,
    recuperacionMeses: pensionActual.recuperacionMeses || null,
    factorEdad: pensionActual.factorEdad || null,
    conFactorEdad: pensionActual.conFactorEdad || null,
    conLeyFox: pensionActual.conLeyFox || null,
    conDependiente: pensionActual.conDependiente || null,
    // Parámetros para recrear
    edad: datosUsuario.retirementAge,
    dependiente: datosUsuario.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
    sdiHistorico: datosUsuario.sdiHistorico, // SDI diario
    semanasPrevias: datosUsuario.totalWeeksContributed,
    inicioM40: fechaInicioISO,
    // Registros completos
    registros,
    // Para modo manual, convertir mesesManuales a listaSDI usando convertirAportacionesManuales
    ...(modoEntradaPagos === 'manual' && mesesManuales && mesesManuales.length > 0 ? (() => {
      try {
        const conversionResult = convertirAportacionesManuales(mesesManuales.filter(m => m.aportacion !== null && m.aportacion > 0))
        if (conversionResult.errores.length === 0) {
          return {
            listaSDI: conversionResult.listaSDI.map(sdi => ({
              mes: sdi.mes,
              año: sdi.año,
              aportacionMensual: sdi.aportacionMensual,
              sdiMensual: sdi.sdiMensual,
              sdiDiario: sdi.sdiDiario,
              uma: sdi.uma,
              tasaM40: sdi.tasaM40,
              valorUMA: sdi.valorUMA
            }))
          }
        }
      } catch (error) {
        console.warn('Error convirtiendo meses manuales a listaSDI:', error)
      }
      return {}
    })() : {})
  }

  // Calcular edad actual
  const hoy = new Date()
  let edadActual = hoy.getFullYear() - fechaNacimiento.getFullYear()
  const monthDiff = hoy.getMonth() - fechaNacimiento.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
    edadActual--
  }

  // Construir datosUsuario
  const datosUsuarioBD = {
    fechaNacimiento: fechaNacimiento.toISOString().split('T')[0],
    edadJubilacion: datosUsuario.retirementAge,
    nombreFamiliar: datosUsuario.name,
    edadActual,
    semanasPrevias: datosUsuario.totalWeeksContributed,
    semanasCotizadas: datosUsuario.totalWeeksContributed + Math.floor(mesesConSDI.length * 4.33),
    sdiHistorico: datosUsuario.sdiHistorico, // En flujo yam40: salario mensual bruto. En flujo HeroOnboard: SDI diario
    sdiActual: datosUsuario.sdiHistorico,
    salarioMensual: Math.round(datosUsuario.sdiHistorico), // En flujo yam40: sdiHistorico ya es salario mensual bruto, no multiplicar
    dependiente: datosUsuario.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
    estadoCivil: datosUsuario.civilStatus,
    inicioM40: fechaInicioISO,
    aportacionPromedio: mesesConSDI.length > 0 
      ? (acumulado || pensionActual.inversionTotal || 0) / mesesConSDI.length 
      : 0
  }

  return {
    datosEstrategia,
    datosUsuario: datosUsuarioBD
  }
}

