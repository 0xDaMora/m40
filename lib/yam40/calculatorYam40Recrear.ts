/**
 * Calculator para yam40 que reconstruye estrategia desde datos reales
 * Basado en calculator.ts pero reconstruye meses desde fechas inicio/fin y tipo de pago
 */

import {
  calcularSDI,
  calcularCuotaMensual,
  porcentajeLey73,
  aplicarFactores,
  calcularSemanasM40
} from "../all/utils"
import { getTasaM40, getUMA, factorEdad, asignaciones } from "../all/constants"
import { ListaSDIyam40 } from "./listaSDIyam40"
import { calcularSDIPromedio250Semanas } from "./calcularSDIPromedio250Semanas"
import { SDIMensual } from "./listaSDIyam40"

interface CalculatorYam40RecrearParams {
  fechaNacimiento: Date
  semanasPrevias: number
  sdiHistorico: number  // Salario mensual bruto del último trabajo antes de M40 (se convertirá a SDI diario)
  fechaInicioM40: { mes: number, año: number }
  fechaFinM40: { mes: number, año: number }
  tipoPago: 'uma' | 'aportacion'
  valorInicial: number  // UMA elegido o aportación inicial en pesos
  edadJubilacion: number  // 60-65
  dependiente: 'conyuge' | 'ninguno'
  listaSDI?: SDIMensual[]  // Lista SDI opcional (para modo manual)
}

/**
 * Reconstruye estrategia desde datos reales de pagos en M40
 * Usa la misma lógica de cálculo que calculator.ts
 */
export function calcularEscenarioYam40Recrear(params: CalculatorYam40RecrearParams) {
  console.log('🟡 ====== CALCULATOR YAM40 RECREAR - INICIO ======')
  console.log('🟡 Parámetros recibidos:', JSON.stringify(params, null, 2))
  
  const {
    fechaNacimiento,
    semanasPrevias,
    sdiHistorico,
    fechaInicioM40,
    fechaFinM40,
    tipoPago,
    valorInicial,
    edadJubilacion,
    dependiente,
    listaSDI: listaSDIProporcionada
  } = params
  
  console.log('🟡 Fecha nacimiento:', fechaNacimiento)
  console.log('🟡 Semanas previas:', semanasPrevias)
  console.log('🟡 Salario mensual bruto:', sdiHistorico)
  console.log('🟡 SDI histórico diario (calculado):', (sdiHistorico / 30.4).toFixed(2))
  console.log('🟡 Fecha inicio M40:', fechaInicioM40)
  console.log('🟡 Fecha fin M40:', fechaFinM40)
  console.log('🟡 Tipo pago:', tipoPago)
  console.log('🟡 Valor inicial:', valorInicial)
  console.log('🟡 Edad jubilación:', edadJubilacion)
  console.log('🟡 Dependiente:', dependiente)

  // Validaciones básicas
  if (edadJubilacion < 60 || edadJubilacion > 65) {
    throw new Error("Edad de jubilación debe estar entre 60 y 65 años")
  }

  // Solo validar valorInicial si no hay listaSDI proporcionada (modo rango)
  if (!listaSDIProporcionada && valorInicial <= 0) {
    throw new Error("El valor inicial debe ser mayor a 0")
  }

  // Calcular meses totales pagados desde fechas (o desde lista SDI si está proporcionada)
  let mesesM40: number
  if (listaSDIProporcionada && listaSDIProporcionada.length > 0) {
    mesesM40 = listaSDIProporcionada.length
  } else {
    const inicio = fechaInicioM40.año * 12 + fechaInicioM40.mes
    const fin = fechaFinM40.año * 12 + fechaFinM40.mes
    mesesM40 = Math.max(0, fin - inicio + 1)
  }

  console.log('🟡 Meses calculados:', {
    inicio: `${fechaInicioM40.mes}/${fechaInicioM40.año}`,
    fin: `${fechaFinM40.mes}/${fechaFinM40.año}`,
    mesesM40,
    desdeLista: listaSDIProporcionada ? true : false
  })

  if (mesesM40 < 1) {
    throw new Error("Debe haber al menos un mes de pago")
  }

  // Crear Date para inicioM40 (usar primer día del mes)
  const inicioM40 = new Date(fechaInicioM40.año, fechaInicioM40.mes - 1, 1)

  // Obtener tasa inicial para cálculos posteriores
  const tasaInicial = getTasaM40(fechaInicioM40.año)

  // Generar o usar lista de SDI proporcionada
  let listaSDI: SDIMensual[]
  if (listaSDIProporcionada && listaSDIProporcionada.length > 0) {
    console.log('🟡 Usando lista SDI proporcionada (modo manual)...')
    listaSDI = listaSDIProporcionada
    // Actualizar mesesM40 basado en la lista proporcionada
    const mesesM40Real = listaSDI.length
    console.log('🟡 Meses desde lista SDI:', mesesM40Real)
  } else {
    console.log('🟡 Generando lista de SDI usando ListaSDIyam40 (modo rango)...')
    listaSDI = ListaSDIyam40({
      fechaInicioM40,
      fechaFinM40,
      tipoEstrategia: tipoPago === 'aportacion' ? 'fija' : 'progresiva',
      valorInicial
    })
  }

  // Convertir listaSDI a registros con SDI mensual (desde SDI diario)
  const registros: { sdiMensual: number; cuotaMensual: number }[] = []
  let totalInversion = 0

  console.log('🟡 Convirtiendo lista SDI a registros mensuales...')
  for (const item of listaSDI) {
    // Usar SDI diario de la lista y convertir a mensual
    const sdiMensual = item.sdiDiario * 30.4
    const cuotaMensual = item.aportacionMensual
    totalInversion += cuotaMensual
    registros.push({ sdiMensual, cuotaMensual })
  }
  
  console.log('🟡 Registros generados:', registros.length)
  console.log('🟡 Total inversión acumulada:', totalInversion.toFixed(2))

  // Calcular SDI promedio usando array de 250 semanas (IGUAL QUE calculator.ts)
  // SDI siempre es diario
  // IMPORTANTE: sdiHistorico viene como salario mensual bruto, convertir a SDI diario
  // SDI diario = Salario mensual bruto / 30.4
  const sdiHistoricoDiario = sdiHistorico / 30.4
  
  console.log('🟡 Conversión de salario mensual bruto a SDI diario:')
  console.log('🟡 Salario mensual bruto:', sdiHistorico.toFixed(2))
  console.log('🟡 SDI diario calculado:', sdiHistoricoDiario.toFixed(2), `(${sdiHistorico.toFixed(2)} ÷ 30.4)`)
  
  const resultadoSDIPromedio = calcularSDIPromedio250Semanas({
    sdiHistoricoDiario: sdiHistoricoDiario,
    listaSDI: listaSDI
  })

  // El resultado es SDI promedio diario, convertir a mensual solo para porcentajeLey73
  const sdiPromedioDiario = resultadoSDIPromedio.sdiPromedioDiario
  const sdiPromedio = sdiPromedioDiario * 30.4 // Convertir a mensual para cálculos posteriores

  console.log('🟡 SDI Promedio calculado con array 250 semanas:')
  console.log('🟡 SDI Promedio diario:', sdiPromedioDiario.toFixed(2))
  console.log('🟡 SDI Promedio mensual (para cálculos):', sdiPromedio.toFixed(2))
  console.log('🟡 Semanas M40:', resultadoSDIPromedio.semanasM40)
  console.log('🟡 Semanas históricas:', resultadoSDIPromedio.semanasHistoricas)
  console.log('🟡 Explicación:', resultadoSDIPromedio.explicacion)

  // Calcular semanas totales (igual que calculator.ts)
  const semanasM40 = calcularSemanasM40(mesesM40)
  const semanasTotales = semanasPrevias + semanasM40
  console.log('🟡 Semanas M40:', semanasM40, 'Semanas previas:', semanasPrevias, 'Total:', semanasTotales)

  // Validar semanas mínimas para pensión
  if (semanasTotales < 500) {
    return {
      mesesM40,
      estrategia: tipoPago === 'uma' ? 'progresivo' : 'fijo',
      umaElegida: tipoPago === 'uma' ? valorInicial : 0,
      inversionTotal: Math.round(totalInversion),
      pensionMensual: null,
      pensionConAguinaldo: null,
      ROI: null,
      recuperacionMeses: null,
      error: "Insuficientes semanas cotizadas (mínimo 500)",
      semanasTotales,
      sdiPromedio: Math.round(sdiPromedio),
      porcentajePension: 0
    }
  }

  // Año de jubilación para cálculos (basado en fecha de nacimiento y edad de jubilación)
  const añoJubilacion = fechaNacimiento.getFullYear() + edadJubilacion
  console.log('🟡 Año jubilación calculado:', añoJubilacion, '(fecha nacimiento:', fechaNacimiento.getFullYear(), 'edad jubilación:', edadJubilacion, ')')

  // Calcular porcentaje según Ley 73 (igual que calculator.ts)
  const porcentaje = porcentajeLey73(sdiPromedio, semanasTotales, añoJubilacion)
  console.log('🟡 Porcentaje Ley 73:', porcentaje.toFixed(2), '%')
  let pensionMensual = (porcentaje / 100) * sdiPromedio
  console.log('🟡 Pensión base (antes factores):', pensionMensual.toFixed(2))

  // Aplicar factores (edad, Fox, dependientes) - igual que calculator.ts
  const pensionAntesFactores = pensionMensual
  pensionMensual = aplicarFactores(pensionMensual, edadJubilacion, dependiente)
  console.log('🟡 Pensión después factores (edad:', edadJubilacion, 'dependiente:', dependiente, '):', pensionMensual.toFixed(2))

  // Calcular factores por separado para mostrar desglose (solo informativo, no afecta pensionMensual)
  // La pensión mensual ya está correctamente calculada con aplicarFactores()
  // Estos campos sirven como respaldo si no están guardados en BD (estrategias antiguas)
  const factorEdadValor = factorEdad[edadJubilacion] || 1
  const conFactorEdad = pensionAntesFactores * factorEdadValor
  const conLeyFox = conFactorEdad * 1.11
  const conDependiente = conLeyFox * (1 + asignaciones[dependiente])

  // Validar que la pensión sea válida
  if (!pensionMensual || isNaN(pensionMensual) || pensionMensual <= 0) {
    return {
      mesesM40,
      estrategia: tipoPago === 'uma' ? 'progresivo' : 'fijo',
      umaElegida: tipoPago === 'uma' ? valorInicial : 0,
      inversionTotal: Math.round(totalInversion),
      pensionMensual: null,
      pensionConAguinaldo: null,
      ROI: null,
      recuperacionMeses: null,
      error: "Error en cálculo de pensión",
      semanasTotales,
      sdiPromedio: Math.round(sdiPromedio),
      porcentajePension: +porcentaje.toFixed(2)
    }
  }

  // Calcular métricas finales
  // Aguinaldo es exactamente igual a la pensión mensual (sin cálculos adicionales)
  const aguinaldo = pensionMensual
  const pensionConAguinaldo = pensionMensual * 13 / 12 // Promedio mensual considerando aguinaldo anual
  const recuperacionMeses = totalInversion > 0 ? totalInversion / pensionMensual : null
  const ROI = totalInversion > 0 ? (pensionMensual * 12 * 20) / totalInversion : null
  
  console.log('🟡 Métricas finales:')
  console.log('🟡 Pensión mensual:', pensionMensual.toFixed(2))
  console.log('🟡 Aguinaldo (diciembre):', aguinaldo.toFixed(2))
  console.log('🟡 Pensión con aguinaldo:', pensionConAguinaldo.toFixed(2))
  console.log('🟡 Recuperación (meses):', recuperacionMeses?.toFixed(2) || 'N/A')
  console.log('🟡 ROI:', ROI?.toFixed(2) || 'N/A')

  // Calcular UMA promedio para compatibilidad
  let umaElegida = 0
  if (tipoPago === 'uma') {
    umaElegida = valorInicial
  } else {
    // Calcular UMA promedio desde aportación inicial
    // UMA = aportacion / (valorUMA * tasa * 30.4)
    const umaValue = getUMA(fechaInicioM40.año)
    umaElegida = valorInicial / (umaValue * tasaInicial * 30.4)
  }

  const resultado = {
    mesesM40,
    estrategia: tipoPago === 'uma' ? 'progresivo' : 'fijo',
    umaElegida: Math.round(umaElegida * 10) / 10,
    inversionTotal: Math.round(totalInversion),
    pensionMensual: Math.round(pensionMensual),
    pensionConAguinaldo: Math.round(pensionConAguinaldo),
    ROI: ROI && !isNaN(ROI) ? +ROI.toFixed(2) : null,
    recuperacionMeses: recuperacionMeses && !isNaN(recuperacionMeses) ? Math.round(recuperacionMeses) : null,
    semanasTotales,
    sdiPromedio: Math.round(sdiPromedio),
    porcentajePension: +porcentaje.toFixed(2),
    // Campos informativos del desglose (respaldo si no están en BD)
    factorEdad: +factorEdadValor.toFixed(2),
    conFactorEdad: Math.round(conFactorEdad),
    conLeyFox: Math.round(conLeyFox),
    conDependiente: Math.round(conDependiente)
  }
  
  console.log('🟡 ====== CALCULATOR YAM40 RECREAR - RESULTADO FINAL ======')
  console.log('🟡 Resultado completo:', JSON.stringify(resultado, null, 2))
  console.log('🟡 ====== FIN CALCULATOR ======')
  
  return resultado
}

