/**
 * Calcula la edad que tendrá el usuario en un mes específico del calendario
 * @param birthDate Fecha de nacimiento del usuario
 * @param mesAño Mes del año (1-12)
 * @param año Año del mes
 * @returns La edad que tendrá el usuario en ese mes, o null si no se puede calcular
 */
export function calcularEdadEnMes(
  birthDate: Date | null,
  mesAño: number,
  año: number
): number | null {
  if (!birthDate) return null

  try {
    const fechaNacimiento = birthDate instanceof Date ? birthDate : new Date(birthDate)
    const fechaMes = new Date(año, mesAño - 1, 1)
    
    // Calcular edad
    let edad = fechaMes.getFullYear() - fechaNacimiento.getFullYear()
    const monthDiff = fechaMes.getMonth() - fechaNacimiento.getMonth()
    
    // Si aún no ha cumplido años en ese mes, restar 1
    if (monthDiff < 0 || (monthDiff === 0 && fechaMes.getDate() < fechaNacimiento.getDate())) {
      edad--
    }
    
    return edad
  } catch (error) {
    console.error('Error calculando edad en mes:', error)
    return null
  }
}

/**
 * Calcula la edad que tendrá el usuario en un mes del calendario basándose en MesConSDI
 * @param birthDate Fecha de nacimiento del usuario
 * @param mesSDI Objeto MesConSDI con la información del mes
 * @returns La edad que tendrá el usuario en ese mes, o null si no se puede calcular
 */
export function calcularEdadEnMesDesdeSDI(
  birthDate: Date | null,
  mesSDI: { año: number; aportacionMensual?: number }
): number | null {
  if (!birthDate || !mesSDI) return null
  
  const mesAño = mesSDI.aportacionMensual || 1
  return calcularEdadEnMes(birthDate, mesAño, mesSDI.año)
}

