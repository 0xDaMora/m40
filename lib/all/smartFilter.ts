interface EstrategiaCalculada {
    mesesM40: number
    estrategia: "fijo" | "progresivo"
    umaElegida: number
    inversionTotal: number
    pensionMensual: number
    pensionConAguinaldo: number
    ROI: number
    recuperacionMeses: number
    semanasTotales?: number
    sdiPromedio?: number
    porcentajePension?: number
  }
  
  interface FiltroPreferenciasNuevo {
    pensionObjetivo: number
    nivelUMA: "conservador" | "equilibrado" | "maximo"
    sdiHistorico?: number
    inicioM40?: string
    edadJubilacion?: number
    semanasPrevias?: number
    dependiente?: "conyuge" | "ninguno"
  }
  
  export function filtrarMejoresEstrategias(
    estrategias: EstrategiaCalculada[],
    preferencias: FiltroPreferenciasNuevo
  ): EstrategiaCalculada[] {
    console.log("🔍 Total estrategias recibidas:", estrategias.length)
    
    // 1. Filtrar estrategias válidas básicas
    const estrategiasValidas = estrategias.filter(e => {
      if (!e.pensionMensual || !e.inversionTotal || !e.mesesM40) return false
      if (e.pensionMensual < 1000) return false // Mínimo muy bajo
      if (e.mesesM40 < 1 || e.mesesM40 > 58) return false
      if (!e.ROI || e.ROI < 0.5) return false // ROI muy bajo
      return true
    })
    
    console.log("🔍 Estrategias válidas:", estrategiasValidas.length)
    
    // 2. Ordenar TODAS las estrategias por pensión mensual (de mayor a menor)
    const estrategiasOrdenadas = estrategiasValidas.sort((a, b) => b.pensionMensual - a.pensionMensual)
    
    console.log("🔍 Mejores pensiones encontradas:", estrategiasOrdenadas.slice(0, 3).map(e => ({
      pension: e.pensionMensual,
      meses: e.mesesM40,
      uma: e.umaElegida,
      roi: e.ROI
    })))
    
    // 3. Tomar las 10 mejores por pensión
    const top10PorPension = estrategiasOrdenadas.slice(0, 10)
    
    // 4. Filtrar por preferencias de UMA (pero ser más flexible)
    const estrategiasFiltradas = top10PorPension.filter(e => {
      switch (preferencias.nivelUMA) {
        case "conservador":
          return e.umaElegida >= 1 && e.umaElegida <= 15 // Más amplio
        case "equilibrado":
          return e.umaElegida >= 5 && e.umaElegida <= 22 // Más amplio
        case "maximo":
          return e.umaElegida >= 10 && e.umaElegida <= 25 // Más amplio
        default:
          return true
      }
    })
    
    console.log("🔍 Estrategias filtradas por UMA:", estrategiasFiltradas.length)
    
    // 5. Si no hay suficientes estrategias filtradas, tomar de las mejores sin filtrar
    let estrategiasFinales = estrategiasFiltradas
    if (estrategiasFiltradas.length < 5) {
      console.log("⚠️ Pocas estrategias filtradas, agregando más...")
      const estrategiasAdicionales = top10PorPension.filter(e => !estrategiasFiltradas.includes(e))
      estrategiasFinales = [...estrategiasFiltradas, ...estrategiasAdicionales].slice(0, 10)
    }
    
    // 5.1 Si aún no hay suficientes, tomar directamente de las mejores por pensión
    if (estrategiasFinales.length < 5) {
      console.log("⚠️ Aún pocas estrategias, tomando las mejores por pensión...")
      estrategiasFinales = top10PorPension.slice(0, 10)
    }
    
    // 6. Calcular puntuación para diversidad
    const estrategiasConPuntaje = estrategiasFinales.map(e => {
      let puntaje = 0
      
      // Pensión mensual (70% del puntaje)
      puntaje += e.pensionMensual * 0.7
      
      // ROI (20% del puntaje)
      puntaje += (e.ROI || 0) * 500
      
      // Duración óptima (10% del puntaje) - preferir 24-48 meses
      const duracionOptima = 36
      const duracionScore = Math.max(0, 100 - Math.abs(e.mesesM40 - duracionOptima))
      puntaje += duracionScore * 0.1
      
      const inversionMensual = e.inversionTotal / e.mesesM40
      
      return {
        ...e,
        puntaje: Math.round(puntaje),
        inversionMensualPromedio: Math.round(inversionMensual),
        diferenciaPensionObjetivo: Math.abs(e.pensionMensual - preferencias.pensionObjetivo),
        porcentajeCumplimiento: Math.round((e.pensionMensual / preferencias.pensionObjetivo) * 100)
      }
    })
    
    // 7. Ordenar por puntuación
    estrategiasConPuntaje.sort((a, b) => b.puntaje - a.puntaje)
    
    // 8. Tomar las 5 mejores y asegurar diversidad
    const top5 = []
    const usedCombinations = new Set()
    
    // Primera estrategia: SIEMPRE la mejor pensión
    if (estrategiasConPuntaje.length > 0) {
      const mejorPension = estrategiasConPuntaje[0]
      top5.push({
        ...mejorPension,
        ranking: 1,
        categoria: "Mejor Pensión",
        debugCode: `DEBUG_${mejorPension.mesesM40}_${mejorPension.estrategia}_${mejorPension.umaElegida}_${preferencias.edadJubilacion}_${preferencias.dependiente}_${preferencias.sdiHistorico}_${preferencias.semanasPrevias}_${preferencias.inicioM40}`,
        esTope: true
      })
      usedCombinations.add(`${mejorPension.estrategia}-${mejorPension.umaElegida}`)
    }
    
    // Resto de estrategias con diversidad
    for (const estrategia of estrategiasConPuntaje.slice(1)) {
      if (top5.length >= 5) break
      
      const key = `${estrategia.estrategia}-${estrategia.umaElegida}`
      if (!usedCombinations.has(key)) {
        usedCombinations.add(key)
        top5.push({
          ...estrategia,
          ranking: top5.length + 1,
          categoria: "Recomendada",
          debugCode: `DEBUG_${estrategia.mesesM40}_${estrategia.estrategia}_${estrategia.umaElegida}_${preferencias.edadJubilacion}_${preferencias.dependiente}_${preferencias.sdiHistorico}_${preferencias.semanasPrevias}_${preferencias.inicioM40}`,
          esTope: false
        })
      }
    }
    
    // Si no tenemos 5 estrategias, agregar más sin restricción de diversidad
    if (top5.length < 5) {
      console.log("⚠️ Agregando más estrategias para completar 5...")
      for (const estrategia of estrategiasConPuntaje.slice(top5.length)) {
        if (top5.length >= 5) break
        top5.push({
          ...estrategia,
          ranking: top5.length + 1,
          categoria: "Recomendada",
          debugCode: `DEBUG_${estrategia.mesesM40}_${estrategia.estrategia}_${estrategia.umaElegida}_${preferencias.edadJubilacion}_${preferencias.dependiente}_${preferencias.sdiHistorico}_${preferencias.semanasPrevias}_${preferencias.inicioM40}`,
          esTope: false
        })
      }
    }
    
    console.log("🎯 Top 5 estrategias finales:", top5.map(e => ({
      ranking: e.ranking,
      pension: e.pensionMensual,
      meses: e.mesesM40,
      uma: e.umaElegida,
      roi: e.ROI,
      categoria: e.categoria
    })))
    
    return top5
  }
  
  export function procesarRespuestasUsuario(respuestas: any): FiltroPreferenciasNuevo {
    console.log("📝 Procesando respuestas:", respuestas)
    
    const raw = respuestas["Pension Objetivo"] || "equilibrada"
    let pensionObjetivo = 15000
  
    try {
      if (typeof raw === "string") {
        const partes = raw.split(":")
        if (partes.length === 2 && !isNaN(Number(partes[1]))) {
          pensionObjetivo = parseInt(partes[1])
        } else if (!isNaN(Number(raw))) {
          pensionObjetivo = parseInt(raw)
        } else {
          // Mapear valores cualitativos a valores numéricos
          switch (raw) {
            case "basica":
            case "conservadora":
              pensionObjetivo = 12000
              break
            case "buena":
            case "equilibrada":
              pensionObjetivo = 18000
              break
            case "premium":
            case "agresiva":
            case "maxima":
              pensionObjetivo = 25000
              break
            default:
              pensionObjetivo = 15000
          }
        }
      } else if (typeof raw === "number") {
        pensionObjetivo = raw
      }
    } catch (err) {
      console.warn("⚠️ Error al parsear Pension Objetivo:", err)
    }
  
    // Asegurar que la pensión objetivo sea realista
    pensionObjetivo = Math.max(8000, Math.min(50000, pensionObjetivo))
    
    const nivelUMA = respuestas["Nivel UMA"] || "equilibrado"
    const sdiHistorico = Number(respuestas["sdi"]) || 100
    
    console.log("📊 Preferencias procesadas:", {
      pensionObjetivo,
      nivelUMA,
      sdiHistorico
    })
  
    return {
      pensionObjetivo,
      nivelUMA,
      sdiHistorico
    }
  }
  