/**
 * ListaSDIyam40 que genera lista de SDI mensual por mes
 * Basado en estrategia fija (aportación inicial) o progresiva (UMA constante)
 */

import { getUMA, getTasaM40 } from "../all/constants"

export interface ListaSDIyam40Params {
  fechaInicioM40: { mes: number, año: number }
  fechaFinM40: { mes: number, año: number }
  tipoEstrategia: 'fija' | 'progresiva'
  valorInicial: number // Aportación inicial (fija) o número de UMA (progresiva)
}

export interface SDIMensual {
  mes: number // 1-12
  año: number
  aportacionMensual: number // En pesos
  sdiMensual: number // SDI mensual calculado
  sdiDiario: number // SDI diario (sdiMensual / 30.4)
  uma: number // UMA equivalente
  tasaM40: number // Tasa M40 del año
  valorUMA: number // Valor UMA del año
}

/**
 * Calcula SDI mensual desde aportación y año
 * Fórmula: sdiMensual = aportacion / tasaM40
 */
export function calcularSDIDesdeAportacion(aportacion: number, año: number): number {
  const tasaM40 = getTasaM40(año)
  return aportacion / tasaM40
}

/**
 * Calcula aportación desde SDI mensual y año
 * Fórmula: aportacion = sdiMensual * tasaM40
 */
export function calcularAportacionDesdeSDI(sdiMensual: number, año: number): number {
  const tasaM40 = getTasaM40(año)
  return sdiMensual * tasaM40
}

/**
 * Calcula SDI mensual desde número de UMA y año
 * Fórmula: sdiMensual = uma * valorUMA * 30.4
 */
export function calcularSDIDesdeUMA(uma: number, año: number): number {
  const valorUMA = getUMA(año)
  return uma * valorUMA * 30.4
}

/**
 * Calcula UMA equivalente desde aportación y año
 * Fórmula: uma = aportacion / (valorUMA * tasaM40 * 30.4)
 */
export function calcularUMADesdeAportacion(aportacion: number, año: number): number {
  const valorUMA = getUMA(año)
  const tasaM40 = getTasaM40(año)
  return aportacion / (valorUMA * tasaM40 * 30.4)
}

/**
 * Genera lista de SDI mensual para cada mes pagado en M40
 */
export function ListaSDIyam40(params: ListaSDIyam40Params): SDIMensual[] {
  const { fechaInicioM40, fechaFinM40, tipoEstrategia, valorInicial } = params

  // Validaciones
  if (valorInicial <= 0) {
    throw new Error("El valor inicial debe ser mayor a 0")
  }

  if (tipoEstrategia === 'progresiva' && (valorInicial < 1 || valorInicial > 25)) {
    throw new Error("El número de UMA debe estar entre 1 y 25")
  }

  // Calcular meses totales
  const inicio = fechaInicioM40.año * 12 + fechaInicioM40.mes
  const fin = fechaFinM40.año * 12 + fechaFinM40.mes
  const mesesM40 = Math.max(0, fin - inicio + 1)

  if (mesesM40 < 1) {
    throw new Error("La fecha de fin debe ser posterior a la fecha de inicio")
  }

  // Obtener tasa inicial para cálculos de aportación fija
  const tasaInicial = getTasaM40(fechaInicioM40.año)

  const listaSDI: SDIMensual[] = []
  let year = fechaInicioM40.año
  let month = fechaInicioM40.mes

  console.log('📋 ====== LISTA SDI YAM40 - INICIO ======')
  console.log('📋 Parámetros:', {
    fechaInicio: `${fechaInicioM40.mes}/${fechaInicioM40.año}`,
    fechaFin: `${fechaFinM40.mes}/${fechaFinM40.año}`,
    tipoEstrategia,
    valorInicial,
    mesesM40
  })

  // Iterar mes por mes desde inicio hasta fin
  for (let i = 0; i < mesesM40; i++) {
    let aportacionMensual: number
    let sdiMensual: number
    let uma: number
    const tasaM40 = getTasaM40(year)
    const valorUMA = getUMA(year)

    if (tipoEstrategia === 'fija') {
      // Estrategia fija: aportación aumenta cada año según tasa M40
      if (year === fechaInicioM40.año && month === fechaInicioM40.mes) {
        // Primer mes: usar aportación inicial
        aportacionMensual = valorInicial
      } else if (year > fechaInicioM40.año || (year === fechaInicioM40.año && month > fechaInicioM40.mes)) {
        // Meses siguientes: calcular aportación según tasa del año actual
        aportacionMensual = valorInicial * (tasaM40 / tasaInicial)
      } else {
        aportacionMensual = valorInicial
      }

      // Calcular SDI mensual desde aportación
      sdiMensual = calcularSDIDesdeAportacion(aportacionMensual, year)
      
      // Calcular UMA equivalente
      uma = calcularUMADesdeAportacion(aportacionMensual, year)
    } else {
      // Estrategia progresiva: UMA constante, SDI aumenta por valor UMA y tasa
      uma = valorInicial // UMA constante
      sdiMensual = calcularSDIDesdeUMA(uma, year)
      aportacionMensual = calcularAportacionDesdeSDI(sdiMensual, year)
    }

    const sdiDiario = sdiMensual / 30.4

    const sdiMensualData: SDIMensual = {
      mes: month,
      año: year,
      aportacionMensual: Math.round(aportacionMensual * 100) / 100,
      sdiMensual: Math.round(sdiMensual * 100) / 100,
      sdiDiario: Math.round(sdiDiario * 100) / 100,
      uma: Math.round(uma * 10) / 10,
      tasaM40,
      valorUMA: Math.round(valorUMA * 100) / 100
    }

    listaSDI.push(sdiMensualData)

    // Log cada mes (primeros 3, últimos 3, y cada 12 meses)
    if (i < 3 || i >= mesesM40 - 3 || (i + 1) % 12 === 0) {
      console.log(`📋 Mes ${i + 1}/${mesesM40} (${month}/${year}):`, {
        aportacion: `$${sdiMensualData.aportacionMensual.toLocaleString()}`,
        sdiMensual: `$${sdiMensualData.sdiMensual.toLocaleString()}`,
        sdiDiario: `$${sdiMensualData.sdiDiario.toLocaleString()}`,
        uma: `${sdiMensualData.uma} UMA`,
        tasaM40: `${(tasaM40 * 100).toFixed(2)}%`,
        valorUMA: `$${sdiMensualData.valorUMA}`
      })
    }

    // Avanzar al siguiente mes
    month++
    if (month > 12) {
      month = 1
      year++
    }

    // Si llegamos a la fecha fin, detener
    if (year > fechaFinM40.año || (year === fechaFinM40.año && month > fechaFinM40.mes)) {
      break
    }
  }

  // Calcular totales
  const totalAportacion = listaSDI.reduce((sum, item) => sum + item.aportacionMensual, 0)
  const promedioSDIMensual = listaSDI.reduce((sum, item) => sum + item.sdiMensual, 0) / listaSDI.length
  const promedioSDIDiario = listaSDI.reduce((sum, item) => sum + item.sdiDiario, 0) / listaSDI.length

  console.log('📋 ====== LISTA SDI YAM40 - RESUMEN ======')
  console.log('📋 Total meses:', listaSDI.length)
  console.log('📋 Total aportación:', `$${totalAportacion.toLocaleString()}`)
  console.log('📋 Promedio SDI mensual:', `$${Math.round(promedioSDIMensual).toLocaleString()}`)
  console.log('📋 Promedio SDI diario:', `$${Math.round(promedioSDIDiario * 100) / 100}`)
  console.log('📋 ====== FIN LISTA SDI ======')

  return listaSDI
}

