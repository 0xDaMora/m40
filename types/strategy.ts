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
