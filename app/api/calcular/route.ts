import { NextResponse } from "next/server"
import { parseInputs } from "@/lib/pensiones/parseInputs"
import { calcularEscenariosMultiples } from "@/lib/pensiones/calcularEscenariosMultiples"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // 1. Parsear inputs
    const parsed = parseInputs(body)

    // 2. Calcular escenarios múltiples
    const resultados = calcularEscenariosMultiples(parsed)

    // 3. Retornar como JSON
    return NextResponse.json(resultados)
  } catch (error: any) {
    console.error("❌ Error en cálculo:", error)
    return NextResponse.json(
      { error: "Error en cálculo", details: error.message },
      { status: 500 }
    )
  }
}




