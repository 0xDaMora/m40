// Función para convertir aportación mensual a UMA
// Basado en las constantes oficiales del IMSS

import { getTasaM40, getUMA, getUMAHistorica } from './constants'

// Función para convertir aportación mensual a UMA
export function aportacionToUMA(aportacionMensual: number, year: number = 2025): number {
  // Obtener la tasa M40 para el año específico
  const tasaM40 = getTasaM40(year)
  
  // Obtener el valor UMA para el año específico (usar histórica para años anteriores a 2025)
  const umaValue = year < 2025 ? getUMAHistorica(year) : getUMA(year)
  
  // La fórmula correcta es: aportación mensual = UMA * valor UMA * tasa M40 * 30.4
  // Por lo tanto: UMA = aportación mensual / (valor UMA * tasa M40 * 30.4)
  const uma = aportacionMensual / (umaValue * tasaM40 * 30.4)
  
  console.log(`Debug - aportacionToUMA: ${aportacionMensual} → UMA ${uma} (tasa: ${tasaM40}, value: ${umaValue}, year: ${year})`)
  
  return Math.round(uma * 100) / 100 // Redondear a 2 decimales
}

export function umaToAportacion(uma: number, year: number = 2025): number {
  // Obtener la tasa M40 para el año específico
  const tasaM40 = getTasaM40(year)
  
  // Obtener el valor UMA para el año específico
  const umaValue = getUMA(year)
  
  // Aportación mensual = UMA * valor UMA * tasa M40 * 30.4
  const aportacionMensual = uma * umaValue * tasaM40 * 30.4
  
  console.log(`Debug - umaToAportacion: ${uma} UMA → ${aportacionMensual} (tasa: ${tasaM40}, value: ${umaValue})`)
  
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

// Calcular UMA desde aportación mensual y fecha
// Esta función es útil cuando el usuario solo recuerda cuánto pagaba cada mes
export function calcularUMADesdeAportacionYFecha(aportacionMensual: number, fecha: Date): number {
  const year = fecha.getFullYear()
  return aportacionToUMA(aportacionMensual, year)
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

// Obtener aportación máxima permitida para un año específico (basada estrictamente en 25 UMA)
// Esta función respeta el límite legal sin excepciones
export function getMaxAportacionPorAño(year: number): number {
  // 25 UMA es el máximo permitido legalmente, sin excepciones
  return umaToAportacion(25, year)
}
