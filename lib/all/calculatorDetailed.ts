import {
    calcularSDI,
    calcularCuotaMensual,
    porcentajeLey73,
    calcularSemanasM40,
    aplicarFactores
  } from "./utils"
  
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
  
  export function calcularEscenarioDetallado(params: Params) {
    const {
      mesesM40,
      estrategia,
      semanasPrevias,
      edad,
      dependiente,
      umaElegida,
      sdiHistorico,
      inicioM40
    } = params
  
    const mesesM40Limitado = Math.min(mesesM40, 58)
  
    const registros: {
      fecha: string
      uma: number
      sdiMensual: number
      tasaM40: number
      cuotaMensual: number
      acumulado: number
    }[] = []
  
    let totalInversion = 0
    let year = inicioM40.getFullYear()
    let month = inicioM40.getMonth() + 1
  
    for (let i = 0; i < mesesM40Limitado; i++) {
      const fecha = `${year}-${month.toString().padStart(2, "0")}-02`
      const uma = umaElegida
      // Usar la misma lógica que calcularEscenario para estrategia fijo
      const sdiMensual = estrategia === "fijo"
        ? calcularSDI(umaElegida, inicioM40.getFullYear()) // UMA fijo del año inicial
        : calcularSDI(umaElegida, year) // UMA actualizado cada año
      const cuotaMensual = calcularCuotaMensual(sdiMensual, year)
      const tasa = +(cuotaMensual / sdiMensual * 100).toFixed(3)
  
      totalInversion += cuotaMensual
  
             registros.push({
         fecha,
         uma,
         sdiMensual: Math.round(sdiMensual),
         tasaM40: tasa, // Cambiar 'tasa' por 'tasaM40' para que coincida con el componente
         cuotaMensual: Math.round(cuotaMensual),
         acumulado: Math.round(totalInversion)
       })
  
      month++
      if (month > 12) {
        month = 1
        year++
      }
    }
  
    const faltantes = Math.max(0, 58 - mesesM40Limitado)
    const sumaM40 = registros.reduce((a, b) => a + b.sdiMensual, 0)
    const sdiPromedio = faltantes > 0
      ? (sumaM40 + faltantes * (sdiHistorico * 30.4)) / 58
      : sumaM40 / 58
  
    const semanasM40 = calcularSemanasM40(mesesM40Limitado)
    const semanasTotales = semanasPrevias + semanasM40
  
    const añoJubilacion = inicioM40.getFullYear() + Math.ceil(mesesM40Limitado / 12)
    const porcentaje = porcentajeLey73(sdiPromedio, semanasTotales, añoJubilacion)
  
    const pensionBase = (porcentaje / 100) * sdiPromedio
    
    // Usar la misma función que calcularEscenario para mantener consistencia
    const pensionMensual = aplicarFactores(pensionBase, edad, dependiente)
    
    // Calcular los factores por separado para mostrar en el detalle
    const factorEdad = edad >= 60 ? (edad >= 65 ? 1 : 0.75 + 0.05 * (edad - 60)) : 1
    const conFactorEdad = pensionBase * factorEdad
    const conLeyFox = conFactorEdad * 1.11
    const conDependiente = conLeyFox * (1 + (dependiente === "conyuge" ? 0.15 : 0))
  
    const pensionConAguinaldo = pensionMensual * (13 / 12)
    const ROI = totalInversion > 0 ? +(pensionMensual * 12 * 20 / totalInversion).toFixed(2) : null
    const recuperacionMeses = totalInversion > 0 ? Math.round(totalInversion / pensionMensual) : null
  
    return {
      estrategia,
      umaElegida,
      mesesM40: mesesM40Limitado,
      inversionTotal: Math.round(totalInversion),
      pensionMensual: Math.round(pensionMensual),
      pensionConAguinaldo: Math.round(pensionConAguinaldo),
      ROI,
      recuperacionMeses,
      semanasTotales,
      sdiPromedio: Math.round(sdiPromedio),
      porcentajePension: +porcentaje.toFixed(2),
      conLeyFox: Math.round(conLeyFox),
      conDependiente: Math.round(conDependiente),
      factorEdad: +factorEdad.toFixed(2),
      conFactorEdad: Math.round(conFactorEdad),
      registros
    }
  }
  