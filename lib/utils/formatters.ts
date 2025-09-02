/**
 * Utilidades de formateo centralizadas
 */

/**
 * Formatea un número como moneda mexicana
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0
  }).format(amount)
}

/**
 * Formatea un número como porcentaje
 */
export const formatPercentage = (value: number | undefined): string => {
  if (value === undefined || value === null) return "0.0%"
  return `${value.toFixed(1)}%`
}

/**
 * Formatea una fecha en formato legible
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(dateObj)
}

/**
 * Formatea un número con separadores de miles
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-MX').format(value)
}

/**
 * Formatea una edad con años
 */
export const formatAge = (years: number): string => {
  return `${years} año${years !== 1 ? 's' : ''}`
}

/**
 * Formatea semanas cotizadas
 */
export const formatWeeks = (weeks: number): string => {
  return `${weeks} semana${weeks !== 1 ? 's' : ''}`
}
