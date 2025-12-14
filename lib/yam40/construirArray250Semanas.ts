import { MesConSDI } from "@/types/yam40"

/**
 * Construye un array de 250 semanas (58 meses) con SDI diario
 * 
 * Lógica:
 * 1. Inicializa array de 250 elementos con sdiHistorico (SDI diario del último salario)
 * 2. Reemplaza últimas N semanas con SDI de meses pagados (donde N = semanas de meses pagados)
 * 3. Reemplaza siguientes M semanas con SDI de meses planificados (donde M = semanas de meses planificados)
 * 4. Retorna array completo de 250 semanas
 * 
 * @param sdiHistorico - SDI diario del último salario antes de M40
 * @param mesesPagados - Array de meses ya pagados en M40
 * @param mesesPlanificados - Array de meses planificados para M40
 * @returns Array de 250 semanas con SDI diario
 */
export function construirArray250Semanas(
  sdiHistorico: number,
  mesesPagados: MesConSDI[],
  mesesPlanificados: MesConSDI[]
): number[] {
  // Inicializar array de 250 semanas con SDI histórico
  const array250Semanas: number[] = new Array(250).fill(sdiHistorico)
  
  // Calcular semanas de meses pagados
  const semanasPagadas = Math.floor(mesesPagados.length * 4.33)
  
  // Calcular semanas de meses planificados
  const semanasPlanificadas = Math.floor(mesesPlanificados.length * 4.33)
  
  // Reemplazar últimas N semanas con SDI de meses pagados
  // Los meses pagados reemplazan las últimas semanas del array
  let indiceSemanas = 0
  for (const mes of mesesPagados) {
    const semanasEnMes = Math.floor(4.33) // Aproximadamente 4 semanas por mes
    for (let i = 0; i < semanasEnMes && indiceSemanas < 250; i++) {
      const indice = 250 - semanasPagadas + indiceSemanas
      if (indice >= 0 && indice < 250) {
        array250Semanas[indice] = mes.sdi
      }
      indiceSemanas++
    }
  }
  
  // Reemplazar siguientes M semanas con SDI de meses planificados
  // Los meses planificados reemplazan las semanas anteriores a las pagadas
  indiceSemanas = 0
  for (const mes of mesesPlanificados) {
    const semanasEnMes = Math.floor(4.33) // Aproximadamente 4 semanas por mes
    for (let i = 0; i < semanasEnMes && indiceSemanas < 250; i++) {
      const indice = 250 - semanasPagadas - semanasPlanificadas + indiceSemanas
      if (indice >= 0 && indice < 250) {
        array250Semanas[indice] = mes.sdi
      }
      indiceSemanas++
    }
  }
  
  return array250Semanas
}

/**
 * Versión mejorada que distribuye las semanas de manera más precisa
 * Considera que cada mes tiene exactamente 4.33 semanas
 */
export function construirArray250SemanasPreciso(
  sdiHistorico: number,
  mesesPagados: MesConSDI[],
  mesesPlanificados: MesConSDI[]
): number[] {
  // Inicializar array de 250 semanas con SDI histórico
  const array250Semanas: number[] = new Array(250).fill(sdiHistorico)
  
  // Calcular total de semanas
  const semanasPagadas = Math.round(mesesPagados.length * 4.33)
  const semanasPlanificadas = Math.round(mesesPlanificados.length * 4.33)
  
  // Reemplazar últimas semanas con meses pagados
  // Distribuir las semanas de cada mes pagado
  let semanaActual = 250 - semanasPagadas
  for (const mes of mesesPagados) {
    const semanasEnMes = Math.round(4.33)
    for (let i = 0; i < semanasEnMes && semanaActual < 250; i++) {
      array250Semanas[semanaActual] = mes.sdi
      semanaActual++
    }
  }
  
  // Reemplazar semanas anteriores con meses planificados
  semanaActual = 250 - semanasPagadas - semanasPlanificadas
  for (const mes of mesesPlanificados) {
    const semanasEnMes = Math.round(4.33)
    for (let i = 0; i < semanasEnMes && semanaActual < 250 - semanasPagadas; i++) {
      if (semanaActual >= 0) {
        array250Semanas[semanaActual] = mes.sdi
      }
      semanaActual++
    }
  }
  
  return array250Semanas
}

