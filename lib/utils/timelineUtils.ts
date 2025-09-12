/**
 * Utilidades para calcular fechas y pagos en la línea de tiempo de trámites
 */

export interface PagoTimeline {
  fecha: Date
  cuotaMensual: number
  tipo: 'normal' | 'no_pago' | 'reingreso'
  mes: number
  año: number
  descripcion: string
}

export interface TramiteTimeline {
  id: string
  titulo: string
  fecha: Date
  tipo: 'tramite' | 'pago' | 'evento'
  color: string
  descripcion: string
}

/**
 * Calcula todos los pagos mensuales para la línea de tiempo
 */
export function calcularPagosTimeline(
  fechaInicio: Date,
  mesesM40: number,
  registros: Array<{
    fecha: string
    uma: number
    tasaM40?: number
    sdiMensual: number
    cuotaMensual: number
    acumulado: number
  }>,
  esProgresivo: boolean = false
): PagoTimeline[] {
  const pagos: PagoTimeline[] = []
  
  for (let i = 0; i < mesesM40; i++) {
    const fechaPago = new Date(fechaInicio)
    fechaPago.setMonth(fechaPago.getMonth() + i)
    
    const mes = fechaPago.getMonth() + 1 // 1-12
    const año = fechaPago.getFullYear()
    
    // Buscar el registro correspondiente
    const registro = registros[i] || registros[registros.length - 1]
    
    let tipo: 'normal' | 'no_pago' | 'reingreso' = 'normal'
    let descripcion = `Pago mensual ${i + 1}/${mesesM40}`
    
    if (esProgresivo) {
      // Lógica para estrategia progresiva
      if (mes === 12 || mes === 1) {
        // Diciembre y Enero: No pagar
        tipo = 'no_pago'
        descripcion = mes === 12 ? 'No pagar - Diciembre' : 'No pagar - Enero'
      } else if (mes === 2) {
        // Febrero: Reingreso con nuevo salario
        tipo = 'reingreso'
        descripcion = 'Reingreso - Nuevo UMA + Salario más alto'
      }
    }
    
    pagos.push({
      fecha: fechaPago,
      cuotaMensual: registro.cuotaMensual,
      tipo,
      mes,
      año,
      descripcion
    })
  }
  
  return pagos
}

/**
 * Calcula las fechas importantes de trámites
 */
export function calcularFechasTramites(
  fechaInicio: Date,
  fechaJubilacion: Date,
  mesesM40: number
): TramiteTimeline[] {
  const tramites: TramiteTimeline[] = []
  
  // 1. Darse de Alta - Mismo día que inicio M40
  tramites.push({
    id: 'darse_alta',
    titulo: 'Darse de Alta',
    fecha: new Date(fechaInicio),
    tipo: 'tramite',
    color: '#3B82F6', // Azul
    descripcion: 'Inscripción en Modalidad 40'
  })
  
  // 2. Fin M40 - Solo marca el fin
  const fechaFinM40 = new Date(fechaInicio)
  fechaFinM40.setMonth(fechaFinM40.getMonth() + mesesM40 - 1)
  
  tramites.push({
    id: 'fin_m40',
    titulo: 'Fin M40',
    fecha: fechaFinM40,
    tipo: 'evento',
    color: '#6B7280', // Gris
    descripcion: 'Finalización del período M40'
  })
  
  // 3. Solicitar Jubilación - Mismo día que jubilación
  tramites.push({
    id: 'solicitar_jubilacion',
    titulo: 'Solicitar Jubilación',
    fecha: new Date(fechaJubilacion),
    tipo: 'tramite',
    color: '#EF4444', // Rojo
    descripcion: 'Tramitar pensión en el IMSS'
  })
  
  // 4. Solicitar AFORE - 3 meses después de jubilación
  const fechaAfore = new Date(fechaJubilacion)
  fechaAfore.setMonth(fechaAfore.getMonth() + 3)
  
  tramites.push({
    id: 'solicitar_afore',
    titulo: 'Solicitar AFORE',
    fecha: fechaAfore,
    tipo: 'tramite',
    color: '#F59E0B', // Amarillo
    descripcion: 'Recuperar recursos no utilizados'
  })
  
  return tramites
}

/**
 * Calcula las fechas de baja por mora para estrategias progresivas
 * Solo genera eventos que estén dentro del período M40
 */
export function calcularFechasBajaMora(
  fechaInicio: Date,
  mesesM40: number
): TramiteTimeline[] {
  const bajas: TramiteTimeline[] = []
  
  // Calcular cuántos años completos hay en los meses M40
  const añosCompletos = Math.floor(mesesM40 / 12)
  
  for (let año = 0; año < añosCompletos; año++) {
    // Diciembre del año correspondiente
    const fechaDiciembre = new Date(fechaInicio)
    fechaDiciembre.setFullYear(fechaInicio.getFullYear() + año)
    fechaDiciembre.setMonth(11) // Diciembre (0-indexado)
    
    // Enero del año siguiente
    const fechaEnero = new Date(fechaDiciembre)
    fechaEnero.setMonth(0) // Enero
    fechaEnero.setFullYear(fechaDiciembre.getFullYear() + 1)
    
    // Febrero del año siguiente (reingreso)
    const fechaFebrero = new Date(fechaEnero)
    fechaFebrero.setMonth(1) // Febrero
    
    // Verificar que las fechas estén dentro del período M40
    const fechaFinM40 = new Date(fechaInicio)
    fechaFinM40.setMonth(fechaFinM40.getMonth() + mesesM40)
    
    // Solo agregar si están dentro del período M40
    if (fechaDiciembre < fechaFinM40) {
      bajas.push({
        id: `baja_diciembre_${año}`,
        titulo: 'Baja por Mora - Diciembre',
        fecha: fechaDiciembre,
        tipo: 'evento',
        color: '#DC2626', // Rojo oscuro
        descripcion: 'No pagar - Baja automática'
      })
    }
    
    if (fechaEnero < fechaFinM40) {
      bajas.push({
        id: `baja_enero_${año}`,
        titulo: 'Baja por Mora - Enero',
        fecha: fechaEnero,
        tipo: 'evento',
        color: '#DC2626', // Rojo oscuro
        descripcion: 'No pagar - Baja automática'
      })
    }
    
    if (fechaFebrero < fechaFinM40) {
      bajas.push({
        id: `reingreso_febrero_${año}`,
        titulo: 'Reingreso - Febrero',
        fecha: fechaFebrero,
        tipo: 'tramite',
        color: '#F59E0B', // Amarillo
        descripcion: 'Reinscripción con nuevo UMA'
      })
    }
  }
  
  return bajas
}

/**
 * Combina todos los elementos de la línea de tiempo
 */
export function generarTimelineCompleta(
  fechaInicio: Date,
  fechaJubilacion: Date,
  mesesM40: number,
  registros: Array<{
    fecha: string
    uma: number
    tasaM40?: number
    sdiMensual: number
    cuotaMensual: number
    acumulado: number
  }>,
  esProgresivo: boolean = false
): {
  pagos: PagoTimeline[]
  tramites: TramiteTimeline[]
  bajasMora: TramiteTimeline[]
} {
  const pagos = calcularPagosTimeline(fechaInicio, mesesM40, registros, esProgresivo)
  const tramites = calcularFechasTramites(fechaInicio, fechaJubilacion, mesesM40)
  // No necesitamos bajasMora separadas porque ya están en los pagos
  const bajasMora: TramiteTimeline[] = []
  
  return {
    pagos,
    tramites,
    bajasMora
  }
}

/**
 * Formatea una fecha para mostrar en la línea de tiempo
 */
export function formatearFechaTimeline(fecha: Date): string {
  return fecha.toLocaleDateString('es-MX', {
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Obtiene el color correspondiente al tipo de pago
 */
export function obtenerColorPago(tipo: 'normal' | 'no_pago' | 'reingreso'): string {
  switch (tipo) {
    case 'normal':
      return '#10B981' // Verde
    case 'no_pago':
      return '#EF4444' // Rojo
    case 'reingreso':
      return '#F59E0B' // Amarillo
    default:
      return '#6B7280' // Gris
  }
}
