/**
 * Utilidades para manejo de estrategias
 */

import { calcularEdad, calcularFechaInicioM40, calcularAportacionPromedio, calcularSDI } from './calculations'

/**
 * Genera un código único para una estrategia
 * Ahora incluye la fecha de inicio (mes/año) para diferenciar estrategias con diferentes fechas
 */
export const generarCodigoEstrategia = (tipo: 'compra' | 'integration' | 'premium', datos: any): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  
  switch (tipo) {
    case 'compra':
      return `compra_${timestamp}_${random}`
    case 'integration':
      // Incluir fecha de inicio en el código para diferenciar estrategias con diferentes fechas
      const fechaInicio = datos.inicioM40 || datos.fechaInicio || "2024-02-01"
      const fecha = new Date(fechaInicio)
      const mes = fecha.getMonth() + 1 // getMonth() devuelve 0-11
      const año = fecha.getFullYear()
      return `integration_${datos.familyMemberId}_${datos.estrategia}_${datos.umaElegida}_${datos.mesesM40}_${datos.edadJubilacion}_${mes.toString().padStart(2, '0')}${año}`
    case 'premium':
      return `premium_${timestamp}_${random}`
    default:
      return `estrategia_${timestamp}_${random}`
  }
}

/**
 * Construye los datos de estrategia para la API
 * Incluye tanto parámetros de entrada como resultados calculados
 */
export const construirDatosEstrategia = (estrategia: any, datosUsuario: any, inicioM40?: string) => {
  return {
    // Parámetros de entrada (para recrear la estrategia)
    mesesM40: estrategia.mesesM40,
    estrategia: estrategia.estrategia,
    umaElegida: estrategia.umaElegida,
    edad: datosUsuario.edad,
    dependiente: datosUsuario.dependiente,
    // sdiHistorico en DIARIO bruto. Se asume que datosUsuario.sdiHistorico ya viene en diario.
    sdiHistorico: datosUsuario.sdiHistorico,
    semanasPrevias: datosUsuario.semanasPrevias,
    inicioM40: inicioM40 || datosUsuario.inicioM40 || "2024-02-01",
    
    // RESULTADOS CALCULADOS (necesarios para mostrar en "mis estrategias")
    pensionMensual: estrategia.pensionMensual,
    inversionTotal: estrategia.inversionTotal,
    ROI: estrategia.ROI,
    recuperacionMeses: estrategia.recuperacionMeses,
    factorEdad: estrategia.factorEdad,
    conFactorEdad: estrategia.conFactorEdad,
    conLeyFox: estrategia.conLeyFox,
    conDependiente: estrategia.conDependiente,
    registros: estrategia.registros
  }
}

/**
 * Construye los datos completos del usuario
 */
export const construirDatosUsuario = (datosUsuario: any, estrategia: any, nombreFamiliar?: string) => {
  return {
    inicioM40: datosUsuario.inicioM40 || "2024-02-01",
    edad: datosUsuario.edad,
    dependiente: datosUsuario.dependiente,
    // sdiHistorico y sdiActual en DIARIO bruto
    sdiHistorico: datosUsuario.sdiHistorico,
    semanasPrevias: datosUsuario.semanasPrevias,
    // Información personalizada del familiar
    nombreFamiliar: nombreFamiliar || datosUsuario.nombreFamiliar,
    edadActual: datosUsuario.fechaNacimiento ? calcularEdad(datosUsuario.fechaNacimiento) : datosUsuario.edad,
    semanasCotizadas: datosUsuario.semanasPrevias,
    sdiActual: datosUsuario.sdiHistorico,
    salarioMensual: Math.round(datosUsuario.sdiHistorico * 30.4),
    estadoCivil: datosUsuario.dependiente === 'conyuge' ? 'casado' : 'soltero',
    fechaNacimiento: datosUsuario.fechaNacimiento,
    edadJubilacion: datosUsuario.edad,
    aportacionPromedio: calcularAportacionPromedio(estrategia.inversionTotal, estrategia.mesesM40)
  }
}

/**
 * Construye parámetros de URL para fallback
 * Ahora incluye la fecha de inicio para reconstruir correctamente la estrategia
 */
export const construirParametrosURL = (estrategia: any, datosUsuario: any, nombreFamiliar: string) => {
  return {
    edadJubilacion: datosUsuario.edad.toString(),
    fechaNacimiento: datosUsuario.fechaNacimiento || new Date().toISOString().split('T')[0],
    nombreFamiliar,
    edadActual: (datosUsuario.fechaNacimiento ? calcularEdad(datosUsuario.fechaNacimiento) : datosUsuario.edad).toString(),
    semanasCotizadas: datosUsuario.semanasPrevias.toString(),
    sdiActual: datosUsuario.sdiHistorico.toString(),
    salarioMensual: Math.round(datosUsuario.sdiHistorico * 30.4).toString(),
    estadoCivil: datosUsuario.dependiente === 'conyuge' ? 'casado' : 'soltero',
    aportacionPromedio: calcularAportacionPromedio(estrategia.inversionTotal, estrategia.mesesM40).toString(),
    // Datos básicos de la estrategia
    meses: estrategia.mesesM40.toString(),
    estrategia: estrategia.estrategia,
    uma: estrategia.umaElegida.toString(),
    edad: datosUsuario.edad.toString(),
    dependiente: datosUsuario.dependiente,
    sdi: calcularSDI(datosUsuario.sdiHistorico * 30.4).toString(),
    semanas: datosUsuario.semanasPrevias.toString(),
    fecha: datosUsuario.inicioM40 || "2024-02-01",
    // Incluir fecha de inicio específica para reconstruir la estrategia exacta
    fechaInicio: datosUsuario.inicioM40 || "2024-02-01"
  }
}

/**
 * Maneja el guardado de estrategia con fallback
 */
export const guardarEstrategiaConFallback = async (
  strategyCode: string,
  datosEstrategia: any,
  datosUsuario: any,
  nombreFamiliar: string
): Promise<{ success: boolean; url: string; fallback?: boolean }> => {
  try {
    const response = await fetch('/api/guardar-estrategia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        debugCode: strategyCode,
        datosEstrategia,
        datosUsuario
      }),
    })

    if (response.ok) {
      return { success: true, url: `/estrategia/${strategyCode}` }
    } else if (response.status === 409) {
      // La estrategia ya existe
      return { success: true, url: `/estrategia/${strategyCode}` }
    } else {
      // Error en el servidor, usar fallback
      const params = new URLSearchParams(construirParametrosURL(datosEstrategia, datosUsuario, nombreFamiliar))
      const fallbackUrl = `/estrategia/${strategyCode}?${params.toString()}`
      return { success: true, url: fallbackUrl, fallback: true }
    }
  } catch (error) {
    // Error general, usar fallback básico
    const fallbackUrl = `/estrategia/${strategyCode}`
    return { success: true, url: fallbackUrl, fallback: true }
  }
}

/**
 * Valida que una estrategia sea válida
 */
export const validarEstrategia = (estrategia: any): boolean => {
  return !!(
    estrategia &&
    estrategia.mesesM40 &&
    estrategia.estrategia &&
    estrategia.umaElegida &&
    estrategia.inversionTotal &&
    estrategia.pensionMensual
  )
}

/**
 * Calcula el ROI de una estrategia
 */
export const calcularROI = (pensionMensual: number, inversionTotal: number): number => {
  const pensionAnual = pensionMensual * 12
  const roi = ((pensionAnual / inversionTotal) - 1) * 100
  return Math.round(roi * 10) / 10 // Redondear a 1 decimal
}
