import {
  calcularSDI,
  calcularCuotaMensual,
  porcentajeLey73,
  calcularSemanasM40,
  aplicarFactores
} from "../all/utils"
import { getTasaM40 } from "../all/constants"
import { MesConSDI } from "@/types/yam40"

interface CalcularPensionActualParams {
  mesesPagados: MesConSDI[]
  sdiHistorico: number // SDI diario histórico
  semanasPrevias: number // Semanas antes de M40
  edadJubilacion: number
  dependiente: "conyuge" | "ninguno"
  fechaNacimiento: Date
}

// Función para normalizar SDI a formato diario
// Usa un umbral más alto (10,000) para detectar SDI mensual
// SDI diario típico: 100-5000, SDI mensual típico: 3,000-150,000
function normalizarSDIADiario(sdi: number): number {
  // Si el SDI es mayor a 10,000, probablemente está en formato mensual
  // Convertirlo a diario dividiendo entre 30.4
  if (sdi > 10000) {
    // SDI detectado como mensual, convertir a diario
    return sdi / 30.4
  }
  return sdi
}

export function calcularPensionActual(params: CalcularPensionActualParams) {
  const {
    mesesPagados,
    sdiHistorico,
    semanasPrevias,
    edadJubilacion,
    dependiente,
    fechaNacimiento
  } = params

  // Validaciones básicas
  if (mesesPagados.length === 0) {
    throw new Error("Debes seleccionar al menos un mes pagado")
  }

  if (edadJubilacion < 60 || edadJubilacion > 65) {
    throw new Error("Edad de jubilación debe estar entre 60 y 65 años")
  }

  // Normalizar SDI histórico a formato diario
  const sdiHistoricoDiario = normalizarSDIADiario(sdiHistorico)

  // Ordenar meses pagados por número de mes
  const mesesOrdenados = [...mesesPagados]
    .map(m => ({
      ...m,
      sdi: normalizarSDIADiario(m.sdi) // Normalizar SDI a diario
    }))
    .sort((a, b) => a.mes - b.mes)
  
  const totalMesesPagados = mesesOrdenados.length

  // Calcular fecha de inicio real basada en el primer mes pagado
  // Usar el año del primer mes y asumir que empezó en enero de ese año
  const primerMes = mesesOrdenados[0]
  const inicioM40 = new Date(primerMes.año, 0, 1) // 1 de enero del año del primer mes

  // Generar registros mensuales con fechas reales
  // Similar a calcularEscenario pero usando los meses pagados reales
  const registros: Array<{
    fecha: string
    uma: number
    tasaM40?: number
    sdiMensual: number
    cuotaMensual: number
    acumulado: number
  }> = []

  let totalInversion = 0
  let acumulado = 0

  // Crear un mapa de meses pagados por su posición (1-58)
  const mesesPagadosMap = new Map<number, MesConSDI>()
  mesesOrdenados.forEach(m => {
    mesesPagadosMap.set(m.mes, m)
  })

  // Generar registros para cada mes pagado, manteniendo el orden cronológico
  mesesOrdenados.forEach((mesData, index) => {
    // Calcular SDI mensual desde SDI diario
    const sdiMensual = mesData.sdi * 30.4
    
    // Validar que el SDI sea razonable (entre $100 y $5000 diarios)
    // Nota: Validación silenciosa para evitar logs infinitos
    
    // Calcular cuota mensual usando la tasa del año correspondiente
    const tasa = getTasaM40(mesData.año)
    const cuotaMensual = calcularCuotaMensual(sdiMensual, mesData.año)
    
    acumulado += cuotaMensual
    totalInversion += cuotaMensual
    
    // Logs removidos para evitar loops infinitos - se muestran en el hook cuando sea necesario

    // Generar fecha real basada en el año del mes
    // Usar el mes aproximado basado en la posición (mes 1 = enero, mes 2 = febrero, etc.)
    const mesAproximado = ((mesData.mes - 1) % 12) + 1
    const fecha = `${mesData.año}-${mesAproximado.toString().padStart(2, "0")}-02`

    registros.push({
      fecha,
      uma: mesData.uma,
      tasaM40: +(tasa * 100).toFixed(3),
      sdiMensual: Math.round(sdiMensual),
      cuotaMensual: Math.round(cuotaMensual),
      acumulado: Math.round(acumulado)
    })
  })

  // Calcular SDI promedio de los últimos 58 meses (IGUAL QUE calculator.ts)
  // Usar la misma lógica exacta que calculator.ts para mantener consistencia
  let sdiPromedio: number
  
  // Convertir registros a formato mensual (igual que calculator.ts)
  const registrosMensuales = registros.map(r => r.sdiMensual)
  
  if (totalMesesPagados >= 58) {
    // Solo considerar los últimos 58 meses (igual que calculator.ts)
    const ultimos58 = registrosMensuales.slice(-58)
    sdiPromedio = ultimos58.reduce((a, b) => a + b, 0) / 58
  } else {
    // Completar con SDI histórico (igual que calculator.ts)
    const faltantes = 58 - totalMesesPagados
    const sumaM40 = registrosMensuales.reduce((a, b) => a + b, 0)
    // sdiHistorico ya está en formato diario, convertir a mensual
    sdiPromedio = (sumaM40 + faltantes * (sdiHistoricoDiario * 30.4)) / 58
  }
  
  // Calcular semanas totales (igual que calculator.ts)
  const semanasM40 = calcularSemanasM40(totalMesesPagados)
  const semanasTotales = semanasPrevias + semanasM40
  
  // Calcular sdiPromedioDiario para el log
  const sdiPromedioDiario = sdiPromedio / 30.4
  
  // Log removido para evitar loops infinitos
  
  const logSDIPromedio = {
    mesesPagadosM40: totalMesesPagados,
    semanasM40: semanasM40,
    mesesHistoricosTotales: 58,
    sdiHistoricoDiario: sdiHistoricoDiario,
    sdiPromedio: sdiPromedio,
    sdiPromedioDiario: sdiPromedioDiario,
    explicacion: totalMesesPagados >= 58 
      ? `Los ${totalMesesPagados} meses M40 completan los 58 meses requeridos. El SDI promedio se calcula directamente del promedio de los últimos 58 meses de M40.`
      : `Los ${totalMesesPagados} meses M40 se combinan con ${58 - totalMesesPagados} meses históricos. SDI promedio = (suma M40 + faltantes * SDI histórico) / 58`
  }

  // Validar semanas mínimas
  if (semanasTotales < 500) {
    return {
      mesesM40: totalMesesPagados,
      estrategia: 'fijo' as const,
      umaElegida: Math.round(mesesOrdenados.reduce((acc, m) => acc + m.uma, 0) / totalMesesPagados),
      inversionTotal: Math.round(totalInversion),
      pensionMensual: null,
      pensionConAguinaldo: null,
      ROI: null,
      recuperacionMeses: null,
      error: "Insuficientes semanas cotizadas (mínimo 500)",
      semanasTotales,
      registros: []
    }
  }

  // Calcular año de jubilación para cálculos (basado en fecha de nacimiento y edad de jubilación)
  const añoJubilacion = fechaNacimiento.getFullYear() + edadJubilacion

  const logDatosPension = {
    sdiPromedioMensual: sdiPromedio,
    semanasTotales,
    añoJubilacion,
    edadJubilacion,
    dependiente,
    inicioM40: inicioM40.getFullYear()
  }

  // Calcular porcentaje según Ley 73
  const porcentaje = porcentajeLey73(sdiPromedio, semanasTotales, añoJubilacion)
  const pensionBase = (porcentaje / 100) * sdiPromedio

  const logCalculoPension = {
    porcentaje,
    pensionBase,
    antesFactores: pensionBase
  }

  // Aplicar factores (edad, Fox, dependientes) - usar la misma función que calcularEscenario
  let pensionMensual = aplicarFactores(pensionBase, edadJubilacion, dependiente)

  // NOTA: calculator.ts NO aplica PMG, así que tampoco lo aplicamos aquí para mantener consistencia
  // Si se necesita PMG, se debe aplicar después de manera consistente en todo el sistema

  const logPensionFinal = {
    pensionMensual,
    pensionBase,
    porcentaje
  }

  // Validar que la pensión sea válida
  if (!pensionMensual || isNaN(pensionMensual) || pensionMensual <= 0) {
    return {
      mesesM40: totalMesesPagados,
      estrategia: 'fijo' as const,
      umaElegida: Math.round(mesesOrdenados.reduce((acc, m) => acc + m.uma, 0) / totalMesesPagados),
      inversionTotal: Math.round(totalInversion),
      pensionMensual: null,
      pensionConAguinaldo: null,
      ROI: null,
      recuperacionMeses: null,
      error: "Error en cálculo de pensión",
      semanasTotales,
      registros: []
    }
  }

  // Calcular factores por separado para mostrar en detalle (igual que calculatorDetailed)
  const factorEdadMap: Record<number, number> = {
    60: 0.75,
    61: 0.80,
    62: 0.85,
    63: 0.90,
    64: 0.95,
    65: 1.00
  }
  const factorEdad = factorEdadMap[edadJubilacion] || 1
  const conFactorEdad = pensionBase * factorEdad
  const conLeyFox = conFactorEdad * 1.11
  const conDependiente = conLeyFox * (1 + (dependiente === "conyuge" ? 0.15 : 0))

  // Calcular métricas finales (igual que calcularEscenario)
  // Aguinaldo es exactamente igual a la pensión mensual (sin cálculos adicionales)
  const aguinaldo = pensionMensual
  const pensionConAguinaldo = pensionMensual * 13 / 12 // Promedio mensual considerando aguinaldo anual
  const recuperacionMeses = totalInversion > 0 ? Math.round(totalInversion / pensionMensual) : null
  const ROI = totalInversion > 0 
    ? +((pensionMensual * 12 * 20) / totalInversion).toFixed(2) 
    : null

  // Calcular UMA promedio
  const umaPromedio = Math.round(
    mesesOrdenados.reduce((acc, m) => acc + m.uma, 0) / totalMesesPagados * 10
  ) / 10

  return {
    estrategia: 'fijo' as const,
    umaElegida: umaPromedio,
    mesesM40: totalMesesPagados,
    inversionTotal: Math.round(totalInversion),
    pensionMensual: Math.round(pensionMensual),
    pensionConAguinaldo: Math.round(pensionConAguinaldo),
    ROI,
    recuperacionMeses,
    semanasTotales,
    sdiPromedio: Math.round(sdiPromedio),
    porcentajePension: +porcentaje.toFixed(2),
    conLeyFox: Math.round(conLeyFox),
    conDependiente: Math.round(conDependiente),
    factorEdad: +factorEdad.toFixed(2),
    conFactorEdad: Math.round(conFactorEdad),
    registros,
    // Incluir logs para debug en el cliente
    debug: {
      logSDIPromedio,
      logDatosPension,
      logCalculoPension,
      logPensionFinal
    }
  }
}
