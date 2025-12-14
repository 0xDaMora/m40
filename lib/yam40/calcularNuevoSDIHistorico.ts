import { MesConSDI } from "@/types/yam40"
import { calcularSemanasM40 } from "../all/utils"

/**
 * Calcula el nuevo SDI histórico promedio basado en los meses pagados en M40
 * 
 * El IMSS calcula la pensión usando el promedio de las últimas 250 semanas (58 meses).
 * Cuando el usuario paga meses en M40, esos meses reemplazan las ÚLTIMAS semanas del array de 250.
 * 
 * @param sdiHistoricoOriginal - SDI histórico diario original (representa las últimas 250 semanas)
 * @param mesesPagadosM40 - Array de meses pagados en M40 con sus SDI asignados
 * @returns Objeto con el nuevo SDI histórico diario y detalles del cálculo
 */
export function calcularNuevoSDIHistorico(
  sdiHistoricoOriginal: number,
  mesesPagadosM40: MesConSDI[]
): {
  sdiHistoricoDiario: number
  semanasHistoricasRestantes: number
  semanasM40: number
  semanasTotales: number
  explicacion: string
} {
  const TOTAL_SEMANAS = 250
  const TOTAL_MESES = 58

  /**
   * Construye un array de 250 semanas donde los meses M40 reemplazan las últimas N semanas
   * IMPORTANTE: Los meses deben estar ordenados cronológicamente (más antiguo primero)
   * Para reemplazar desde el final, procesamos en orden inverso (más reciente primero)
   */
  function construirArray250Semanas(sdiHistoricoDiario: number, mesesM40: MesConSDI[]): number[] {
    const arraySemanas: number[] = new Array(TOTAL_SEMANAS).fill(sdiHistoricoDiario)
    
    if (mesesM40.length === 0) {
      return arraySemanas
    }
    
    // Ordenar meses por número de mes (cronológicamente)
    const mesesOrdenados = [...mesesM40].sort((a, b) => a.mes - b.mes)
    
    // Procesar en orden inverso (más reciente primero) para reemplazar desde el final
    const mesesInvertidos = [...mesesOrdenados].reverse()
    let indiceArray = TOTAL_SEMANAS - 1 // Empezar desde el final del array (índice 249)
    
    for (const mes of mesesInvertidos) {
      // Cada mes tiene 4.33 semanas
      // Reemplazar 4 semanas completas con el SDI del mes
      for (let i = 0; i < 4 && indiceArray >= 0; i++) {
        arraySemanas[indiceArray] = mes.sdi
        indiceArray--
      }
      
      // Manejar la fracción de 0.33 semanas
      if (indiceArray >= 0) {
        // Promediar la fracción con el SDI histórico (o con el valor que ya está ahí)
        const valorActual = arraySemanas[indiceArray]
        arraySemanas[indiceArray] = (mes.sdi * 0.33) + (valorActual * 0.67)
        indiceArray--
      }
    }
    
    return arraySemanas
  }

  // Construir array de 250 semanas
  const array250Semanas = construirArray250Semanas(sdiHistoricoOriginal, mesesPagadosM40)
  
  // Calcular promedio desde el array
  const sumaTotal = array250Semanas.reduce((acc, sdi) => acc + sdi, 0)
  const nuevoSDIHistoricoDiario = sumaTotal / TOTAL_SEMANAS

  // Calcular semanas de M40 pagadas
  const semanasM40 = calcularSemanasM40(mesesPagadosM40.length)
  
  // Calcular semanas históricas restantes
  const semanasHistoricasRestantes = TOTAL_SEMANAS - semanasM40

  // Calcular SDI promedio de los meses M40 pagados (en diario) para la explicación
  const sdiPromedioM40Diario = mesesPagadosM40.length > 0
    ? mesesPagadosM40.reduce((acc, m) => acc + m.sdi, 0) / mesesPagadosM40.length
    : 0

  const explicacion = mesesPagadosM40.length > 0
    ? `De las 250 semanas (58 meses) que usa el IMSS para calcular tu pensión, ${semanasM40} semanas (${mesesPagadosM40.length} meses) de M40 reemplazan las últimas ${semanasM40} semanas del array. El SDI promedio de M40 es $${sdiPromedioM40Diario.toFixed(2)} diario, y ${semanasHistoricasRestantes} semanas restantes usan tu SDI histórico de $${sdiHistoricoOriginal.toFixed(2)} diario. El nuevo SDI histórico promedio es $${nuevoSDIHistoricoDiario.toFixed(2)} diario.`
    : `No has pagado meses en M40 aún. Tu SDI histórico sigue siendo $${sdiHistoricoOriginal.toFixed(2)} diario.`

  return {
    sdiHistoricoDiario: nuevoSDIHistoricoDiario,
    semanasHistoricasRestantes,
    semanasM40,
    semanasTotales: TOTAL_SEMANAS,
    explicacion
  }
}

