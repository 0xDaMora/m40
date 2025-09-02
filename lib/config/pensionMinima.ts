/**
 * Configuración de la Pensión Mínima Garantizada (PMG)
 * 
 * La PMG se calcula como: Salario Mínimo Diario × 30.4 × 1.15
 * 
 * Donde:
 * - 30.4: Promedio de días por mes
 * - 1.15: Factor de integración (aguinaldo + prima vacacional)
 * 
 * Este valor se actualiza anualmente según el salario mínimo vigente.
 */

export const PENSION_MINIMA_CONFIG = {
  // Salario mínimo diario vigente (actualizar cada año)
  SALARIO_MINIMO_DIARIO: 278, // 2025
  
  // Factor de integración (aguinaldo + prima vacacional mínimas)
  FACTOR_INTEGRACION: 1.15,
  
  // Promedio de días por mes
  DIAS_POR_MES: 30.4,
  
  // Año de vigencia
  ANIO_VIGENCIA: 2025
}

/**
 * Calcula la Pensión Mínima Garantizada según la configuración vigente
 * @returns La PMG en pesos mexicanos
 */
export const calcularPensionMinimaGarantizada = (): number => {
  const { SALARIO_MINIMO_DIARIO, FACTOR_INTEGRACION, DIAS_POR_MES } = PENSION_MINIMA_CONFIG
  
  return SALARIO_MINIMO_DIARIO * DIAS_POR_MES * FACTOR_INTEGRACION
}

/**
 * Obtiene la PMG actual
 */
export const PMG_ACTUAL = calcularPensionMinimaGarantizada()

/**
 * Verifica si una pensión es menor a la PMG
 * @param pension - La pensión a verificar
 * @returns true si la pensión es menor a la PMG
 */
export const esPensionMenorQuePMG = (pension: number): boolean => {
  return pension < PMG_ACTUAL
}

/**
 * Ajusta una pensión para que nunca sea menor a la PMG
 * @param pension - La pensión original
 * @returns La pensión ajustada (máximo entre la original y la PMG)
 */
export const ajustarPensionConPMG = (pension: number): number => {
  return Math.max(pension, PMG_ACTUAL)
}

/**
 * Obtiene información de la PMG para mostrar al usuario
 */
export const obtenerInfoPMG = () => {
  return {
    valor: PMG_ACTUAL,
    anio: PENSION_MINIMA_CONFIG.ANIO_VIGENCIA,
    salarioMinimo: PENSION_MINIMA_CONFIG.SALARIO_MINIMO_DIARIO,
    factorIntegracion: PENSION_MINIMA_CONFIG.FACTOR_INTEGRACION,
    diasPorMes: PENSION_MINIMA_CONFIG.DIAS_POR_MES
  }
}

/**
 * Formatea la PMG para mostrar en la UI
 */
export const formatearPMG = (): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(PMG_ACTUAL)
}

/**
 * Explicación de cómo se calcula la PMG
 */
export const EXPLICACION_PMG = `
La Pensión Mínima Garantizada (PMG) es el monto mínimo que garantiza el gobierno 
para todos los pensionados, independientemente de su SDI o semanas cotizadas.

Fórmula: Salario Mínimo Diario × 30.4 × 1.15
- Salario Mínimo Diario ${PENSION_MINIMA_CONFIG.SALARIO_MINIMO_DIARIO} (${PENSION_MINIMA_CONFIG.ANIO_VIGENCIA})
- 30.4 días promedio por mes
- 1.15 factor de integración (aguinaldo + prima vacacional)

PMG ${PENSION_MINIMA_CONFIG.ANIO_VIGENCIA}: ${formatearPMG()}
`
