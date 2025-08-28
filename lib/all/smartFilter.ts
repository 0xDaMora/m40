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
    const estrategiasLimpias = estrategias
      .filter(e => e.pensionMensual && e.inversionTotal && e.mesesM40)
      .filter(e => {
        if (e.pensionMensual < 3000) return false
        if (!e.ROI || e.ROI < 1.2) return false
        if (e.mesesM40 < 1 || e.mesesM40 > 58) return false
        return true
      })
  
    const estrategiasPorUMA = estrategiasLimpias.filter(e => {
      switch (preferencias.nivelUMA) {
        case "conservador":
          return e.umaElegida >= 1 && e.umaElegida <= 10
        case "equilibrado":
          return e.umaElegida >= 10 && e.umaElegida <= 18
        case "maximo":
          return e.umaElegida >= 18 && e.umaElegida <= 25
        default:
          return true
      }
    })
  
    const estrategiasDiversas = estrategiasPorUMA.filter(e => {
      return e.mesesM40 >= 12 && e.mesesM40 <= 60
    })
  
    const estrategiasConPuntaje = estrategiasDiversas.map(e => {
      let puntaje = 0
      const diferenciaPension = Math.abs(e.pensionMensual - preferencias.pensionObjetivo)
      const porcentajeCercania = Math.max(0, 1 - (diferenciaPension / preferencias.pensionObjetivo))
      puntaje += porcentajeCercania * 1000
      puntaje += (e.ROI || 0) * 50
      if (e.recuperacionMeses && e.recuperacionMeses > 0) {
        puntaje += (120 / e.recuperacionMeses) * 20
      }
  
      const factorSDI = preferencias.sdiHistorico || 100
      if (factorSDI < 200) {
        puntaje += Math.max(0, (60 - e.mesesM40) * -5)
      } else if (factorSDI > 500) {
        puntaje += Math.max(0, (48 - e.mesesM40) * 3)
      }
  
      if (e.pensionMensual < preferencias.pensionObjetivo * 0.7) {
        puntaje -= 200
      }
  
      const inversionMensual = e.inversionTotal / e.mesesM40
  
      return {
        ...e,
        puntaje,
        inversionMensualPromedio: Math.round(inversionMensual),
        diferenciaPensionObjetivo: Math.round(diferenciaPension),
        porcentajeCumplimiento: Math.round((e.pensionMensual / preferencias.pensionObjetivo) * 100)
      }
    })
  
    estrategiasConPuntaje.sort((a, b) => b.puntaje - a.puntaje)
  
    const top5: any[] = []
    const usedCombinations = new Set<string>()
  
    const topeMaximo = estrategiasLimpias
      .filter(e => e.umaElegida === 25)
      .sort((a, b) => b.pensionMensual - a.pensionMensual)[0]
  
    if (topeMaximo) {
      top5.push({
        ...topeMaximo,
        ranking: 1,
        categoria: "Tope Máximo",
        debugCode: `DEBUG_${topeMaximo.mesesM40}_${topeMaximo.estrategia}_${topeMaximo.umaElegida}_${preferencias.edadJubilacion}_${preferencias.dependiente}_${preferencias.sdiHistorico}_${preferencias.semanasPrevias}_${preferencias.inicioM40}`,
        esTope: true,
        puntaje: 999999,
        inversionMensualPromedio: Math.round(topeMaximo.inversionTotal / topeMaximo.mesesM40),
        diferenciaPensionObjetivo: Math.abs(topeMaximo.pensionMensual - preferencias.pensionObjetivo),
        porcentajeCumplimiento: Math.round((topeMaximo.pensionMensual / preferencias.pensionObjetivo) * 100)
      })
    }
  
    for (const estrategia of estrategiasConPuntaje) {
      if (top5.length >= 5) break
  
      const tiempoGrupo = estrategia.mesesM40 <= 24 ? "corto" : estrategia.mesesM40 <= 48 ? "medio" : "largo"
      const umaGrupo = estrategia.umaElegida <= 8 ? "bajo" : estrategia.umaElegida <= 18 ? "medio" : "alto"
      const key = `${estrategia.estrategia}-${tiempoGrupo}-${umaGrupo}`
  
      if (!usedCombinations.has(key)) {
        usedCombinations.add(key)
        top5.push({
          ...estrategia,
          ranking: top5.length + 1,
          categoria: "Recomendada",
          debugCode: `DEBUG_${estrategia.mesesM40}_${estrategia.estrategia}_${estrategia.umaElegida}_${preferencias.edadJubilacion}_${preferencias.dependiente}_${preferencias.sdiHistorico}_${preferencias.semanasPrevias}_${preferencias.inicioM40}`
        })
      }
    }
  
    return top5
  }
  
  export function procesarRespuestasUsuario(respuestas: any): FiltroPreferenciasNuevo {
    const raw = respuestas["Pension Objetivo"] || "buena:15000"
  
    let pensionObjetivo = 15000
  
    try {
      if (typeof raw === "string") {
        const partes = raw.split(":")
        if (partes.length === 2 && !isNaN(Number(partes[1]))) {
          pensionObjetivo = parseInt(partes[1])
        } else if (!isNaN(Number(raw))) {
          pensionObjetivo = parseInt(raw)
        }
      } else if (typeof raw === "number") {
        pensionObjetivo = raw
      }
    } catch (err) {
      console.warn("⚠️ Error al parsear Pension Objetivo:", err)
    }
  
    return {
      pensionObjetivo,
      nivelUMA: respuestas["Nivel UMA"] || "equilibrado",
      sdiHistorico: Number(respuestas["sdi"]) || 100
    }
  }
  