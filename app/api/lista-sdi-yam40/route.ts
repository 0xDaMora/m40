import { NextRequest, NextResponse } from "next/server"
import { ListaSDIyam40, ListaSDIyam40Params } from "@/lib/yam40/listaSDIyam40"
import { getMaxAportacionPorAño } from "@/lib/all/umaConverter"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('📥 ====== API LISTA SDI YAM40 - REQUEST RECIBIDO ======')
    console.log('📥 Body completo:', JSON.stringify(body, null, 2))
    
    const {
      fechaInicioM40,
      fechaFinM40,
      tipoEstrategia,
      valorInicial
    }: ListaSDIyam40Params = body

    // Validaciones
    if (!fechaInicioM40 || !fechaFinM40 || !tipoEstrategia || valorInicial === undefined) {
      console.error('❌ ERROR: Datos requeridos incompletos')
      return NextResponse.json(
        { error: "Datos requeridos incompletos" },
        { status: 400 }
      )
    }

    if (valorInicial <= 0) {
      return NextResponse.json(
        { error: "El valor inicial debe ser mayor a 0" },
        { status: 400 }
      )
    }

    if (tipoEstrategia === 'progresiva' && (valorInicial < 1 || valorInicial > 25)) {
      return NextResponse.json(
        { error: "El número de UMA debe estar entre 1 y 25" },
        { status: 400 }
      )
    }

    // Validar límite 25 UMA para estrategia fija
    if (tipoEstrategia === 'fija') {
      const maxAportacion = getMaxAportacionPorAño(fechaInicioM40.año)
      if (valorInicial > maxAportacion) {
        return NextResponse.json(
          { 
            error: `La aportación excede el límite de 25 UMA para ${fechaInicioM40.año}. Máximo permitido: $${maxAportacion.toLocaleString()}`,
            maxAportacion
          },
          { status: 400 }
        )
      }
    }

    // Calcular lista de SDI
    const listaSDI = ListaSDIyam40({
      fechaInicioM40,
      fechaFinM40,
      tipoEstrategia,
      valorInicial
    })

    // Calcular totales para respuesta
    const totalAportacion = listaSDI.reduce((sum, item) => sum + item.aportacionMensual, 0)
    const promedioSDIMensual = listaSDI.reduce((sum, item) => sum + item.sdiMensual, 0) / listaSDI.length
    const promedioSDIDiario = listaSDI.reduce((sum, item) => sum + item.sdiDiario, 0) / listaSDI.length

    console.log('📤 ====== API LISTA SDI YAM40 - RESPUESTA ======')
    console.log('📤 Total meses:', listaSDI.length)
    console.log('📤 Total aportación:', totalAportacion)
    console.log('📤 Promedio SDI mensual:', promedioSDIMensual)
    console.log('📤 Promedio SDI diario:', promedioSDIDiario)

    return NextResponse.json({
      success: true,
      listaSDI,
      resumen: {
        totalMeses: listaSDI.length,
        totalAportacion: Math.round(totalAportacion * 100) / 100,
        promedioSDIMensual: Math.round(promedioSDIMensual * 100) / 100,
        promedioSDIDiario: Math.round(promedioSDIDiario * 100) / 100
      }
    })

  } catch (error: any) {
    console.error("❌ Error al calcular lista SDI yam40:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}

