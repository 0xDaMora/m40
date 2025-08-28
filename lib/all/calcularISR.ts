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
  // Las pensiones del IMSS están exentas hasta cierto límite
  const umbralExento = 15000 // $15,000 mensuales (aproximado)
  
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
  
  // Cálculo simplificado del ISR (tabla progresiva)
  let isrMensual = 0
  
  if (baseGravable <= 10000) {
    // 1.92% sobre el excedente
    isrMensual = baseGravable * 0.0192
  } else if (baseGravable <= 20000) {
    // $192 + 6.4% sobre el excedente de $10,000
    isrMensual = 192 + (baseGravable - 10000) * 0.064
  } else if (baseGravable <= 35000) {
    // $832 + 10.88% sobre el excedente de $20,000
    isrMensual = 832 + (baseGravable - 20000) * 0.1088
  } else if (baseGravable <= 50000) {
    // $2,464 + 16% sobre el excedente de $35,000
    isrMensual = 2464 + (baseGravable - 35000) * 0.16
  } else if (baseGravable <= 100000) {
    // $4,864 + 17.92% sobre el excedente de $50,000
    isrMensual = 4864 + (baseGravable - 50000) * 0.1792
  } else {
    // $13,824 + 21.36% sobre el excedente de $100,000
    isrMensual = 13824 + (baseGravable - 100000) * 0.2136
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
