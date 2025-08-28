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
}: Params) {
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

  // Fecha en que cumple 55 años (edad mínima recomendada para M40)
  const fecha55 = new Date(nacimiento)
  fecha55.setFullYear(nacimiento.getFullYear() + 55)

  // Usar fecha de inicio personalizada si se proporciona, sino usar la lógica por defecto
  let fechaInicioM40: Date
  if (fechaInicio) {
    fechaInicioM40 = new Date(fechaInicio)
    // Validar que la fecha de inicio no sea anterior a hoy (puede ser futura)
    if (fechaInicioM40 < hoy) {
      throw new Error("Fecha de inicio no puede ser anterior a hoy")
    }
  } else {
    // Si ya tiene más de 55, puede empezar inmediatamente
    fechaInicioM40 = edadHoy >= 55 ? hoy : fecha55
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

  // Validar que hay tiempo suficiente
  if (mesesDisponibles < 1) {
    throw new Error("No hay tiempo suficiente entre inicio M40 y jubilación")
  }

  // Límite legal: no más de 58 meses (250 semanas)
mesesDisponibles = Math.min(mesesDisponibles, 58)


  // Generar todos los escenarios posibles
  for (let meses = 1; meses <= mesesDisponibles; meses++) {
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

  // Filtrar solo resultados válidos y ordenar por ROI descendente
  const resultadosValidos = resultados
    .filter(r => r.pensionMensual !== null && r.ROI !== null)
    .sort((a, b) => (b.ROI || 0) - (a.ROI || 0))

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


