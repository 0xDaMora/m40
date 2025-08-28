import { NextResponse } from "next/server"
import { calcularEscenarioDetallado } from "@/lib/all/calculatorDetailed"

export async function POST(req: Request) {
  try {
    const { debugCode } = await req.json()

    if (!debugCode?.startsWith("DEBUG_")) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 })
    }

    const partes = debugCode.replace("DEBUG_", "").split("_")

    if (partes.length !== 8) {
      return NextResponse.json({ error: "Formato incorrecto del código" }, { status: 400 })
    }

    const [
      mesesStr,
      estrategiaStr,
      umaStr,
      edadStr,
      dependienteStr,
      sdiStr,
      semanasStr,
      fechaStr
    ] = partes

    const params = {
      mesesM40: parseInt(mesesStr),
      estrategia: estrategiaStr as "fijo" | "progresivo",
      umaElegida: parseInt(umaStr),
      edad: parseInt(edadStr),
      dependiente: dependienteStr as "conyuge" | "ninguno",
      sdiHistorico: parseFloat(sdiStr),
      semanasPrevias: parseInt(semanasStr),
      inicioM40: new Date(fechaStr)
    }

    const resultado = calcularEscenarioDetallado(params)

    return NextResponse.json({
      estrategia: {
        mesesM40: resultado.mesesM40,
        estrategia: resultado.estrategia,
        umaElegida: resultado.umaElegida,
        inversionTotal: resultado.inversionTotal,
        pensionMensual: resultado.pensionMensual,
        pensionConAguinaldo: resultado.pensionConAguinaldo,
        ROI: resultado.ROI,
        recuperacionMeses: resultado.recuperacionMeses
      },
      detallesMensuales: resultado.registros || [],
      calculosFinales: {
        sdiPromedio: resultado.sdiPromedio,
        semanasTotales: resultado.semanasTotales,
        porcentajePension: resultado.porcentajePension,
        pensionBase: resultado.conFactorEdad,
        conFactorEdad: resultado.conFactorEdad,
        conLeyFox: resultado.conLeyFox,
        conDependiente: resultado.conDependiente,
        pensionFinal: resultado.conDependiente,
        pensionConAguinaldo: resultado.pensionConAguinaldo,
        ROI: resultado.ROI,
        factorEdad: resultado.factorEdad,
        recuperacionMeses: resultado.recuperacionMeses
      }
    })
  } catch (error: any) {
    console.error("❌ Error en /api/debug-estrategia:", error)
    return NextResponse.json(
      {
        error: error?.message || "Error desconocido",
        stack: error?.stack || "Sin stack"
      },
      { status: 500 }
    )
  }
}
