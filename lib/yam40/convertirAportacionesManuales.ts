/**
 * Convierte meses manuales con aportaciones a lista de SDIMensual
 */

import { MesManual } from "@/types/yam40"
import { SDIMensual } from "./listaSDIyam40"
import { calcularSDIDesdeAportacion, calcularUMADesdeAportacion } from "./listaSDIyam40"
import { getUMA, getTasaM40 } from "../all/constants"
import { getMaxAportacionPorAño } from "../all/umaConverter"

export interface ConvertirAportacionesManualesResult {
  listaSDI: SDIMensual[]
  mesesSinAportacion: MesManual[]
  errores: Array<{ mes: number, año: number, error: string }>
}

/**
 * Convierte array de meses manuales a SDIMensual[]
 * Valida aportaciones contra límite 25 UMA por año
 * Filtra meses sin aportación
 */
export function convertirAportacionesManuales(
  mesesManuales: MesManual[]
): ConvertirAportacionesManualesResult {
  const listaSDI: SDIMensual[] = []
  const mesesSinAportacion: MesManual[] = []
  const errores: Array<{ mes: number, año: number, error: string }> = []

  // Ordenar por fecha (mes más antiguo primero)
  const mesesOrdenados = [...mesesManuales].sort((a, b) => {
    const fechaA = a.año * 12 + a.mes
    const fechaB = b.año * 12 + b.mes
    return fechaA - fechaB
  })

  for (const mesManual of mesesOrdenados) {
    // Si falta aportación, agregar a lista de pendientes
    if (mesManual.aportacion === null || mesManual.aportacion === 0) {
      mesesSinAportacion.push(mesManual)
      continue
    }

    // Validar límite 25 UMA por año
    const maxAportacion = getMaxAportacionPorAño(mesManual.año)
    if (mesManual.aportacion > maxAportacion) {
      errores.push({
        mes: mesManual.mes,
        año: mesManual.año,
        error: `La aportación excede el límite de 25 UMA (${maxAportacion.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })})`
      })
      continue
    }

    // Validar mínimo
    if (mesManual.aportacion < 1000) {
      errores.push({
        mes: mesManual.mes,
        año: mesManual.año,
        error: 'La aportación mínima es $1,000'
      })
      continue
    }

    // Calcular SDI desde aportación
    const sdiMensual = calcularSDIDesdeAportacion(mesManual.aportacion, mesManual.año)
    const sdiDiario = sdiMensual / 30.4

    // Calcular UMA equivalente
    const uma = calcularUMADesdeAportacion(mesManual.aportacion, mesManual.año)

    // Obtener valores del año
    const tasaM40 = getTasaM40(mesManual.año)
    const valorUMA = getUMA(mesManual.año)

    // Crear objeto SDIMensual
    const sdiMensualData: SDIMensual = {
      mes: mesManual.mes,
      año: mesManual.año,
      aportacionMensual: Math.round(mesManual.aportacion * 100) / 100,
      sdiMensual: Math.round(sdiMensual * 100) / 100,
      sdiDiario: Math.round(sdiDiario * 100) / 100,
      uma: Math.round(uma * 10) / 10,
      tasaM40,
      valorUMA: Math.round(valorUMA * 100) / 100
    }

    listaSDI.push(sdiMensualData)
  }

  return {
    listaSDI,
    mesesSinAportacion,
    errores
  }
}

