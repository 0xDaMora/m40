import { MesConSDI } from "@/types/yam40"
import { StrategyResult } from "@/types/strategy"
import { calcularSDI, calcularCuotaMensual } from "@/lib/all/utils"
import { getUMA, getTasaM40 } from "@/lib/all/constants"
import { calcularEscenarioDetallado } from "@/lib/all/calculatorDetailed"

interface AdaptarEstrategiaYam40Params {
  mesesPagados: MesConSDI[]
  mesesFuturos: MesConSDI[]
  pensionActual: StrategyResult
  datosUsuario: {
    name: string
    birthDate: Date | string
    retirementAge: number
    totalWeeksContributed: number // Semanas ANTES de M40
    civilStatus: 'soltero' | 'casado'
    sdiHistorico: number // SDI diario histórico
  }
}

/**
 * Adapta una estrategia yam40 para que sea compatible con EstrategiaDetallada
 * 
 * EstrategiaDetallada espera estrategias que empiezan de 0, pero yam40 tiene
 * meses ya pagados. Esta función:
 * 1. Combina meses pagados + meses futuros
 * 2. Genera registros completos para los 58 meses
 * 3. Construye datosUsuario con información correcta
 * 4. Maneja fechas basadas en el primer mes pagado
 */
export function adaptarEstrategiaYam40({
  mesesPagados,
  mesesFuturos,
  pensionActual,
  datosUsuario
}: AdaptarEstrategiaYam40Params) {
  // Validaciones
  if (mesesPagados.length === 0 && mesesFuturos.length === 0) {
    throw new Error("Debe haber al menos un mes pagado o futuro")
  }

  // Ordenar todos los meses por número de mes (1-58)
  const todosLosMeses = [...mesesPagados, ...mesesFuturos].sort((a, b) => a.mes - b.mes)
  
  // Encontrar el primer mes para calcular fecha de inicio
  const primerMes = todosLosMeses[0]
  // Calcular el mes del año basándose en el número de mes (1-58)
  // Si mes es 1, corresponde al primer mes del año del primerMes
  const mesDelAño = ((primerMes.mes - 1) % 12) + 1
  const añoAjustado = primerMes.año + Math.floor((primerMes.mes - 1) / 12)
  const fechaInicioM40 = new Date(añoAjustado, mesDelAño - 1, 1) // Primer día del mes real
  
  // Calcular fecha de nacimiento
  const fechaNacimiento = datosUsuario.birthDate instanceof Date 
    ? datosUsuario.birthDate 
    : new Date(datosUsuario.birthDate)
  
  // Calcular semanas previas (solo las semanas ANTES de M40)
  const semanasPrevias = datosUsuario.totalWeeksContributed
  
  // Calcular semanas M40 totales
  const semanasM40 = Math.floor(todosLosMeses.length * 4.33)
  const semanasTotales = semanasPrevias + semanasM40
  
  // Determinar estrategia (fijo o progresivo) basándose en los meses futuros
  // Si todos los meses futuros tienen la misma UMA, es fijo; si varía, es progresivo
  const umasFuturas = mesesFuturos.map(m => m.uma)
  const umaUnica = umasFuturas.length > 0 && umasFuturas.every(u => u === umasFuturas[0])
  const estrategia: 'fijo' | 'progresivo' = umaUnica ? 'fijo' : 'progresivo'
  
  // Calcular UMA promedio
  const umaPromedio = todosLosMeses.length > 0
    ? todosLosMeses.reduce((sum, m) => sum + m.uma, 0) / todosLosMeses.length
    : 0
  
  // Generar registros mensuales completos
  const registros: Array<{
    fecha: string
    uma: number
    tasaM40?: number
    sdiMensual: number
    cuotaMensual: number
    acumulado: number
  }> = []
  
  let acumulado = 0
  
  // Crear mapa de meses para acceso rápido
  const mesesMap = new Map<number, MesConSDI>()
  todosLosMeses.forEach(m => {
    mesesMap.set(m.mes, m)
  })
  
  // Generar registros para cada mes (1-58 o hasta el último mes disponible)
  const ultimoMes = Math.max(...todosLosMeses.map(m => m.mes))
  const totalMeses = Math.min(ultimoMes, 58)
  
  for (let i = 1; i <= totalMeses; i++) {
    const mesData = mesesMap.get(i)
    
    if (mesData) {
      // Mes con datos reales
      const sdiMensual = mesData.sdi * 30.4
      const tasa = getTasaM40(mesData.año)
      const cuotaMensual = calcularCuotaMensual(sdiMensual, mesData.año)
      acumulado += cuotaMensual
      
      // Calcular fecha aproximada
      const mesDelAño = ((mesData.mes - 1) % 12) + 1
      const fecha = `${mesData.año}-${mesDelAño.toString().padStart(2, '0')}-02`
      
      registros.push({
        fecha,
        uma: mesData.uma,
        tasaM40: +(tasa * 100).toFixed(3),
        sdiMensual: Math.round(sdiMensual),
        cuotaMensual: Math.round(cuotaMensual),
        acumulado: Math.round(acumulado)
      })
    } else {
      // Mes sin datos (completar con SDI histórico si es necesario)
      // Esto solo debería pasar si hay gaps, pero para compatibilidad lo manejamos
      const añoParaMes = fechaInicioM40.getFullYear() + Math.floor((i - 1) / 12)
      const sdiMensual = datosUsuario.sdiHistorico * 30.4
      const tasa = getTasaM40(añoParaMes)
      const cuotaMensual = calcularCuotaMensual(sdiMensual, añoParaMes)
      acumulado += cuotaMensual
      
      const mesDelAño = ((i - 1) % 12) + 1
      const fecha = `${añoParaMes}-${mesDelAño.toString().padStart(2, '0')}-02`
      
      registros.push({
        fecha,
        uma: 0, // No hay UMA definida para meses sin datos
        tasaM40: +(tasa * 100).toFixed(3),
        sdiMensual: Math.round(sdiMensual),
        cuotaMensual: Math.round(cuotaMensual),
        acumulado: Math.round(acumulado)
      })
    }
  }
  
  // Construir objeto estrategia compatible con EstrategiaDetallada
  const estrategiaAdaptada = {
    estrategia,
    umaElegida: Math.round(umaPromedio * 10) / 10,
    mesesM40: totalMeses,
    pensionMensual: pensionActual.pensionMensual || 0,
    inversionTotal: acumulado,
    pensionConAguinaldo: pensionActual.pensionConAguinaldo || (pensionActual.pensionMensual || 0) * 13 / 12,
    ROI: pensionActual.ROI || null,
    recuperacionMeses: pensionActual.recuperacionMeses || null,
    factorEdad: pensionActual.factorEdad || (datosUsuario.retirementAge === 65 ? 1.0 : 0.75),
    conFactorEdad: pensionActual.conFactorEdad || null,
    conLeyFox: pensionActual.conLeyFox || null,
    conDependiente: pensionActual.conDependiente || null,
    registros
  }
  
  // Construir datosUsuario compatible
  const datosUsuarioAdaptados = {
    inicioM40: fechaInicioM40.toISOString().split('T')[0],
    fechaNacimiento: fechaNacimiento.toISOString().split('T')[0],
    edadJubilacion: datosUsuario.retirementAge,
    nombreFamiliar: datosUsuario.name,
    edadActual: calcularEdadActual(fechaNacimiento),
    semanasCotizadas: semanasTotales,
    semanasPrevias: semanasPrevias
  }
  
  return {
    estrategia: estrategiaAdaptada,
    datosUsuario: datosUsuarioAdaptados
  }
}

/**
 * Calcula la edad actual basándose en la fecha de nacimiento
 */
function calcularEdadActual(fechaNacimiento: Date): number {
  const hoy = new Date()
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear()
  const monthDiff = hoy.getMonth() - fechaNacimiento.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
    edad--
  }
  
  return edad
}

/**
 * Versión alternativa que usa calcularEscenarioDetallado para generar registros
 * Útil cuando se necesita compatibilidad completa con el sistema existente
 */
export function adaptarEstrategiaYam40ConDetallado({
  mesesPagados,
  mesesFuturos,
  pensionActual,
  datosUsuario
}: AdaptarEstrategiaYam40Params) {
  // Combinar meses pagados y futuros
  const todosLosMeses = [...mesesPagados, ...mesesFuturos].sort((a, b) => a.mes - b.mes)
  
  if (todosLosMeses.length === 0) {
    throw new Error("Debe haber al menos un mes")
  }
  
  // Calcular UMA promedio
  const umaPromedio = todosLosMeses.reduce((sum, m) => sum + m.uma, 0) / todosLosMeses.length
  
  // Determinar estrategia
  const umasFuturas = mesesFuturos.map(m => m.uma)
  const umaUnica = umasFuturas.length > 0 && umasFuturas.every(u => u === umasFuturas[0])
  const estrategia: 'fijo' | 'progresivo' = umaUnica ? 'fijo' : 'progresivo'
  
  // Calcular fecha de inicio
  const primerMes = todosLosMeses[0]
  const fechaInicioM40 = new Date(primerMes.año, 0, 1)
  
  // Calcular semanas
  const semanasM40 = Math.floor(todosLosMeses.length * 4.33)
  const semanasPrevias = datosUsuario.totalWeeksContributed
  
  // Calcular fecha de nacimiento
  const fechaNacimiento = datosUsuario.birthDate instanceof Date 
    ? datosUsuario.birthDate 
    : new Date(datosUsuario.birthDate)
  
  // Usar calcularEscenarioDetallado para generar registros completos
  const resultadoDetallado = calcularEscenarioDetallado({
    mesesM40: todosLosMeses.length,
    estrategia,
    semanasPrevias,
    edad: datosUsuario.retirementAge,
    dependiente: datosUsuario.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
    umaElegida: Math.round(umaPromedio),
    sdiHistorico: datosUsuario.sdiHistorico,
    inicioM40: fechaInicioM40
  })
  
  // Construir datosUsuario
  const datosUsuarioAdaptados = {
    inicioM40: fechaInicioM40.toISOString().split('T')[0],
    fechaNacimiento: fechaNacimiento.toISOString().split('T')[0],
    edadJubilacion: datosUsuario.retirementAge,
    nombreFamiliar: datosUsuario.name,
    edadActual: calcularEdadActual(fechaNacimiento),
    semanasCotizadas: semanasPrevias + semanasM40,
    semanasPrevias: semanasPrevias
  }
  
  return {
    estrategia: {
      ...resultadoDetallado,
      // Asegurar que la pensión sea la calculada actualmente
      pensionMensual: pensionActual.pensionMensual || resultadoDetallado.pensionMensual || 0
    },
    datosUsuario: datosUsuarioAdaptados
  }
}

