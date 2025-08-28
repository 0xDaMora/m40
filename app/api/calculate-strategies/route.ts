import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth"
import { Strategy, FamilyMemberData, IntegrationFilters } from "@/types/strategy"
import { allStrats } from "@/lib/all/allStrats"
import { getUMARange } from "@/lib/all/umaConverter"

// Función para calcular estrategias usando allStrats
function calculateStrategies(familyData: FamilyMemberData, filters: IntegrationFilters): any[] {
  try {
    // Calcular año actual para usar en las conversiones
    const currentYear = new Date().getFullYear()
    
    // Convertir rango de aportación a UMA
    const umaRange = getUMARange(filters.monthlyContributionRange.min, filters.monthlyContributionRange.max, currentYear)
    
    console.log('Debug - Aportación:', filters.monthlyContributionRange)
    console.log('Debug - UMA Range:', umaRange)
    console.log('Debug - Año usado:', currentYear)
    
    // Validar que el rango UMA sea válido
    if (umaRange.min < 1 || umaRange.max > 25 || umaRange.min > umaRange.max) {
      console.log('Rango UMA inválido:', umaRange)
      return []
    }
    
    // Calcular edad actual
    const today = new Date()
    const birthDate = familyData.birthDate instanceof Date 
      ? familyData.birthDate 
      : new Date(familyData.birthDate)
    let currentAge = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      currentAge--
    }

    // Verificar que la edad de jubilación sea válida
    if (filters.retirementAge < currentAge) {
      return []
    }

    // Convertir birthDate a string si es necesario
    const birthDateString = familyData.birthDate instanceof Date 
      ? familyData.birthDate.toISOString().split('T')[0]
      : new Date(familyData.birthDate).toISOString().split('T')[0]

    // Calcular fecha de inicio basada en los filtros
    const startDate = filters.startMonth && filters.startYear 
      ? new Date(filters.startYear, filters.startMonth - 1, 1)
      : new Date() // Si no se especifica, usar fecha actual

    // Usar allStrats para generar todos los escenarios
    const resultados = allStrats({
      fechaNacimiento: birthDateString,
      edadJubilacion: filters.retirementAge,
      semanasPrevias: familyData.weeksContributed,
      dependiente: familyData.civilStatus === 'casado' ? 'conyuge' : 'ninguno',
      umaMin: umaRange.min,
      umaMax: umaRange.max,
      sdiHistorico: familyData.lastGrossSalary / 30.4, // Convertir salario mensual a diario
      fechaInicio: startDate.toISOString().split('T')[0], // Agregar fecha de inicio
    })

    return resultados.resultados
  } catch (error) {
    console.error('Error al calcular estrategias:', error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { familyData, filters }: { familyData: FamilyMemberData, filters: IntegrationFilters } = body

    // Validaciones
    if (!familyData || !filters) {
      return NextResponse.json(
        { error: "Datos requeridos" },
        { status: 400 }
      )
    }

    if (filters.months < 1 || filters.months > 58) {
      return NextResponse.json(
        { error: "Meses debe estar entre 1 y 58" },
        { status: 400 }
      )
    }

    if (filters.retirementAge < 60 || filters.retirementAge > 65) {
      return NextResponse.json(
        { error: "Edad de jubilación debe estar entre 60 y 65 años" },
        { status: 400 }
      )
    }

    if (filters.monthlyContributionRange.min < 0 || filters.monthlyContributionRange.max < filters.monthlyContributionRange.min) {
      return NextResponse.json(
        { error: "Rango de aportación inválido" },
        { status: 400 }
      )
    }

    // Calcular estrategias
    const strategies = calculateStrategies(familyData, filters)

    return NextResponse.json({
      strategies,
      count: strategies.length,
      familyData,
      filters
    })

  } catch (error) {
    console.error("Error al calcular estrategias:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
