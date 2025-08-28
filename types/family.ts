export interface FamilyMember {
  id: string
  userId: string
  name: string
  birthDate: Date
  weeksContributed: number
  lastGrossSalary: number
  civilStatus: 'soltero' | 'casado' | 'divorciado' | 'viudo'
  createdAt: Date
}

export interface CreateFamilyMemberData {
  name: string
  birthDate: Date
  weeksContributed: number
  lastGrossSalary: number
  civilStatus: 'soltero' | 'casado' | 'divorciado' | 'viudo'
}

export interface UpdateFamilyMemberData extends Partial<CreateFamilyMemberData> {
  id: string
}
