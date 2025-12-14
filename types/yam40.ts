import { StrategyResult } from "./strategy"

export interface YaM40State {
  // Perfil
  profile: {
    name: string
    birthDate: Date | null
    retirementAge: number
    totalWeeksContributed: number // Semanas ANTES de M40
    civilStatus: 'soltero' | 'casado'
  }
  
  // SDI Histórico
  sdiHistorico: {
    value: number
    isDirectSDI: boolean // true = SDI directo, false = salario bruto
  }
  
  // Meses seleccionados (mantener para compatibilidad)
  mesesPagados: Array<{
    mes: number // 1-58
    año: number
    sdi: number
    uma: number
    estrategia?: 'fijo' | 'progresivo'
  }>
  
  // Meses con SDI asignado (principal)
  mesesConSDI: MesConSDI[]
  
  // Meses planificados (futuros, no pagados)
  mesesPlanificados?: MesConSDI[]
  
  // Array de 250 semanas para cálculo
  array250Semanas?: number[]
  
  // Resultados
  pensionActual?: StrategyResult & {
    registros?: Array<{
      fecha: string
      uma: number
      tasaM40?: number
      sdiMensual: number
      cuotaMensual: number
      acumulado: number
    }>
  }
  estrategiasFuturas?: StrategyResult[]
  
  // Modo de entrada de pagos
  modoEntradaPagos?: 'rango' | 'manual'
  mesesManuales?: MesManual[]
}

export interface MesConSDI {
  mes: number // 1-58
  año: number
  sdi: number
  uma: number
  estrategia?: 'fijo' | 'progresivo'
  yaPagado: boolean // true = mes ya pagado, false = mes futuro planificado
  aportacionMensual?: number // Aportación mensual (para meses históricos sin UMA calculada)
  faltaAportacion?: boolean // true = mes marcado como pagado pero falta agregar aportación
  esRetroactivo?: boolean // true = mes de pago retroactivo (morado)
}

// Tipo para fechas históricas (solo mes y año)
export interface FechaMesAño {
  mes: number // 1-12
  año: number
}

// Tipo para períodos M40 históricos con UMA variable
export interface PeriodoM40Historico {
  fechaInicio: FechaMesAño // Mes y año de inicio
  fechaFin: FechaMesAño // Mes y año de fin
  uma: number // UMA para este período (1-25)
  estrategia: 'fijo' | 'progresivo' // Estrategia para este período
  aportacionMensual?: number // Aportación mensual (opcional, para calcular UMA si no se conoce)
}

// Tipo para meses ingresados manualmente
export interface MesManual {
  mes: number // 1-12
  año: number
  aportacion: number | null // null = falta aportación
}

