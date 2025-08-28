// Función para convertir aportación mensual a UMA
// Basado en las constantes oficiales del IMSS

import { getTasaM40, getUMA } from './constants'

// Función para convertir aportación mensual a UMA
export function aportacionToUMA(aportacionMensual: number, year: number = 2025): number {
  // Obtener la tasa M40 para el año específico
  const tasaM40 = getTasaM40(year)
  
  // Obtener el valor UMA para el año específico
  const umaValue = getUMA(year)
  
  // Aportación diaria = aportación mensual / 30.4 días
  const aportacionDiaria = aportacionMensual / 30.4
  
  // UMA = aportación diaria / (tasa M40 * valor UMA)
  // La fórmula correcta es: UMA = aportación diaria / (tasa M40 * valor UMA)
  const uma = aportacionDiaria / (tasaM40 * umaValue)
  
  return Math.round(uma * 100) / 100 // Redondear a 2 decimales
}

export function umaToAportacion(uma: number, year: number = 2025): number {
  // Obtener la tasa M40 para el año específico
  const tasaM40 = getTasaM40(year)
  
  // Obtener el valor UMA para el año específico
  const umaValue = getUMA(year)
  
  // Aportación diaria = UMA * tasa M40 * valor UMA
  const aportacionDiaria = uma * tasaM40 * umaValue
  
  // Aportación mensual = aportación diaria * 30.4 días
  const aportacionMensual = aportacionDiaria * 30.4
  
  return Math.round(aportacionMensual)
}

// Obtener rango UMA basado en rango de aportación
export function getUMARange(aportacionMin: number, aportacionMax: number, year: number = 2025): { min: number; max: number } {
  const umaMin = aportacionToUMA(aportacionMin, year)
  const umaMax = aportacionToUMA(aportacionMax, year)
  
  console.log(`Debug - Aportación ${aportacionMin}-${aportacionMax} → UMA ${umaMin}-${umaMax} (año ${year})`)
  console.log(`Debug - Tasa M40: ${getTasaM40(year)}, UMA valor: ${getUMA(year)}`)
  
  // LÍMITE ESTRICTO: Máximo 25 UMA, sin excepciones
  const UMA_MAX_LEGAL = 25
  
  // Calcular rangos con límite estricto
  let min = Math.max(1, Math.floor(umaMin)) // Mínimo 1 UMA
  let max = Math.min(UMA_MAX_LEGAL, Math.ceil(umaMax)) // Máximo 25 UMA (LÍMITE ESTRICTO)
  
  // Si la aportación máxima genera más de 25 UMA, limitar a 25
  if (umaMax > UMA_MAX_LEGAL) {
    console.log(`Debug - Aportación máxima excede 25 UMA (${umaMax}), limitando a ${UMA_MAX_LEGAL}`)
    max = UMA_MAX_LEGAL
  }
  
  // Si la aportación mínima también genera más de 25 UMA, ajustar el mínimo
  if (umaMin > UMA_MAX_LEGAL) {
    console.log(`Debug - Aportación mínima también excede 25 UMA (${umaMin}), ajustando rango...`)
    min = Math.max(1, UMA_MAX_LEGAL - 4) // Dar un rango de 4 UMA como mínimo
    max = UMA_MAX_LEGAL
  }
  
  // Si el mínimo es mayor que el máximo, intercambiar
  if (min > max) {
    console.log(`Debug - Rango inválido, intercambiando min/max...`)
    const temp = min
    min = max
    max = temp
  }
  
  // Asegurar que siempre tengamos un rango válido
  if (min === max) {
    // Si son iguales, expandir ligeramente el rango
    min = Math.max(1, min - 1)
    max = Math.min(UMA_MAX_LEGAL, max + 1)
  }
  
  // Validación final
  if (min > max) {
    console.log(`Debug - Rango aún inválido, usando valores por defecto...`)
    return { min: 1, max: UMA_MAX_LEGAL }
  }
  
  console.log(`Debug - Rango final: ${min}-${max} (LÍMITE ESTRICTO: ${UMA_MAX_LEGAL})`)
  return { min, max }
}

// Validar límite de aportación (30,000 pesos)
export function validateAportacionLimit(aportacion: number): boolean {
  return aportacion <= 30000
}

// Obtener aportación máxima permitida (basada en 25 UMA)
export function getMaxAportacion(year: number = 2025): number {
  // 25 UMA es el máximo permitido legalmente
  const maxLegal = umaToAportacion(25, year)
  
  // Pero para el simulador, queremos que llegue hasta 25k para cubrir estrategias más altas
  const maxSimulador = 25000
  
  return Math.max(maxLegal, maxSimulador)
}
