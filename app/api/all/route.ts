import { NextResponse } from "next/server"
import { allStrats } from "@/lib/all/allStrats"
import { filtrarMejoresEstrategias, procesarRespuestasUsuario } from "@/lib/all/smartFilter"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      "Nacimiento": fechaNacimiento,
      "Edad de Jubilacion": edadJubilacion,
      "Semanas": semanasPrevias,
      "sdi": sdiHistorico,
      "Estado Civil": estadoCivil,
      "Pension Objetivo": pensionObjetivo,
      "Ritmo Pago": ritmoPago,
      "Nivel UMA": nivelUMA,
    } = body

    const dependiente =
      estadoCivil === "Casado(a)" || estadoCivil === "conyuge" ? "conyuge" : "ninguno"

    const sdiParsed = Number(sdiHistorico)
    const sdiSeguro = isNaN(sdiParsed) ? 100 : sdiParsed / 30.4

    const edadJubiNum = Number(edadJubilacion) || 60
    const semanasNum = Number(semanasPrevias) || 500

    const resultadoCompleto = allStrats({
      fechaNacimiento: String(fechaNacimiento),
      edadJubilacion: edadJubiNum,
      semanasPrevias: semanasNum,
      dependiente: dependiente as "conyuge" | "ninguno",
      umaMin: 1,
      umaMax: 25,
      sdiHistorico: sdiSeguro,
    })

    if (pensionObjetivo && nivelUMA) {
      const preferencias = {
        ...procesarRespuestasUsuario(body),
        inicioM40: resultadoCompleto.metadatos?.inicioM40 || "2026-02-01",
        edadJubilacion: edadJubiNum,
        semanasPrevias: semanasNum,
        dependiente
      }

      // Filtrar resultados válidos (sin errores)
      const resultadosValidos = (resultadoCompleto.resultados || []).filter(
        (resultado: any) => resultado.pensionMensual !== null && resultado.error === undefined
      )
      
      const mejoresEstrategias = filtrarMejoresEstrategias(resultadosValidos, preferencias)

      return NextResponse.json({
        escenarios: mejoresEstrategias,
        metadatos: {
          ...resultadoCompleto.metadatos,
          totalCalculadas: resultadoCompleto.resultados?.length || 0,
          filtroAplicado: true,
          preferencias,
        },
      })
    }

    return NextResponse.json({
      escenarios: resultadoCompleto.resultados,
      metadatos: resultadoCompleto.metadatos,
    })
  } catch (error: any) {
    console.error("❌ Error completo:", error)
    return NextResponse.json(
      {
        error: error?.message || "Unknown error",
        stack: error?.stack || "No stack available",
      },
      { status: 500 }
    )
  }
}
