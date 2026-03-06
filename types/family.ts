export interface FamilyMember {
  id: string
  userId: string
  name: string
  birthDate: Date
  weeksContributed: number
  lastGrossSalary: number
  civilStatus: 'soltero' | 'casado' | 'divorciado' | 'viudo'
  isCurrentlyContributing?: boolean
  createdAt: Date
}

export interface CreateFamilyMemberData {
  name: string
  birthDate: Date
  weeksContributed: number
  lastGrossSalary: number
  civilStatus: 'soltero' | 'casado' | 'divorciado' | 'viudo'
  isCurrentlyContributing?: boolean
}

export interface UpdateFamilyMemberData extends Partial<CreateFamilyMemberData> {
  id: string
}
