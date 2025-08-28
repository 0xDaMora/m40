import { umaProyeccion, tabla167, factorEdad, tasaM40, asignaciones } from "./constants"

export function calcularSDIPromedio({
  edadInicio,
  mesesM40,
  semanasPrevias,
  umaBase,
  fechaInicio,
  estrategia,
  sdiHistorico,
}: any) {
  const [anioInicio, mesInicio] = fechaInicio.split("-").map(Number)

  const registros: any[] = []
  let totalInversion = 0
  let year = anioInicio
  let month = mesInicio

  for (let i = 0; i < mesesM40; i++) {
    const umaDiaria = (month === 1 ? umaProyeccion[year - 1] : umaProyeccion[year])

    const sdi = estrategia === "progresivo"
      ? umaBase * umaDiaria
      : umaBase * (mesInicio === 1 ? umaProyeccion[anioInicio - 1] : umaProyeccion[anioInicio])

    const tasa = tasaM40[year] || 0.188
    const cuotaMensual = sdi * 30.4 * tasa
    totalInversion += cuotaMensual

    registros.push({ year, month, umaDiaria, sdi, tasa, cuotaMensual })

    month++
    if (month > 12) {
      month = 1
      year++
    }
  }

  // Calcular SDI promedio
  let sdiPromedio
  if (mesesM40 === 58) {
    sdiPromedio = registros.reduce((acc, d) => acc + d.sdi, 0) / 58
  } else {
    const faltantes = 58 - mesesM40
    let sumaSDI = registros.reduce((acc, d) => acc + d.sdi, 0)
    sumaSDI += faltantes * sdiHistorico
    sdiPromedio = sumaSDI / 58
  }

  const edadPension = edadInicio + Math.floor(mesesM40 / 12)
  const semanasTotales = semanasPrevias + Math.floor(mesesM40 * 52 / 12)

  return { registros, sdiPromedio, totalInversion, edadPension, semanasTotales }
}

export function obtenerGrupo167(vecesUMA: number) {
  return tabla167.find(g => vecesUMA <= g.max) || tabla167[tabla167.length - 1]
}

export function calcularPensionBase(sdiPromedio: number, porcentaje: number, edadPension: number) {
  let pension = (porcentaje / 100) * sdiPromedio * 30.4
  pension *= factorEdad[edadPension] || 1
  pension *= 1.11 // Factor Fox
  return pension
}

export function aplicarAsignaciones(pension: number, dependiente: keyof typeof asignaciones) {
  return pension * (1 + asignaciones[dependiente])
}
