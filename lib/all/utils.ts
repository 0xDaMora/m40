import { getUMA, getTasaM40, tabla167, factorEdad, asignaciones } from "./constants"

// Calcular SDI mensual para cierto año y número de UMA
export function calcularSDI(uma: number, year: number): number {
  return uma * getUMA(year) * 30.4
}

// Calcular inversión mensual M40
export function calcularCuotaMensual(sdiMensual: number, year: number): number {
  const tasa = getTasaM40(year)
  return sdiMensual * tasa
}

// Ubicar porcentaje en tabla Art. 167
export function porcentajeLey73(sdiPromedio: number, semanasTotales: number, añoJubilacion: number): number {
  const vecesUMA = (sdiPromedio / 30.4) / getUMA(añoJubilacion) // Usar año de jubilación correcto
  const grupo = tabla167.find((g) => vecesUMA <= g.max) || tabla167[tabla167.length - 1]
  const incrementos = Math.floor((semanasTotales - 500) / 52)
  return grupo.cb + grupo.inc * incrementos
}

// Aplicar factores finales (edad, Fox, asignaciones)
export function aplicarFactores(
  pensionMensual: number,
  edad: number,
  dependiente: keyof typeof asignaciones
): number {
  pensionMensual *= factorEdad[edad] || 1 // Validar que exista el factor
  pensionMensual *= 1.11 // Ley Fox (aplica a todos los Ley 73)
  pensionMensual *= 1 + asignaciones[dependiente]
  return pensionMensual
}

// Calcular semanas cotizadas en M40
export function calcularSemanasM40(meses: number): number {
  return Math.floor(meses * 4.33)
}
