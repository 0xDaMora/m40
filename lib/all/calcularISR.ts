// Cálculo de ISR para pensiones del IMSS
// Basado en la Ley del ISR y reglamentos del IMSS

interface CalculoISRParams {
  pensionMensual: number
  pensionAnual: number
  aguinaldo: number
  año: number
}

interface ResultadoISR {
  pensionBruta: number
  pensionNeta: number
  isrMensual: number
  isrAnual: number
  umbralExento: number
  baseGravable: number
  tasaEfectiva: number
  retencionMensual: number
}

export function calcularISRPension(params: CalculoISRParams): ResultadoISR {
  const { pensionMensual, pensionAnual, aguinaldo, año } = params

  // Umbral exento para pensiones del IMSS (2024)
  // Las pensiones del IMSS están exentas hasta $53,493 mensuales
  const umbralExento = 53493 // $53,493 mensuales
  
  // Si la pensión está por debajo del umbral, no hay ISR
  if (pensionMensual <= umbralExento) {
    return {
      pensionBruta: pensionMensual,
      pensionNeta: pensionMensual,
      isrMensual: 0,
      isrAnual: 0,
      umbralExento,
      baseGravable: 0,
      tasaEfectiva: 0,
      retencionMensual: 0
    }
  }

  // Base gravable (pensión - umbral exento)
  const baseGravable = pensionMensual - umbralExento
  
  // Cálculo del ISR según tabla progresiva del SAT
  // Tabla de excedente y porcentaje
  let isrMensual = 0
  
  if (baseGravable <= 844.59) {
    // 1.92% sobre el excedente
    isrMensual = baseGravable * 0.0192
  } else if (baseGravable <= 7168.51) {
    // $16.22 + 6.40% sobre el excedente de $844.59
    isrMensual = 16.22 + (baseGravable - 844.59) * 0.064
  } else if (baseGravable <= 12598.02) {
    // $459.16 + 10.88% sobre el excedente de $7,168.51
    isrMensual = 459.16 + (baseGravable - 7168.51) * 0.1088
  } else if (baseGravable <= 14644.64) {
    // $1,043.42 + 16.00% sobre el excedente de $12,598.02
    isrMensual = 1043.42 + (baseGravable - 12598.02) * 0.16
  } else if (baseGravable <= 17533.64) {
    // $1,372.29 + 17.92% sobre el excedente de $14,644.64
    isrMensual = 1372.29 + (baseGravable - 14644.64) * 0.1792
  } else if (baseGravable <= 35362.83) {
    // $1,889.97 + 21.36% sobre el excedente de $17,533.64
    isrMensual = 1889.97 + (baseGravable - 17533.64) * 0.2136
  } else if (baseGravable <= 55736.68) {
    // $5,696.91 + 23.52% sobre el excedente de $35,362.83
    isrMensual = 5696.91 + (baseGravable - 35362.83) * 0.2352
  } else if (baseGravable <= 106410.50) {
    // $10,482.88 + 30.00% sobre el excedente de $55,736.68
    isrMensual = 10482.88 + (baseGravable - 55736.68) * 0.30
  } else if (baseGravable <= 141880.66) {
    // $25,650.38 + 32.00% sobre el excedente de $106,410.50
    isrMensual = 25650.38 + (baseGravable - 106410.50) * 0.32
  } else {
    // $37,020.06 + 35.00% sobre el excedente de $141,880.66
    isrMensual = 37020.06 + (baseGravable - 141880.66) * 0.35
  }

  // ISR anual
  const isrAnual = isrMensual * 12
  
  // Pensión neta
  const pensionNeta = pensionMensual - isrMensual
  
  // Tasa efectiva
  const tasaEfectiva = (isrMensual / pensionMensual) * 100
  
  // Retención mensual (ISR + otros descuentos si aplican)
  const retencionMensual = isrMensual

  return {
    pensionBruta: pensionMensual,
    pensionNeta: Math.round(pensionNeta),
    isrMensual: Math.round(isrMensual),
    isrAnual: Math.round(isrAnual),
    umbralExento,
    baseGravable: Math.round(baseGravable),
    tasaEfectiva: +tasaEfectiva.toFixed(2),
    retencionMensual: Math.round(retencionMensual)
  }
}

// Función para calcular proyección de pensión con incrementos anuales
export function calcularProyeccionPension(params: {
  pensionInicial: number
  años: number
  incrementoAnual: number // Porcentaje (ej: 5 para 5%)
  añoInicio?: number // Año de inicio de la proyección (opcional)
}) {
  const { pensionInicial, años, incrementoAnual, añoInicio = 2024 } = params
  
  const proyeccion = []
  let pensionActual = pensionInicial
  
  for (let año = 1; año <= años; año++) {
    const pensionAnterior = pensionActual
    pensionActual = pensionAnterior * (1 + incrementoAnual / 100)
    
    const isr = calcularISRPension({
      pensionMensual: pensionActual,
      pensionAnual: pensionActual * 12,
      aguinaldo: pensionActual,
      año: añoInicio + año
    })
    
    proyeccion.push({
      año: añoInicio + año,
      pensionBruta: Math.round(pensionActual),
      pensionNeta: isr.pensionNeta,
      isrMensual: isr.isrMensual,
      incremento: +((pensionActual - pensionAnterior) / pensionAnterior * 100).toFixed(2),
      acumulado: +((pensionActual - pensionInicial) / pensionInicial * 100).toFixed(2)
    })
  }
  
  return proyeccion
}

// Función para calcular pensión de viudez
export function calcularPensionViudez(pensionTitular: number): number {
  // La pensión de viudez es el 90% de la pensión del titular
  return Math.round(pensionTitular * 0.9)
}
