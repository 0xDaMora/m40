import { calcularPension, Dependiente } from "./calcular"

// 🔹 Calcula dos escenarios de venta:
// 1) Básico: sin invertir en M40, sólo seguir cotizando hasta jubilarse
// 2) Premium: con inversión en M40, topada a 25 UMA
export function calcularEscenariosVenta(params: {
  edadInicio: number        // edad actual o edad de inicio en M40
  edadJubilacion: number    // edad objetivo de retiro
  semanasPrevias: number
  sdi: number               // salario actual (bruto estimado)
  dependiente: Dependiente  // "conyuge" | "ninguno" | "hijos" | "ascendientes"
  fechaInicio: string       // formato YYYY-MM
  mesesM40: number
  estrategia: "fijo" | "progresivo"
  umaBase: number
}) {
  const {
    edadInicio,
    edadJubilacion,
    semanasPrevias,
    sdi,
    dependiente,
    fechaInicio,
    mesesM40,
    estrategia,
    umaBase,
  } = params

  // ====================================
  // ESCENARIO 1: BÁSICO (sin invertir en M40)
  // ====================================
  const añosRestantes = edadJubilacion - edadInicio
  const semanasTotales = semanasPrevias + añosRestantes * 52

  // Fórmula aproximada tipo Ley 73:
  // 30% base con 500 semanas + 2% extra cada 52 semanas adicionales
  const incrementos = Math.floor((semanasTotales - 500) / 52)
  const porcentajeBasico = 30 + 2 * incrementos

  let pensionMensualBasico = (porcentajeBasico / 100) * sdi * 30.4

  // Ajuste edad (muy simplificado)
  pensionMensualBasico *= edadJubilacion >= 65 ? 1 : edadJubilacion / 65

  // Asignaciones familiares (sólo cónyuge)
  if (dependiente === "conyuge") pensionMensualBasico *= 1.15

  const mensualConAguinaldoBasico = (pensionMensualBasico * 13) / 12

  const basico = {
    mensual: Math.round(pensionMensualBasico),
    mensualConAguinaldo: Math.round(mensualConAguinaldoBasico),
    incrementoAnual: "5%",
    inversion: 0,
    edadJubilacion,
    mensaje: `Si no haces nada, te jubilarás a los ${edadJubilacion} años con $${Math.round(
      pensionMensualBasico
    )} mensuales y un aguinaldo de $${Math.round(
      mensualConAguinaldoBasico
    )} cada noviembre.`,
  }

  // ====================================
  // ESCENARIO 2: PREMIUM (con M40 topada)
  // ====================================
  const premiumCalc = calcularPension({
    edadInicio,
    mesesM40,
    semanasPrevias,
    umaBase,       // tope legal de 25 UMA
    fechaInicio,
    dependiente,
    estrategia,    // "fijo" o "progresivo"
    sdiHistorico: sdi,
  })

  const premium = {
    mensual: Math.round(premiumCalc.mensual),
    mensualConAguinaldo: Math.round(premiumCalc.mensualConAguinaldo),
    incrementoAnual: "5%",
    inversion: Math.round(premiumCalc.totalInversion),
    edadJubilacion: premiumCalc.edadPension, // 🔹 edad real de pensión del cálculo
    mensaje: `Con Modalidad 40 puedes alcanzar hasta $${Math.round(
      premiumCalc.mensual
    )} mensuales, más un aguinaldo de $${Math.round(
      premiumCalc.mensualConAguinaldo
    )} cada noviembre. Invirtiendo $${Math.round(
      premiumCalc.totalInversion
    )} durante ${(mesesM40 / 12).toFixed(1)} años.`,
  }

  return { basico, premium }
}

