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
  sortBy: 'roi' | 'pension' | 'investment' | 'months'
  sortOrder: 'asc' | 'desc'
  strategyType: 'all' | 'fijo' | 'progresivo'
  umaRange: {
    min: number
    max: number
  }
}

export interface FamilyMemberData {
  id: string
  name: string
  birthDate: Date
  weeksContributed: number
  lastGrossSalary: number
  civilStatus: string
}
