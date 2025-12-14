import { MesConSDI } from "@/types/yam40"

export interface LimitantesM40Result {
  puedeReingresar: boolean
  mesesRetroactivos: MesConSDI[]
  mensajeError?: string
  ultimaFechaPagada: Date | null
  fechaLimiteReingreso: Date | null
}

/**
 * Calcula las limitantes de Modalidad 40 según la ley:
 * - Si no hay continuidad por 12 meses, no se puede reingresar
 * - Si hay meses faltantes pero dentro del límite de 12 meses, se deben pagar retroactivamente
 */
export function calcularLimitantesM40(
  mesesPagados: MesConSDI[],
  fechaActual: Date = new Date(),
  fechaInicioPlanificacion?: Date // Fecha de inicio del primer mes planificado (opcional)
): LimitantesM40Result {
  // Si no hay meses pagados, puede iniciar normalmente
  if (mesesPagados.length === 0) {
    return {
      puedeReingresar: true,
      mesesRetroactivos: [],
      ultimaFechaPagada: null,
      fechaLimiteReingreso: null
    }
  }

  // Encontrar la última fecha pagada
  const ultimoMesPagado = mesesPagados.reduce((ultimo, mes) => {
    if (!ultimo) return mes
    
    // Usar aportacionMensual si existe, sino usar el mes del año calculado desde el número de mes
    const mesUltimo = ultimo.aportacionMensual || ((ultimo.mes - 1) % 12) + 1
    const mesActual = mes.aportacionMensual || ((mes.mes - 1) % 12) + 1
    
    const fechaUltimo = new Date(ultimo.año, mesUltimo - 1, 1)
    const fechaMes = new Date(mes.año, mesActual - 1, 1)
    
    return fechaMes > fechaUltimo ? mes : ultimo
  }, mesesPagados[0])
  
  console.log('📅 Último mes pagado encontrado:', {
    mes: ultimoMesPagado.mes,
    año: ultimoMesPagado.año,
    aportacionMensual: ultimoMesPagado.aportacionMensual,
    uma: ultimoMesPagado.uma
  })

  if (!ultimoMesPagado) {
    return {
      puedeReingresar: true,
      mesesRetroactivos: [],
      ultimaFechaPagada: null,
      fechaLimiteReingreso: null
    }
  }

  // Calcular la última fecha pagada (último día del mes)
  const mesUltimo = ultimoMesPagado.aportacionMensual || ((ultimoMesPagado.mes - 1) % 12) + 1
  const añoUltimo = ultimoMesPagado.año
  const ultimaFechaPagada = new Date(añoUltimo, mesUltimo, 0) // Último día del mes

  // Calcular la fecha límite para reingreso (12 meses después del último mes pagado)
  const fechaLimiteReingreso = new Date(ultimaFechaPagada)
  fechaLimiteReingreso.setMonth(fechaLimiteReingreso.getMonth() + 12)

  console.log('⏰ Fechas calculadas:', {
    ultimaFechaPagada: ultimaFechaPagada.toLocaleDateString('es-MX'),
    fechaLimiteReingreso: fechaLimiteReingreso.toLocaleDateString('es-MX'),
    fechaActual: fechaActual.toLocaleDateString('es-MX'),
    puedeReingresar: fechaActual <= fechaLimiteReingreso
  })

  // Verificar si ya pasó el límite de 12 meses
  if (fechaActual > fechaLimiteReingreso) {
    console.log('❌ Límite de reingreso expirado')
    return {
      puedeReingresar: false,
      mesesRetroactivos: [],
      mensajeError: `Ya no puedes reingresar a Modalidad 40. Tu último pago fue en ${mesUltimo}/${añoUltimo} y el límite de reingreso (12 meses) ya expiró.`,
      ultimaFechaPagada,
      fechaLimiteReingreso
    }
  }

  // IMPORTANTE: Los meses retroactivos solo deben calcularse si hay un GAP temporal
  // entre el último mes pagado y la fecha actual/inicio de planificación
  // Si los meses pagados son consecutivos (1, 2, 3... 56), NO debería haber retroactivos
  
  // Encontrar el número de mes más alto de los meses pagados
  const ultimoNumeroMesPagado = Math.max(...mesesPagados.map(m => m.mes), 0)
  const MAX_MESES_M40 = 58
  const mesesPagadosCount = mesesPagados.length
  
  // Si ya se alcanzaron 58 meses pagados, no hay retroactivos
  if (mesesPagadosCount >= MAX_MESES_M40) {
    return {
      puedeReingresar: true,
      mesesRetroactivos: [],
      ultimaFechaPagada,
      fechaLimiteReingreso
    }
  }
  
  // CRÍTICO: Si el último mes pagado es el mes N (ej: mes 56), los meses N+1 a 58 son FUTUROS
  // Los meses retroactivos solo aplican si hay un gap temporal real que requiere pagos retroactivos
  // Si los meses pagados son consecutivos (1, 2, 3... N), NO hay retroactivos
  
  // Verificar si hay meses disponibles para planificación futura
  const mesesDisponibles = MAX_MESES_M40 - mesesPagadosCount
  
  // Si hay una fecha de inicio de planificación, calcular meses retroactivos
  // entre el último mes pagado y la fecha de inicio (incluso si hay meses disponibles)
  // Si NO hay fecha de inicio, los meses disponibles son futuros, no retroactivos
  let fechaLimiteCalculo: Date | null = null
  let debeCalcularRetroactivos = false
  
  if (fechaInicioPlanificacion) {
    // Hay una fecha de inicio de planificación: calcular retroactivos hasta el mes anterior
    fechaLimiteCalculo = new Date(fechaInicioPlanificacion)
    fechaLimiteCalculo.setMonth(fechaLimiteCalculo.getMonth() - 1)
    
    // Verificar si hay un gap temporal entre el último mes pagado y la fecha de inicio
    const fechaUltimoMesPagado = new Date(añoUltimo, mesUltimo, 0) // Último día del mes
    const fechaAnteriorInicio = new Date(fechaInicioPlanificacion)
    fechaAnteriorInicio.setMonth(fechaAnteriorInicio.getMonth() - 1)
    
    // Si la fecha anterior al inicio es posterior al último mes pagado, hay un gap
    debeCalcularRetroactivos = fechaAnteriorInicio > fechaUltimoMesPagado
    
    console.log('📅 Verificando gap temporal:', {
      fechaUltimoMesPagado: fechaUltimoMesPagado.toLocaleDateString('es-MX'),
      fechaInicioPlanificacion: fechaInicioPlanificacion.toLocaleDateString('es-MX'),
      fechaAnteriorInicio: fechaAnteriorInicio.toLocaleDateString('es-MX'),
      hayGap: debeCalcularRetroactivos
    })
  } else {
    // No hay fecha de inicio: si hay meses disponibles, esos son futuros, no retroactivos
    if (mesesDisponibles > 0) {
      console.log('✅ No hay meses retroactivos: hay meses disponibles para planificación futura', {
        mesesPagadosCount,
        mesesDisponibles,
        ultimoNumeroMesPagado
      })
      return {
        puedeReingresar: true,
        mesesRetroactivos: [],
        ultimaFechaPagada,
        fechaLimiteReingreso
      }
    }
    // Si no hay meses disponibles, calcular hasta la fecha actual
    fechaLimiteCalculo = fechaActual
    debeCalcularRetroactivos = true
  }
  
  // Si no hay gap temporal o no se debe calcular, retornar sin retroactivos
  if (!debeCalcularRetroactivos || !fechaLimiteCalculo) {
    console.log('✅ No hay meses retroactivos: no hay gap temporal', {
      fechaInicioPlanificacion: fechaInicioPlanificacion?.toLocaleDateString('es-MX'),
      debeCalcularRetroactivos
    })
    return {
      puedeReingresar: true,
      mesesRetroactivos: [],
      ultimaFechaPagada,
      fechaLimiteReingreso
    }
  }
  
  const mesesRetroactivos: MesConSDI[] = []
  const mesLimite = fechaLimiteCalculo.getMonth() + 1 // 1-12
  const añoLimite = fechaLimiteCalculo.getFullYear()
  
  console.log('📊 Cálculo de meses retroactivos:', {
    fechaInicioPlanificacion: fechaInicioPlanificacion?.toLocaleDateString('es-MX'),
    fechaLimiteCalculo: fechaLimiteCalculo.toLocaleDateString('es-MX'),
    mesLimite,
    añoLimite,
    ultimoNumeroMesPagado,
    mesesPagadosCount,
    mesesDisponibles: MAX_MESES_M40 - mesesPagadosCount
  })

  // Crear un mapa de meses pagados para verificar rápidamente
  const mesesPagadosMap = new Map<string, boolean>()
  mesesPagados.forEach(mes => {
    const key = `${mes.año}-${mes.aportacionMensual || 1}`
    mesesPagadosMap.set(key, true)
  })

  // Calcular meses desde el mes siguiente al último pagado hasta la fecha límite
  let mesActualCalculo = mesUltimo
  let añoActualCalculo = añoUltimo
  let numeroMesRetroactivo = ultimoNumeroMesPagado + 1

  // Avanzar al mes siguiente al último pagado
  mesActualCalculo++
  if (mesActualCalculo > 12) {
    mesActualCalculo = 1
    añoActualCalculo++
  }

  // Calcular meses retroactivos hasta la fecha límite
  while (true) {
    // Verificar si hemos alcanzado la fecha límite
    const fechaActualCalculo = new Date(añoActualCalculo, mesActualCalculo - 1, 1)
    if (fechaActualCalculo > fechaLimiteCalculo) {
      break
    }
    
    // Verificar si este mes ya está pagado
    const key = `${añoActualCalculo}-${mesActualCalculo}`
    if (mesesPagadosMap.has(key)) {
      // Este mes ya está pagado, avanzar al siguiente
      mesActualCalculo++
      if (mesActualCalculo > 12) {
        mesActualCalculo = 1
        añoActualCalculo++
      }
      continue
    }
    
    // Verificar que no excedamos el límite de 58 meses
    if (numeroMesRetroactivo > MAX_MESES_M40) {
      console.warn('⚠️ Se alcanzó el límite de 58 meses durante el cálculo de retroactivos')
      break
    }
    
    // Crear mes retroactivo
    const mesRetroactivo: MesConSDI = {
      mes: numeroMesRetroactivo,
      año: añoActualCalculo,
      sdi: 0, // Se calculará después
      yaPagado: false,
      esRetroactivo: true,
      aportacionMensual: mesActualCalculo,
      uma: 0 // Se calculará después
    }
    
    mesesRetroactivos.push(mesRetroactivo)
    numeroMesRetroactivo++
    
    // Avanzar al siguiente mes
    mesActualCalculo++
    if (mesActualCalculo > 12) {
      mesActualCalculo = 1
      añoActualCalculo++
    }
  }
  
  console.log('✅ Meses retroactivos calculados:', mesesRetroactivos.length, mesesRetroactivos.map(m => `${m.aportacionMensual}/${m.año}`))
  
  return {
    puedeReingresar: true,
    mesesRetroactivos,
    ultimaFechaPagada,
    fechaLimiteReingreso
  }
}

/**
 * Calcula el número de mes en el calendario (1-58) para un mes retroactivo
 * basándose en la posición después de los meses pagados
 */
export function calcularNumeroMesCalendario(
  mesesPagados: MesConSDI[],
  mesRetroactivo: { mes: number, año: number }
): number {
  // Ordenar meses pagados por fecha
  const mesesOrdenados = [...mesesPagados].sort((a, b) => {
    const fechaA = new Date(a.año, (a.aportacionMensual || 1) - 1, 1)
    const fechaB = new Date(b.año, (b.aportacionMensual || 1) - 1, 1)
    return fechaA.getTime() - fechaB.getTime()
  })

  // Encontrar el último mes pagado
  const ultimoMesPagado = mesesOrdenados[mesesOrdenados.length - 1]
  if (!ultimoMesPagado) return 1

  // El número de mes será el siguiente al último mes pagado
  return ultimoMesPagado.mes + 1
}

