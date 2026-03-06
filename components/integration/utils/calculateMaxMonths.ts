/**
 * Calcula el máximo de meses que una persona puede estar en Modalidad 40
 * basado en su edad de jubilación objetivo y la fecha de inicio seleccionada.
 * 
 * Nota: El IMSS solo considera los últimos 58 meses de cotización para el cálculo
 * de la pensión. Meses adicionales no proporcionan ventaja en el cálculo.
 * 
 * @param birthDate - Fecha de nacimiento del usuario
 * @param retirementAge - Edad objetivo de jubilación
 * @param startMonth - Mes de inicio (1-12)
 * @param startYear - Año de inicio
 * @returns Objeto con el máximo de meses disponibles y mensajes informativos
 */
export function calculateMaxMonthsM40(
  birthDate: Date,
  retirementAge: number,
  startMonth: number,
  startYear: number
): {
  maxMonths: number
  message: string
  details: string
  isLimited: boolean
} {
  // Calcular fecha de nacimiento
  const birth = new Date(birthDate)
  
  // Calcular fecha de jubilación objetivo
  const retirementDate = new Date(birth)
  retirementDate.setFullYear(birth.getFullYear() + retirementAge)
  
  // Calcular fecha de inicio de M40
  const startDate = new Date(startYear, startMonth - 1, 1) // Mes 0-indexed en JS
  
  // Calcular diferencia en meses
  const monthsDifference = 
    (retirementDate.getFullYear() - startDate.getFullYear()) * 12 +
    (retirementDate.getMonth() - startDate.getMonth())
  
  // El IMSS considera los últimos 58 meses para el cálculo de la pensión
  const MAX_CALCULATION_MONTHS = 58
  
  // El máximo disponible es el menor entre la diferencia calculada y los meses que considera IMSS
  const maxMonths = Math.min(Math.max(0, monthsDifference), MAX_CALCULATION_MONTHS)
  
  // Determinar si está limitado por tiempo o por el máximo de meses que considera IMSS
  const isLimitedByTime = monthsDifference < MAX_CALCULATION_MONTHS
  const isLimited = isLimitedByTime || maxMonths === 0
  
  // Generar mensaje informativo
  let message = ''
  let details = ''
  
  if (maxMonths === 0) {
    message = 'No disponible'
    details = 'La fecha de inicio es posterior a la fecha de jubilación objetivo. Por favor, ajusta las fechas.'
  } else if (isLimitedByTime) {
    message = `${maxMonths} meses máximo`
    details = `Puedes estar en M40 hasta ${maxMonths} meses antes de cumplir ${retirementAge} años.`
  } else {
    message = `${MAX_CALCULATION_MONTHS} meses (máximo considerado por IMSS)`
    details = `El IMSS toma en cuenta los últimos 58 meses de cotización para el cálculo. Meses adicionales no afectan el cálculo.`
  }
  
  return {
    maxMonths,
    message,
    details,
    isLimited
  }
}

