export interface Strategy {
  id: string
  name: string
  description: string
  monthlyContribution: number
  months: number
  retirementAge: number
  totalContribution: number
  estimatedPension: number
  roi: number
  type: 'basic' | 'premium'
}

// Tipo para los resultados de allStrats
export interface StrategyResult {
  estrategia: 'fijo' | 'progresivo'
  umaElegida: number
  mesesM40: number
  pensionMensual: number | null
  ROI: number | null
  inversionTotal: number | null
  error?: string
  pmgAplicada?: boolean // Indica si se aplicó la Pensión Mínima Garantizada
  pmgValor?: number // Valor de la PMG para referencia
}

export interface IntegrationFilters {
  familyMemberId: string | null
  monthlyContributionRange: {
    min: number
    max: number
  }
  months: number
  retirementAge: number
  startMonth?: number // Mes de inicio (1-12)
  startYear?: number // Año de inicio
  monthsMode?: 'fixed' | 'scan' // Modo de generación de estrategias
}

export interface StrategyFilters {
  monthsRange: {
    min: number
    max: number
  }
  sortBy: 'pension' | 'investment' | 'months'
  sortOrder: 'asc' | 'desc'
  strategyType: 'all' | 'fijo' | 'progresivo'
  umaRange: {
    min: number
    max: number
  }
  contributionRange?: {
    min: number
    max: number
  }
  filterMode?: 'uma' | 'contribution' // Modo de filtrado: UMA o Aportación Mensual
}

export interface FamilyMemberData {
  id: string
  name: string
  birthDate: Date
  weeksContributed: number
  lastGrossSalary: number
  civilStatus: string
}
