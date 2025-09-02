// lib/all/allStrats.ts
import { calcularEscenario } from "./calculator"
import { asignaciones } from "../pensiones/constants"

interface Params {
  fechaNacimiento: string // formato "YYYY-MM-DD"
  edadJubilacion: number  // 60—65
  semanasPrevias: number
  dependiente: "conyuge" | "ninguno"
  umaMin: number
  umaMax: number
  sdiHistorico: number // SDI diario histórico
  fechaInicio?: string // formato "YYYY-MM-DD" - fecha de inicio personalizada
  monthsMode?: 'fixed' | 'scan' // 'fixed' = solo mesesTarget; 'scan' = 1..mesesDisponibles
}

export function allStrats({
  fechaNacimiento,
  edadJubilacion,
  semanasPrevias,
  dependiente,
  umaMin,
  umaMax,
  sdiHistorico,
  fechaInicio,
  monthsMode = 'fixed',
}: Params) {
  console.log('🔍 DEBUG allStrats - Parámetros recibidos:', {
    fechaNacimiento,
    edadJubilacion,
    semanasPrevias,
    dependiente,
    umaMin,
    umaMax,
    sdiHistorico,
    fechaInicio
  })

  // Validaciones básicas de entrada
  if (!fechaNacimiento || !/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) {
    throw new Error("Formato de fecha de nacimiento inválido (usar YYYY-MM-DD)")
  }

  if (edadJubilacion < 60 || edadJubilacion > 65) {
    throw new Error("Edad de jubilación debe ser entre 60-65 años")
  }

  if (semanasPrevias < 250) {
    throw new Error("Mínimo 250 semanas previas para simulación válida")
  }

  if (umaMin < 1 || umaMax > 25 || umaMin > umaMax) {
    throw new Error("Rango UMA inválido (1-25, min ≤ max)")
  }

  if (sdiHistorico <= 0) {
    throw new Error("SDI histórico debe ser mayor a 0")
  }

  const resultados = []
  const hoy = new Date()
  const nacimiento = new Date(fechaNacimiento)

  // Validar fecha de nacimiento
  if (nacimiento > hoy) {
    throw new Error("Fecha de nacimiento no puede ser futura")
  }

  // Calcular edad actual
  const edadHoy =
    hoy.getFullYear() -
    nacimiento.getFullYear() -
    (hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate())
      ? 1
      : 0)

  // Validaciones de edad
  if (edadHoy < 40) {
    throw new Error("Edad mínima 40 años para simulación confiable")
  }

  if (edadHoy >= edadJubilacion) {
    throw new Error("Ya tiene la edad de jubilación deseada")
  }

  // Fecha en que cumple 53 años (edad mínima para M40 - ajustado para permitir más usuarios)
  const fecha53 = new Date(nacimiento)
  fecha53.setFullYear(nacimiento.getFullYear() + 53)

  // Usar fecha de inicio personalizada si se proporciona, sino usar la lógica por defecto
  let fechaInicioM40: Date
  if (fechaInicio) {
    fechaInicioM40 = new Date(fechaInicio)
    // Si la fecha de inicio es anterior a hoy, ajustar a hoy (permitir simulación)
    if (fechaInicioM40 < hoy) {
      fechaInicioM40 = new Date(hoy)
    }
  } else {
    // Si ya tiene más de 53, puede empezar inmediatamente (ajustado de 55 a 53)
    fechaInicioM40 = edadHoy >= 53 ? hoy : fecha53
  }

  // Inicio M40 = mes siguiente a la fecha de inicio
  const inicioM40 = new Date(fechaInicioM40)
  inicioM40.setMonth(fechaInicioM40.getMonth() + 1)
  inicioM40.setDate(1) // Primer día del mes

  // Fecha de jubilación (edad deseada)
  const fechaJubilacion = new Date(nacimiento)
  fechaJubilacion.setFullYear(nacimiento.getFullYear() + edadJubilacion)

  // Meses disponibles entre inicio M40 y jubilación
  let mesesDisponibles =
    (fechaJubilacion.getFullYear() - inicioM40.getFullYear()) * 12 +
    (fechaJubilacion.getMonth() - inicioM40.getMonth())

  console.log('🔍 DEBUG allStrats - Cálculos de fechas:', {
    fechaInicioM40: fechaInicioM40.toISOString().split('T')[0],
    inicioM40: inicioM40.toISOString().split('T')[0],
    fechaJubilacion: fechaJubilacion.toISOString().split('T')[0],
    mesesDisponibles
  })

  // Validar que hay tiempo suficiente
  if (mesesDisponibles < 1) {
    throw new Error("No hay tiempo suficiente entre inicio M40 y jubilación")
  }

  // Límite legal: no más de 58 meses (250 semanas)
  mesesDisponibles = Math.min(mesesDisponibles, 58)
  
  console.log('🔍 DEBUG allStrats - Meses disponibles final:', mesesDisponibles)


  // Generar escenarios
  console.log('🔍 DEBUG allStrats - Generando escenarios...')
  console.log('🔍 DEBUG allStrats - Rango UMA:', umaMin, 'a', umaMax)
  console.log('🔍 DEBUG allStrats - Meses disponibles:', mesesDisponibles)

  const mesesTarget = Math.min(58, mesesDisponibles)
  const mesesIterator = monthsMode === 'scan' 
    ? Array.from({ length: mesesDisponibles }, (_, i) => i + 1)
    : [mesesTarget]

  if (monthsMode === 'fixed') {
    console.log('🔍 DEBUG allStrats - Modo meses: fixed →', mesesTarget)
  } else {
    console.log('🔍 DEBUG allStrats - Modo meses: scan (1..', mesesDisponibles, ')')
  }

  for (const meses of mesesIterator) {
    for (const estrategia of ["fijo", "progresivo"] as const) {
      for (const uma of Array.from({ length: umaMax - umaMin + 1 }, (_, i) => umaMin + i)) {
        try {
          const resultado = calcularEscenario({
            mesesM40: meses,
            estrategia,
            semanasPrevias,
            edad: edadJubilacion,
            dependiente,
            umaElegida: uma,
            sdiHistorico,
            inicioM40,
          })

          resultados.push(resultado)
        } catch (error) {
          // Log error pero continuar con otros escenarios
          console.warn(`Error en escenario ${meses}-${estrategia}-${uma}:`, error)
        }
      }
    }
  }
  
  console.log('🔍 DEBUG allStrats - Total escenarios generados:', resultados.length)

  // Filtrar solo resultados válidos y ordenar por ROI descendente
  const resultadosValidos = resultados
    .filter(r => r.pensionMensual !== null && r.ROI !== null)
    .sort((a, b) => (b.ROI || 0) - (a.ROI || 0))

  console.log('🔍 DEBUG allStrats - Resultados válidos:', resultadosValidos.length)
  console.log('🔍 DEBUG allStrats - Primeros 3 resultados válidos:', resultadosValidos.slice(0, 3))

  return {
    resultados: resultadosValidos,
    metadatos: {
      totalEscenarios: resultados.length,
      escenariosValidos: resultadosValidos.length,
      edadActual: edadHoy,
      inicioM40: inicioM40.toISOString().split('T')[0],
      fechaJubilacion: fechaJubilacion.toISOString().split('T')[0],
      mesesDisponibles,
    }
  }
}


