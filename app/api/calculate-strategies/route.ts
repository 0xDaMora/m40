import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth"
import { Strategy, FamilyMemberData, IntegrationFilters } from "@/types/strategy"
import { allStrats } from "@/lib/all/allStrats"
import { getUMARange } from "@/lib/all/umaConverter"

// Función para calcular estrategias usando allStrats
function calculateStrategies(familyData: FamilyMemberData, filters: IntegrationFilters, userPreferences?: any): any[] {
  try {
    console.log('🔍 DEBUG - Iniciando cálculo de estrategias')
    console.log('🔍 DEBUG - familyData:', familyData)
    console.log('🔍 DEBUG - filters:', filters)
    console.log('🔍 DEBUG - userPreferences:', userPreferences)
    
    // Calcular año actual para usar en las conversiones
    const currentYear = new Date().getFullYear()
    
    // Convertir rango de aportación a UMA
    const umaRange = getUMARange(filters.monthlyContributionRange.min, filters.monthlyContributionRange.max, currentYear)
    
    console.log('🔍 DEBUG - Aportación:', filters.monthlyContributionRange)
    console.log('🔍 DEBUG - UMA Range:', umaRange)
    console.log('🔍 DEBUG - Año usado:', currentYear)
    
    // Validar que el rango UMA sea válido
    if (umaRange.min < 1 || umaRange.max > 25 || umaRange.min > umaRange.max) {
      console.log('❌ Rango UMA inválido:', umaRange)
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

    console.log('🔍 DEBUG - Edad actual calculada:', currentAge)
    console.log('🔍 DEBUG - Edad de jubilación:', filters.retirementAge)

    // Verificar que la edad de jubilación sea válida
    if (filters.retirementAge < currentAge) {
      console.log('❌ Edad de jubilación menor que edad actual:', filters.retirementAge, '<', currentAge)
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
    // Ahora siempre pasamos la fecha de inicio para cálculos consistentes
    const allStratsParams = {
      fechaNacimiento: birthDateString,
      edadJubilacion: filters.retirementAge,
      semanasPrevias: familyData.weeksContributed,
      dependiente: (familyData.civilStatus === 'casado' ? 'conyuge' : 'ninguno') as 'conyuge' | 'ninguno',
      umaMin: umaRange.min,
      umaMax: umaRange.max,
      sdiHistorico: familyData.lastGrossSalary / 30.4, // SDI diario (a partir de salario mensual)
      // Siempre incluir fecha de inicio para cálculos consistentes
      fechaInicio: startDate.toISOString().split('T')[0],
      // Nuevo: permitir que el cliente controle el modo de meses
      monthsMode: (filters as any).monthsMode === 'scan' ? 'scan' : 'fixed' as 'scan' | 'fixed'
    }
    
    console.log('🔍 DEBUG - Parámetros para allStrats:', allStratsParams)
    
    const resultados = allStrats(allStratsParams)
    
    console.log('🔍 DEBUG - Resultados de allStrats:', resultados)
    console.log('🔍 DEBUG - Número de estrategias encontradas:', resultados.resultados?.length || 0)

    // Filtrar estrategias según las preferencias del usuario
    let estrategiasFiltradas = resultados.resultados || []
    
    if (userPreferences) {
      console.log('🎯 Filtrando por preferencias del usuario:', userPreferences)
      
      const { nivelUMA, pensionObjetivo } = userPreferences
      
      // Filtrar por nivel UMA - MEJORADO
      if (nivelUMA) {
        // Ordenar todas las estrategias por UMA para encontrar percentiles
        const estrategiasOrdenadasUMA = [...estrategiasFiltradas].sort((a, b) => (a.umaElegida || 0) - (b.umaElegida || 0))
        const totalEstrategiasUMA = estrategiasOrdenadasUMA.length
        
        if (totalEstrategiasUMA > 0) {
          switch (nivelUMA) {
            case "conservador": {
              // Tomar el 25% inferior de las estrategias (UMAs más bajas)
              const indice25 = Math.floor(totalEstrategiasUMA * 0.25)
              const umaMax = estrategiasOrdenadasUMA[indice25]?.umaElegida || 10
              estrategiasFiltradas = estrategiasFiltradas.filter((estrategia: any) => 
                (estrategia.umaElegida || 0) <= umaMax
              )
              console.log(`🎯 Filtrado conservador - UMA <= ${umaMax}: ${estrategiasFiltradas.length} estrategias`)
              break
            }
            case "equilibrado": {
              // Tomar el 50% medio de las estrategias
              const indice25 = Math.floor(totalEstrategiasUMA * 0.25)
              const indice75 = Math.floor(totalEstrategiasUMA * 0.75)
              const umaMin = estrategiasOrdenadasUMA[indice25]?.umaElegida || 8
              const umaMax = estrategiasOrdenadasUMA[indice75]?.umaElegida || 18
              estrategiasFiltradas = estrategiasFiltradas.filter((estrategia: any) => 
                (estrategia.umaElegida || 0) >= umaMin && (estrategia.umaElegida || 0) <= umaMax
              )
              console.log(`🎯 Filtrado equilibrado - UMA ${umaMin}-${umaMax}: ${estrategiasFiltradas.length} estrategias`)
              break
            }
            case "maximo": {
              // Tomar el 25% superior de las estrategias (UMAs más altas)
              const indice75 = Math.floor(totalEstrategiasUMA * 0.75)
              const umaMin = estrategiasOrdenadasUMA[indice75]?.umaElegida || 15
              estrategiasFiltradas = estrategiasFiltradas.filter((estrategia: any) => 
                (estrategia.umaElegida || 0) >= umaMin
              )
              console.log(`🎯 Filtrado máximo - UMA >= ${umaMin}: ${estrategiasFiltradas.length} estrategias`)
              break
            }
          }
        }
      }
      
      // Filtrar por pensión objetivo - MEJORADO
      if (pensionObjetivo) {
        // Calcular pensión base sin M40 para comparar (más realista)
        const pensionBase = familyData.lastGrossSalary * 0.25 // 25% del salario como pensión base
        
        // Ordenar todas las estrategias por pensión para encontrar percentiles
        const estrategiasOrdenadas = [...estrategiasFiltradas].sort((a, b) => (a.pensionMensual || 0) - (b.pensionMensual || 0))
        const totalEstrategias = estrategiasOrdenadas.length
        
                 if (totalEstrategias > 0) {
           switch (pensionObjetivo) {
             case "basica": {
               // Tomar el 25% inferior de las estrategias (pensiones más bajas)
               const indice25 = Math.floor(totalEstrategias * 0.25)
               const pensionMin = estrategiasOrdenadas[indice25]?.pensionMensual || pensionBase
               estrategiasFiltradas = estrategiasFiltradas.filter((estrategia: any) => 
                 (estrategia.pensionMensual || 0) <= pensionMin * 1.5
               )
               break
             }
             case "confortable": {
               // Tomar el 50% medio de las estrategias
               const indice25 = Math.floor(totalEstrategias * 0.25)
               const indice75 = Math.floor(totalEstrategias * 0.75)
               const pensionMin = estrategiasOrdenadas[indice25]?.pensionMensual || pensionBase
               const pensionMax = estrategiasOrdenadas[indice75]?.pensionMensual || pensionBase * 3
               estrategiasFiltradas = estrategiasFiltradas.filter((estrategia: any) => 
                 (estrategia.pensionMensual || 0) >= pensionMin && (estrategia.pensionMensual || 0) <= pensionMax
               )
               break
             }
             case "premium": {
               // Tomar el 25% superior de las estrategias (pensiones más altas)
               const indice75 = Math.floor(totalEstrategias * 0.75)
               const pensionMin = estrategiasOrdenadas[indice75]?.pensionMensual || pensionBase * 2
               estrategiasFiltradas = estrategiasFiltradas.filter((estrategia: any) => 
                 (estrategia.pensionMensual || 0) >= pensionMin
               )
               break
             }
           }
         }
        
        console.log(`🎯 Filtrado por pensión objetivo ${pensionObjetivo}: ${estrategiasFiltradas.length} estrategias`)
      }
    }
    
    // Ordenar por pensión mensual de mayor a menor
    const saneadasPorEstrategia = [...(estrategiasFiltradas || [])].sort((a: any, b: any) => (b.pensionMensual || 0) - (a.pensionMensual || 0))
    console.log('🎯 Estrategias finales ordenadas:', saneadasPorEstrategia.length)

    // Asegurar 5 resultados siempre
    // Si el cliente pide todas (monthsMode=scan), devolver todas sin truncar
    if ((filters as any).monthsMode === 'scan') {
      return saneadasPorEstrategia
    }

    const topOrdenadas = saneadasPorEstrategia.slice(0, 5)
    if (topOrdenadas.length < 5) {
      const faltantes = 5 - topOrdenadas.length
      const relleno = (resultados.resultados || [])
        .filter((r: any) => !topOrdenadas.some((e: any) => e.mesesM40 === r.mesesM40 && e.umaElegida === r.umaElegida && e.estrategia === r.estrategia))
        .sort((a: any, b: any) => (b.pensionMensual || 0) - (a.pensionMensual || 0))
        .slice(0, faltantes)
      topOrdenadas.push(...relleno)
    }

    // Si no hay estrategias después del filtrado, devolver las mejores 5 sin filtrar
    if (topOrdenadas.length === 0) {
      console.log('⚠️ No se encontraron estrategias después del filtrado, devolviendo las mejores 5')
      const mejoresEstrategias = (resultados.resultados || []).sort((a: any, b: any) => (b.pensionMensual || 0) - (a.pensionMensual || 0)).slice(0, 5)
      return mejoresEstrategias
    }

    return topOrdenadas
  } catch (error) {
    console.error('Error al calcular estrategias:', error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    // Permitir acceso sin autenticación para HeroOnboard
    // const session = await getServerSession(authOptions)
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { error: "No autorizado" },
    //     { status: 401 }
    //   )
    // }

    const body = await request.json()
    const { familyData, filters, userPreferences }: { familyData: FamilyMemberData, filters: IntegrationFilters, userPreferences?: any } = body

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
    const strategies = calculateStrategies(familyData, filters, userPreferences)

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
