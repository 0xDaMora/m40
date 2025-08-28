import { NextResponse } from "next/server"
import { calcularEscenarioDetallado } from "@/lib/all/calculatorDetailed"

export async function POST(req: Request) {
  try {
    const { debugCode, estrategia, uma, premium, datosUsuario } = await req.json()

    // Manejar códigos de compra e integración
    if (debugCode?.startsWith("compra_") || debugCode?.startsWith("integration_")) {
      // Para códigos de compra e integración, usar los parámetros proporcionados
      if (premium) {
                 // Plan premium - usar datos reales del usuario
        const params = {
          mesesM40: parseInt(datosUsuario?.meses) || 36,
          estrategia: "fijo" as "fijo" | "progresivo",
          umaElegida: 15,
          edad: parseInt(datosUsuario?.edad) || 58,
          dependiente: (datosUsuario?.dependiente as "conyuge" | "ninguno") || "conyuge",
          sdiHistorico: parseFloat(datosUsuario?.sdi) || 150,
          semanasPrevias: parseInt(datosUsuario?.semanas) || 500,
          inicioM40: datosUsuario?.startMonth && datosUsuario?.startYear 
            ? new Date(datosUsuario.startYear, datosUsuario.startMonth - 1, 1)
            : new Date(datosUsuario?.fecha || "2024-02-01")
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
            recuperacionMeses: resultado.recuperacionMeses,
            factorEdad: resultado.factorEdad,
            conFactorEdad: resultado.conFactorEdad,
            conLeyFox: resultado.conLeyFox,
            conDependiente: resultado.conDependiente,
            registros: resultado.registros || []
          },
          datosUsuario: {
            inicioM40: datosUsuario?.startMonth && datosUsuario?.startYear 
              ? new Date(datosUsuario.startYear, datosUsuario.startMonth - 1, 1).toISOString().split('T')[0]
              : datosUsuario?.fecha || "2024-02-01",
            edad: parseInt(datosUsuario?.edad) || 58,
            dependiente: datosUsuario?.dependiente || "conyuge",
            sdiHistorico: parseFloat(datosUsuario?.sdi) || 150,
            semanasPrevias: parseInt(datosUsuario?.semanas) || 500,
            familyMemberId: datosUsuario?.familyMemberId || null
          },
          debugCode,
          premium: true
        })
      } else {
        // Plan básico - usar estrategia específica con datos reales del usuario
        const params = {
          mesesM40: parseInt(datosUsuario?.meses) || 36,
          estrategia: estrategia as "fijo" | "progresivo" || "fijo",
          umaElegida: parseInt(uma) || 15,
          edad: parseInt(datosUsuario?.edad) || 58,
          dependiente: (datosUsuario?.dependiente as "conyuge" | "ninguno") || "conyuge",
          sdiHistorico: parseFloat(datosUsuario?.sdi) || 150,
          semanasPrevias: parseInt(datosUsuario?.semanas) || 500,
          inicioM40: datosUsuario?.startMonth && datosUsuario?.startYear 
            ? new Date(datosUsuario.startYear, datosUsuario.startMonth - 1, 1)
            : new Date(datosUsuario?.fecha || "2024-02-01")
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
            recuperacionMeses: resultado.recuperacionMeses,
            factorEdad: resultado.factorEdad,
            conFactorEdad: resultado.conFactorEdad,
            conLeyFox: resultado.conLeyFox,
            conDependiente: resultado.conDependiente,
            registros: resultado.registros || []
          },
          datosUsuario: {
            inicioM40: datosUsuario?.startMonth && datosUsuario?.startYear 
              ? new Date(datosUsuario.startYear, datosUsuario.startMonth - 1, 1).toISOString().split('T')[0]
              : datosUsuario?.fecha || "2024-02-01",
            edad: parseInt(datosUsuario?.edad) || 58,
            dependiente: datosUsuario?.dependiente || "conyuge",
            sdiHistorico: parseFloat(datosUsuario?.sdi) || 150,
            semanasPrevias: parseInt(datosUsuario?.semanas) || 500,
            familyMemberId: datosUsuario?.familyMemberId || null
          },
          debugCode,
          premium: false
        })
      }
    }

    // Códigos DEBUG normales
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

    // Datos del usuario para la interfaz
    const datosUsuarioResult = {
      inicioM40: fechaStr,
      edad: parseInt(edadStr),
      dependiente: dependienteStr,
      sdiHistorico: parseFloat(sdiStr),
      semanasPrevias: parseInt(semanasStr)
    }

    return NextResponse.json({
      estrategia: {
        mesesM40: resultado.mesesM40,
        estrategia: resultado.estrategia,
        umaElegida: resultado.umaElegida,
        inversionTotal: resultado.inversionTotal,
        pensionMensual: resultado.pensionMensual,
        pensionConAguinaldo: resultado.pensionConAguinaldo,
        ROI: resultado.ROI,
        recuperacionMeses: resultado.recuperacionMeses,
        // Datos adicionales para el desglose
        factorEdad: resultado.factorEdad,
        conFactorEdad: resultado.conFactorEdad,
        conLeyFox: resultado.conLeyFox,
        conDependiente: resultado.conDependiente,
        // Registros mensuales
        registros: resultado.registros || []
      },
      datosUsuario: datosUsuarioResult,
      debugCode
    })
  } catch (error: any) {
    console.error("❌ Error en /api/debug-estrategia-detallada:", error)
    return NextResponse.json(
      {
        error: error?.message || "Error desconocido",
        stack: error?.stack || "Sin stack"
      },
      { status: 500 }
    )
  }
}
