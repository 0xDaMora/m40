/**
 * Utilidades centralizadas para cálculos en la integración
 */

import { FamilyMember } from "@/types/family"

/**
 * Calcular edad a partir de fecha de nacimiento
 */
export const calculateAge = (birthDate: Date | string): number => {
  const today = new Date()
  const birth = birthDate instanceof Date ? birthDate : new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

/**
 * Calcular SDI (Salario Diario Integrado) de manera consistente
 */
export const calcularSDI = (salarioMensual: number): number => {
  const diario = salarioMensual / 30.4 // Usar 30.4 días por mes (más preciso)
  const factorIntegracion = 1.12 // estándar (aguinaldo + prima vacacional mínimas)
  return diario * factorIntegracion
}

/**
 * Calcular SDI en UMAs
 */
export const calcularSDIEnUMAs = (salarioMensual: number): number => {
  const sdi = calcularSDI(salarioMensual)
  const uma2025 = 113.07
  return sdi / uma2025
}

/**
 * Validar familiar antes del cálculo
 */
export const validateFamilyMember = (familyMember: FamilyMember): boolean => {
  if (familyMember.weeksContributed < 500) {
    return false
  }

  if (familyMember.lastGrossSalary <= 0) {
    return false
  }

  const sdiEnUMAs = calcularSDIEnUMAs(familyMember.lastGrossSalary)
  
  if (sdiEnUMAs > 25) {
    return false
  }

  return true
}

/**
 * Obtener fecha de inicio óptima para M40
 * Reglas:
 * - 52 años: Iniciar a los 55 (3 años después)
 * - 55 años: Iniciar el mes siguiente exacto de hoy
 * - 60 años: Iniciar el mes siguiente exacto de hoy
 * - Si hoy es septiembre y tiene 55: Iniciar este año en octubre
 */
export const getOptimalStartDate = (birthDate: Date | string) => {
  const birth = birthDate instanceof Date ? birthDate : new Date(birthDate)
  const today = new Date()
  const age = calculateAge(birth)
  
  let optimalYear = today.getFullYear()
  let optimalMonth = today.getMonth() + 1
  
  // Regla 1: Si tiene menos de 55 años, programar para cuando tenga 55
  if (age < 55) {
    const yearsTo55 = 55 - age
    optimalYear = today.getFullYear() + yearsTo55
    optimalMonth = birth.getMonth() + 2 // Mes siguiente exacto de su cumpleaños 55
    
    // Si el mes siguiente es mayor a 12, pasar al siguiente año
    if (optimalMonth > 12) {
      optimalMonth = optimalMonth - 12
      optimalYear = optimalYear + 1
    }
    
    return {
      month: optimalMonth,
      year: optimalYear,
      message: `Fecha óptima de inicio: ${optimalMonth}/${optimalYear}`,
      details: `Iniciando a los 55 años para maximizar beneficios (en ${yearsTo55} años)`
    }
  }
  
  // Regla 2: Si tiene 55 años o más, iniciar el mes siguiente
  if (age >= 55) {
    // Si estamos en diciembre, pasar al siguiente año
    if (today.getMonth() === 11) { // Diciembre
      optimalMonth = 1 // Enero
      optimalYear = today.getFullYear() + 1
    } else {
      optimalMonth = today.getMonth() + 2 // Mes siguiente
      optimalYear = today.getFullYear()
    }
    
    return {
      month: optimalMonth,
      year: optimalYear,
      message: `Fecha óptima de inicio: ${optimalMonth}/${optimalYear}`,
      details: age === 55 
        ? 'Iniciando a los 55 años para maximizar beneficios'
        : 'Puede comenzar inmediatamente'
    }
  }
  
  // Fallback (no debería llegar aquí)
  return {
    month: optimalMonth,
    year: optimalYear,
    message: `Fecha de inicio: ${optimalMonth}/${optimalYear}`,
    details: 'Fecha calculada automáticamente'
  }
}
