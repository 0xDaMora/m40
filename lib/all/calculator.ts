import { calcularSDI, calcularCuotaMensual, porcentajeLey73, aplicarFactores, calcularSemanasM40 } from "./utils"
import { getUMA, getTasaM40, factorEdad as factorEdadMap } from "./constants"

interface Params {
  mesesM40: number
  estrategia: "fijo" | "progresivo"
  semanasPrevias: number
  edad: number
  dependiente: "conyuge" | "ninguno"
  umaElegida: number
  sdiHistorico: number
  inicioM40: Date
}

export function calcularEscenario(params: Params) {
  const { mesesM40, estrategia, semanasPrevias, edad, dependiente, umaElegida, sdiHistorico, inicioM40 } = params

  // Validaciones básicas de negocio
  if (mesesM40 < 1 || mesesM40 > 120) {
    throw new Error("Meses M40 debe estar entre 1 y 120")
  }

  if (umaElegida < 1 || umaElegida > 25) {
    throw new Error("UMA elegida debe estar entre 1 y 25")
  }

  if (edad < 60 || edad > 65) {
    throw new Error("Edad de jubilación debe estar entre 60 y 65 años")
  }

  const registros: Array<{
    fecha: string
    uma: number
    tasaM40: number
    sdiMensual: number
    cuotaMensual: number
    acumulado: number
  }> = []
  let totalInversion = 0

  let year = inicioM40.getFullYear()
  let month = inicioM40.getMonth() + 1

  // Calcular cada mes de M40
  for (let i = 0; i < mesesM40; i++) {
    const umaYear = estrategia === "fijo" ? inicioM40.getFullYear() : year
    const sdiMensual = calcularSDI(umaElegida, umaYear)
    const tasaM40 = getTasaM40(year)
    const cuotaMensual = calcularCuotaMensual(sdiMensual, year)
    totalInversion += cuotaMensual

    const fechaMes = new Date(year, month - 1, 1)
    const fechaStr = fechaMes.toLocaleDateString('es-MX', { year: 'numeric', month: 'short' })

    registros.push({
      fecha: fechaStr,
      uma: umaElegida * getUMA(umaYear),
      tasaM40: tasaM40 * 100,
      sdiMensual,
      cuotaMensual,
      acumulado: totalInversion
    })

    // Avanzar al siguiente mes
    month++
    if (month > 12) {
      month = 1
      year++
    }
  }

  // Calcular SDI promedio de los últimos 58 meses
  let sdiPromedio: number
  if (mesesM40 >= 58) {
    const ultimos58 = registros.slice(-58)
    sdiPromedio = ultimos58.reduce((a, b) => a + b.sdiMensual, 0) / 58
  } else {
    const faltantes = 58 - mesesM40
    const sumaM40 = registros.reduce((a, b) => a + b.sdiMensual, 0)
    sdiPromedio = (sumaM40 + faltantes * (sdiHistorico * 30.4)) / 58
  }

  // Calcular semanas totales
  const semanasM40 = calcularSemanasM40(mesesM40)
  const semanasTotales = semanasPrevias + semanasM40

  // Validar semanas mínimas para pensión
  if (semanasTotales < 500) {
    return {
      mesesM40,
      estrategia,
      umaElegida,
      inversionTotal: Math.round(totalInversion),
      pensionMensual: null,
      pensionConAguinaldo: null,
      ROI: null,
      recuperacionMeses: null,
      error: "Insuficientes semanas cotizadas (mínimo 500)"
    }
  }

  // Año de jubilación para cálculos
  const añoJubilacion = inicioM40.getFullYear() + Math.ceil(mesesM40 / 12)

  // Calcular porcentaje según Ley 73
  const porcentaje = porcentajeLey73(sdiPromedio, semanasTotales, añoJubilacion)
  let pensionMensual = (porcentaje / 100) * sdiPromedio

  // Aplicar factores (edad, Fox, dependientes)
  pensionMensual = aplicarFactores(pensionMensual, edad, dependiente)

  // Validar que la pensión sea válida
  if (!pensionMensual || isNaN(pensionMensual) || pensionMensual <= 0) {
    return {
      mesesM40,
      estrategia,
      umaElegida,
      inversionTotal: Math.round(totalInversion),
      pensionMensual: null,
      pensionConAguinaldo: null,
      ROI: null,
      recuperacionMeses: null,
      error: "Error en cálculo de pensión"
    }
  }

  // Calcular factor breakdowns
  const pensionBase = (porcentaje / 100) * sdiPromedio
  const fEdad = factorEdadMap[edad] || 1
  const conFactorEdad = pensionBase * fEdad
  const conLeyFox = conFactorEdad * 1.11
  const conDependiente = conLeyFox * (1 + (dependiente === "conyuge" ? 0.15 : 0))

  // Calcular métricas finales
  const pensionConAguinaldo = pensionMensual * 13 / 12
  const recuperacionMeses = totalInversion > 0 ? totalInversion / pensionMensual : null
  const ROI = totalInversion > 0 ? (pensionMensual * 12 * 20) / totalInversion : null

  return {
    mesesM40,
    estrategia,
    umaElegida,
    inversionTotal: Math.round(totalInversion),
    pensionMensual: Math.round(pensionMensual),
    pensionConAguinaldo: Math.round(pensionConAguinaldo),
    ROI: ROI && !isNaN(ROI) ? +ROI.toFixed(2) : null,
    recuperacionMeses: recuperacionMeses && !isNaN(recuperacionMeses) ? Math.round(recuperacionMeses) : null,
    semanasTotales,
    semanasM40,
    sdiPromedio: Math.round(sdiPromedio),
    porcentajePension: +porcentaje.toFixed(2),
    factorEdad: +fEdad.toFixed(2),
    conFactorEdad: Math.round(conFactorEdad),
    conLeyFox: Math.round(conLeyFox),
    conDependiente: Math.round(conDependiente),
    registros
  }
}



