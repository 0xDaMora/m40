// Tabla Art. 167 (Grupo en veces UMA, CB%, INC%)
export const tabla167 = [
    { max: 1.00, cb: 100.00, inc: 0.500 }, // hasta 1 SM = 100% CB
    { max: 1.25, cb: 80.00, inc: 0.563 },
    { max: 1.50, cb: 77.11, inc: 0.814 },
    { max: 1.75, cb: 58.18, inc: 1.178 },
    { max: 2.00, cb: 49.23, inc: 1.430 },
    { max: 2.25, cb: 42.67, inc: 1.615 },
    { max: 2.50, cb: 37.65, inc: 1.756 },
    { max: 2.75, cb: 33.68, inc: 1.868 },
    { max: 3.00, cb: 30.48, inc: 1.958 },
    { max: 3.25, cb: 27.83, inc: 2.033 },
    { max: 3.50, cb: 25.60, inc: 2.096 },
    { max: 3.75, cb: 23.70, inc: 2.149 },
    { max: 4.00, cb: 22.07, inc: 2.195 },
    { max: 4.25, cb: 20.65, inc: 2.235 },
    { max: 4.50, cb: 19.39, inc: 2.271 },
    { max: 4.75, cb: 18.29, inc: 2.302 },
    { max: 5.00, cb: 17.30, inc: 2.330 },
    { max: 5.25, cb: 16.41, inc: 2.355 },
    { max: 5.50, cb: 15.61, inc: 2.377 },
    { max: 5.75, cb: 14.88, inc: 2.398 },
    { max: 6.00, cb: 14.22, inc: 2.416 },
    { max: 999, cb: 13.62, inc: 2.433 }, // 6.01 hasta límite
    { max: 9999, cb: 13.00, inc: 2.450 }, // superior al límite
  ]
  
  // Factores de edad (Art. 171)
  export const factorEdad: Record<number, number> = {
    60: 0.75,
    61: 0.80,
    62: 0.85,
    63: 0.90,
    64: 0.95,
    65: 1.00,
  }
  
  // Asignaciones familiares (Art. 164)
  export const asignaciones = {
    ninguno: 0,
    conyuge: 0.15,
    hijos: 0.10,
    ascendientes: 0.10,
  }
  
  // Proyección UMA con crecimiento 5% anual (base 2025)
  export function getUMA(year: number): number {
    const baseYear = 2025
    const baseValue = 113.07
    const diff = year - baseYear
    return parseFloat((baseValue * Math.pow(1.05, diff)).toFixed(2))
  }

  // Función auxiliar para obtener UMA histórica (años anteriores a 2025 con -5% anual)
  export function getUMAHistorica(year: number): number {
    const baseYear = 2025
    const baseValue = 113.07
    
    if (year >= baseYear) {
      // Para años futuros o 2025, usar proyección normal
      const diff = year - baseYear
      return parseFloat((baseValue * Math.pow(1.05, diff)).toFixed(2))
    } else {
      // Para años anteriores a 2025, aplicar -5% por cada año hacia atrás
      const diff = baseYear - year
      return parseFloat((baseValue * Math.pow(0.95, diff)).toFixed(2))
    }
  }
  
  // Tasa M40 oficial escalonada (DOF 2020 reforma)
  // Después de 2030 se mantiene fijo en 18.8%
  export const tasaM40: Record<number, number> = {
    2022: 0.10075,
    2023: 0.11166,
    2024: 0.12256,
    2025: 0.13347,
    2026: 0.1442,
    2027: 0.155,
    2028: 0.165,
    2029: 0.177,
    2030: 0.188, // de 2031 en adelante fijo en 18.8%
  }
  
  // Función helper para obtener tasa M40 con fallback
  export function getTasaM40(year: number): number {
    // Si el año está en la tabla, usar ese valor
    if (tasaM40[year]) {
      return tasaM40[year]
    }
    // Si es antes de 2025, usar la tasa de 2025
    if (year < 2025) {
      return tasaM40[2025]
    }
    // Si es después de 2030, usar la tasa fija de 18.8%
    if (year > 2030) {
      return 0.188
    }
    // Para años entre 2025-2030, interpolar o usar la más cercana
    // Por ahora, usar la tasa más cercana hacia abajo
    const añosOrdenados = Object.keys(tasaM40).map(Number).sort((a, b) => a - b)
    let tasa = tasaM40[2025] // Por defecto
    for (const año of añosOrdenados) {
      if (año <= year) {
        tasa = tasaM40[año]
      } else {
        break
      }
    }
    return tasa
  }