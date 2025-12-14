/**
 * Calcula SDI promedio usando array de 250 semanas
 * SDI siempre es diario (Salario Diario Integrado)
 */

import { SDIMensual } from "./listaSDIyam40"

export interface CalcularSDIPromedio250SemanasParams {
  sdiHistoricoDiario: number // SDI diario del último salario antes de M40
  listaSDI: SDIMensual[] // Lista de SDI diario por mes de ListaSDIyam40
}

export interface SDIPromedio250SemanasResult {
  sdiPromedioDiario: number // SDI promedio diario del array de 250 semanas
  semanasM40: number // Número de semanas de M40 que reemplazaron semanas históricas
  semanasHistoricas: number // Número de semanas históricas restantes
  array250Semanas: number[] // Array completo de 250 semanas (para debugging)
  explicacion: string // Explicación del cálculo
}

/**
 * Calcula SDI promedio usando array de 250 semanas
 * Los meses M40 reemplazan las últimas semanas del array
 */
export function calcularSDIPromedio250Semanas(
  params: CalcularSDIPromedio250SemanasParams
): SDIPromedio250SemanasResult {
  const { sdiHistoricoDiario, listaSDI } = params
  const TOTAL_SEMANAS = 250

  console.log('📊 ====== CALCULAR SDI PROMEDIO 250 SEMANAS - INICIO ======')
  console.log('📊 SDI histórico diario:', sdiHistoricoDiario)
  console.log('📊 Total meses M40:', listaSDI.length)

  // 1. Inicializar array de 250 semanas con SDI histórico diario
  const array250Semanas: number[] = new Array(TOTAL_SEMANAS).fill(sdiHistoricoDiario)
  console.log('📊 Array inicializado con', TOTAL_SEMANAS, 'semanas, todas con SDI histórico:', sdiHistoricoDiario)

  // 2. Calcular semanas de M40
  // Cada mes tiene 4 semanas completas
  // Cada 3 meses agregamos 1 semana adicional (0.33 * 3 = 1 semana)
  // Fórmula: (meses * 4) + Math.floor(meses / 3)
  const semanasPorMesCompletas = listaSDI.length * 4
  const semanasAdicionalesPorGrupos = Math.floor(listaSDI.length / 3)
  const semanasM40Calculadas = semanasPorMesCompletas + semanasAdicionalesPorGrupos
  const semanasM40 = Math.min(semanasM40Calculadas, TOTAL_SEMANAS)
  const semanasHistoricas = TOTAL_SEMANAS - semanasM40
  console.log('📊 Semanas M40 calculadas:', semanasM40Calculadas, `(${listaSDI.length} meses × 4 semanas + ${semanasAdicionalesPorGrupos} semanas adicionales por grupos de 3)`)
  console.log('📊 Semanas M40 limitadas a:', semanasM40, '(máximo', TOTAL_SEMANAS, 'semanas)')
  console.log('📊 Semanas históricas restantes:', semanasHistoricas)

  // 3. Reemplazar últimas semanas con SDI diario de M40
  // Procesamos meses en orden inverso (más reciente primero) para reemplazar desde el final
  // IMPORTANTE: Ordenar cronológicamente antes de hacer reverse para garantizar orden correcto
  if (listaSDI.length > 0 && semanasM40 > 0) {
    console.log('📊 Reemplazando últimas', semanasM40, 'semanas con SDI de M40...')
    
    // Ordenar listaSDI cronológicamente (más antiguo primero)
    const listaSDIOrdenada = [...listaSDI].sort((a, b) => {
      const fechaA = a.año * 12 + a.mes
      const fechaB = b.año * 12 + b.mes
      return fechaA - fechaB
    })
    
    // Luego invertir para procesar desde el más reciente
    const mesesInvertidos = listaSDIOrdenada.reverse()
    let indiceArray = TOTAL_SEMANAS - 1 // Empezar desde el final (índice 249)
    let semanasReemplazadas = 0
    let contadorMesesEnGrupo = 0 // Contador para agrupar cada 3 meses

    // Distribuir semanas de manera precisa
    // Cada mes tiene 4 semanas completas
    // Cada 3 meses agregamos 1 semana adicional (0.33 * 3 = 1 semana)
    for (let mesIndex = 0; mesIndex < mesesInvertidos.length && indiceArray >= 0 && semanasReemplazadas < semanasM40; mesIndex++) {
      const mes = mesesInvertidos[mesIndex]
      const semanasRestantes = semanasM40 - semanasReemplazadas
      
      // Cada mes distribuye 4 semanas completas
      const semanasADistribuir = Math.min(4, semanasRestantes)
      let semanasDistribuidasDelMes = 0
      
      for (let i = 0; i < semanasADistribuir && indiceArray >= 0 && semanasReemplazadas < semanasM40; i++) {
        array250Semanas[indiceArray] = mes.sdiDiario
        indiceArray--
        semanasReemplazadas++
        semanasDistribuidasDelMes++
      }

      contadorMesesEnGrupo++
      
      // Cada 3 meses, agregar 1 semana adicional
      if (contadorMesesEnGrupo === 3 && indiceArray >= 0 && semanasReemplazadas < semanasM40) {
        // Calcular promedio de SDI de los últimos 3 meses si hay variaciones
        const ultimos3Meses = mesesInvertidos.slice(Math.max(0, mesIndex - 2), mesIndex + 1)
        const sdiPromedioGrupo = ultimos3Meses.reduce((sum, m) => sum + m.sdiDiario, 0) / ultimos3Meses.length
        
        // Usar promedio si hay variaciones significativas, sino usar el SDI del mes actual
        const tieneVariaciones = ultimos3Meses.some(m => Math.abs(m.sdiDiario - ultimos3Meses[0].sdiDiario) > 0.01)
        const sdiParaSemanaExtra = tieneVariaciones ? sdiPromedioGrupo : mes.sdiDiario
        
        array250Semanas[indiceArray] = sdiParaSemanaExtra
        indiceArray--
        semanasReemplazadas++
        semanasDistribuidasDelMes++
        contadorMesesEnGrupo = 0 // Reiniciar contador
        console.log(`📊 Grupo de 3 meses completado: +1 semana adicional (SDI: ${sdiParaSemanaExtra.toFixed(2)}, ${tieneVariaciones ? 'promedio' : 'directo'})`)
      }

      console.log(`📊 Mes ${mes.mes}/${mes.año}: SDI diario=${mes.sdiDiario.toFixed(2)}, semanas distribuidas=${semanasDistribuidasDelMes}`)
    }

    // Si quedan meses sin agrupar (menos de 3), no agregamos semana adicional
    console.log('📊 Total semanas reemplazadas:', semanasReemplazadas, 'de', semanasM40, 'calculadas')
    
    // Verificar que no excedimos el límite
    if (semanasReemplazadas > TOTAL_SEMANAS) {
      console.warn('⚠️ ADVERTENCIA: Se intentaron reemplazar más semanas de las disponibles')
    }
  }

  // 4. Calcular promedio del array completo
  const sumaTotal = array250Semanas.reduce((acc, sdi) => acc + sdi, 0)
  const sdiPromedioDiario = sumaTotal / TOTAL_SEMANAS

  // Calcular SDI promedio de los meses M40 para la explicación
  const sdiPromedioM40Diario = listaSDI.length > 0
    ? listaSDI.reduce((acc, m) => acc + m.sdiDiario, 0) / listaSDI.length
    : 0

  const explicacion = listaSDI.length > 0
    ? `De las ${TOTAL_SEMANAS} semanas (58 meses) que usa el IMSS para calcular tu pensión, ${semanasM40} semanas (${listaSDI.length} meses) de M40 reemplazan las últimas ${semanasM40} semanas del array. El SDI promedio de M40 es $${sdiPromedioM40Diario.toFixed(2)} diario, y ${semanasHistoricas} semanas restantes usan tu SDI histórico de $${sdiHistoricoDiario.toFixed(2)} diario. El SDI promedio final es $${sdiPromedioDiario.toFixed(2)} diario.`
    : `No has pagado meses en M40 aún. Tu SDI histórico sigue siendo $${sdiHistoricoDiario.toFixed(2)} diario.`

  // Logs detallados del array
  console.log('📊 ====== RESUMEN ARRAY 250 SEMANAS ======')
  console.log('📊 Primeras 10 semanas:', array250Semanas.slice(0, 10).map(s => s.toFixed(2)))
  console.log('📊 Últimas 10 semanas:', array250Semanas.slice(-10).map(s => s.toFixed(2)))
  console.log('📊 SDI promedio diario calculado:', sdiPromedioDiario.toFixed(2))
  console.log('📊 SDI promedio mensual equivalente:', (sdiPromedioDiario * 30.4).toFixed(2))
  console.log('📊 Explicación:', explicacion)
  console.log('📊 ====== FIN CALCULAR SDI PROMEDIO ======')

  return {
    sdiPromedioDiario,
    semanasM40,
    semanasHistoricas,
    array250Semanas,
    explicacion
  }
}

