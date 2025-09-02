/**
 * Utilidades de cálculo centralizadas
 */

/**
 * Calcula el SDI (Salario Diario Integrado) a partir del salario mensual
 */
export const calcularSDI = (salarioMensual: number): number => {
  const diario = salarioMensual / 30
  const factorIntegracion = 1.12 // estándar (aguinaldo + prima vacacional mínimas)
  return diario * factorIntegracion
}

/**
 * Calcula la edad a partir de una fecha de nacimiento
 */
export const calcularEdad = (fechaNacimiento: Date | string): number => {
  const birthDate = fechaNacimiento instanceof Date ? fechaNacimiento : new Date(fechaNacimiento)
  const today = new Date()
  let edad = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    edad--
  }
  
  return edad
}

/**
 * Calcula la fecha de inicio de Modalidad 40
 */
export const calcularFechaInicioM40 = (startMonth: number, startYear: number): Date => {
  return new Date(startYear, startMonth - 1, 1)
}

/**
 * Calcula la fecha de jubilación
 */
export const calcularFechaJubilacion = (fechaNacimiento: Date | string, edadJubilacion: number): Date => {
  const birthDate = fechaNacimiento instanceof Date ? fechaNacimiento : new Date(fechaNacimiento)
  return new Date(birthDate.getFullYear() + edadJubilacion, birthDate.getMonth(), birthDate.getDate())
}

/**
 * Calcula la aportación mensual promedio
 */
export const calcularAportacionPromedio = (inversionTotal: number, mesesM40: number): number => {
  return Math.round(inversionTotal / mesesM40)
}

/**
 * Valida que las semanas cotizadas sean válidas
 */
export const validarSemanasCotizadas = (semanas: number): boolean => {
  return semanas >= 500 && semanas <= 2000
}

/**
 * Valida que la edad de jubilación sea válida
 */
export const validarEdadJubilacion = (edadActual: number, edadJubilacion: number): boolean => {
  return edadJubilacion >= 60 && edadJubilacion <= 65 && edadJubilacion >= edadActual
}

/**
 * Valida que el SDI esté en rango válido
 */
export const validarSDI = (sdi: number): boolean => {
  return sdi >= 100 && sdi <= 50000
}
