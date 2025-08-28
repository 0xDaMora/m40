import { umaProyeccion, tabla167, factorEdad, asignaciones, tasaM40 } from "./constants"

export type Dependiente = "ninguno" | "conyuge" | "hijos" | "ascendientes"

interface CalcularPensionParams {
  edadInicio: number
  mesesM40: number
  semanasPrevias: number
  umaBase: number
  fechaInicio: string // formato YYYY-MM
  dependiente: Dependiente
  estrategia: "fijo" | "progresivo"
  sdiHistorico: number
}

export function calcularPension({
  edadInicio,
  mesesM40,
  semanasPrevias,
  umaBase,
  fechaInicio,
  dependiente,
  estrategia,
  sdiHistorico,
}: CalcularPensionParams) {
  const [anioInicio, mesInicio] = fechaInicio.split("-").map(n => parseInt(n))

  const registros: any[] = []
  let totalInversion = 0

  let year = anioInicio
  let month = mesInicio

  // 🔹 Calcular SDI inicial solo una vez si la estrategia es "fijo"
  const umaInicial =
    mesInicio === 1 ? umaProyeccion[anioInicio - 1] : umaProyeccion[anioInicio]
  const sdiFijo = umaBase * umaInicial

  // 1. Calcular meses en M40
  for (let i = 0; i < mesesM40; i++) {
    const umaDiaria = month === 1 ? umaProyeccion[year - 1] : umaProyeccion[year]

    let sdi: number
    if (estrategia === "progresivo") {
      // 🔹 va subiendo cada año según UMA
      sdi = umaBase * umaDiaria
    } else {
      // 🔹 fijo → siempre el mismo valor inicial
      sdi = sdiFijo
    }

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

  // 2. Promedio SDI de las últimas 58 meses
  let sdiPromedio: number
  if (mesesM40 === 58) {
    const sumaSDI = registros.reduce((acc, d) => acc + d.sdi, 0)
    sdiPromedio = sumaSDI / 58
  } else {
    const faltantes = 58 - mesesM40
    let sumaSDI = registros.reduce((acc, d) => acc + d.sdi, 0)
    sumaSDI += faltantes * sdiHistorico
    sdiPromedio = sumaSDI / 58
  }

  // 3. Edad y semanas finales
  const edadPension = edadInicio + Math.ceil(mesesM40 / 12) // 🔹 redondear hacia arriba
  const semanasTotales = semanasPrevias + Math.floor((mesesM40 * 52) / 12)

  // 4. Veces UMA al pensionarse
  const umaDiariaPension = umaProyeccion[year]
  const vecesUMA = sdiPromedio / umaDiariaPension

  // 5. Tabla art. 167
  const grupo = tabla167.find(g => vecesUMA <= g.max)!
  const cb = grupo.cb
  const inc = grupo.inc

  const incrementos = Math.floor((semanasTotales - 500) / 52)
  const porcentaje = cb + inc * incrementos

  // 6. Pensión base
  let pensionMensual = (porcentaje / 100) * sdiPromedio * 30.4

  // Factor edad
  const factorEdadAplicado = factorEdad[edadPension] || 1
  pensionMensual *= factorEdadAplicado

  // Factor Fox (11% adicional)
  pensionMensual *= 1.11

  // Asignaciones familiares
  pensionMensual *= 1 + (asignaciones[dependiente] || 0)

  // Aguinaldo
  const pensionConAguinaldo = (pensionMensual * 13) / 12

  return {
    mensual: pensionMensual,
    mensualConAguinaldo: pensionConAguinaldo,
    tasa: porcentaje,
    factorEdad: factorEdadAplicado,
    edadPension,
    totalInversion,
    detalle: registros,
  }
}

