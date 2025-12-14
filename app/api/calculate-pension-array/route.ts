import { NextRequest, NextResponse } from "next/server"
import { porcentajeLey73, aplicarFactores } from "@/lib/all/utils"

/**
 * Endpoint para calcular pensión usando array completo de 250 semanas
 * Este endpoint es exclusivo para yam40 y recibe el array completo de SDI
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      array250Semanas,
      semanasPrevias,
      edadJubilacion,
      dependiente,
      fechaNacimiento
    }: {
      array250Semanas: number[] // Array de 250 semanas con SDI diario
      semanasPrevias: number // Semanas antes de M40
      edadJubilacion: number
      dependiente: 'soltero' | 'casado'
      fechaNacimiento: string | Date
    } = body

    // Validaciones
    if (!array250Semanas || !Array.isArray(array250Semanas)) {
      return NextResponse.json(
        { error: "array250Semanas debe ser un array de 250 elementos" },
        { status: 400 }
      )
    }

    if (array250Semanas.length !== 250) {
      return NextResponse.json(
        { error: `array250Semanas debe tener exactamente 250 elementos, recibido: ${array250Semanas.length}` },
        { status: 400 }
      )
    }

    if (semanasPrevias < 0) {
      return NextResponse.json(
        { error: "semanasPrevias debe ser mayor o igual a 0" },
        { status: 400 }
      )
    }

    if (edadJubilacion < 60 || edadJubilacion > 65) {
      return NextResponse.json(
        { error: "edadJubilacion debe estar entre 60 y 65 años" },
        { status: 400 }
      )
    }

    // Calcular promedio SDI desde array de 250 semanas
    const sumaSDI = array250Semanas.reduce((acc, sdi) => acc + sdi, 0)
    const sdiPromedio = sumaSDI / 250

    // Calcular semanas totales
    // El array de 250 semanas representa las últimas 250 semanas antes de la jubilación
    // Las semanas previas son las semanas ANTES de estas 250 semanas
    // Las semanas totales = semanas previas + 250 semanas del array
    const semanasTotales = semanasPrevias + 250

    // Validar semanas mínimas para pensión
    if (semanasTotales < 500) {
      return NextResponse.json({
        success: false,
        error: "Insuficientes semanas cotizadas (mínimo 500)",
        semanasTotales,
        semanasPrevias,
        semanasM40
      }, { status: 400 })
    }

    // Calcular año de jubilación
    const fechaNac = fechaNacimiento instanceof Date 
      ? fechaNacimiento 
      : new Date(fechaNacimiento)
    const añoActual = new Date().getFullYear()
    const añoJubilacion = añoActual + (edadJubilacion - calcularEdad(fechaNac))

    // Calcular porcentaje según Ley 73
    const porcentaje = porcentajeLey73(sdiPromedio, semanasTotales, añoJubilacion)
    let pensionMensual = (porcentaje / 100) * sdiPromedio

    // Aplicar factores (edad, Fox, dependientes)
    pensionMensual = aplicarFactores(
      pensionMensual,
      edadJubilacion,
      dependiente === 'casado' ? 'conyuge' : 'ninguno'
    )

    // Validar que la pensión sea válida
    if (!pensionMensual || isNaN(pensionMensual) || pensionMensual <= 0) {
      return NextResponse.json({
        success: false,
        error: "Error en cálculo de pensión",
        debug: {
          sdiPromedio,
          porcentaje,
          semanasTotales,
          edadJubilacion,
          dependiente
        }
      }, { status: 400 })
    }

    // Calcular pensión con aguinaldo
    const pensionConAguinaldo = pensionMensual * 13 / 12

    return NextResponse.json({
      success: true,
      pensionMensual: Math.round(pensionMensual),
      pensionConAguinaldo: Math.round(pensionConAguinaldo),
      sdiPromedio: Math.round(sdiPromedio),
      porcentajePension: +porcentaje.toFixed(2),
      semanasTotales,
      semanasPrevias,
      edadJubilacion,
      dependiente,
      debug: {
        array250Semanas: {
          length: array250Semanas.length,
          min: Math.min(...array250Semanas),
          max: Math.max(...array250Semanas),
          promedio: sdiPromedio
        },
        calculo: {
          sumaSDI,
          sdiPromedio,
          porcentaje,
          pensionBase: (porcentaje / 100) * sdiPromedio,
          pensionFinal: pensionMensual
        }
      }
    })

  } catch (error: any) {
    console.error("Error al calcular pensión con array:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// Función auxiliar para calcular edad
function calcularEdad(fechaNacimiento: Date): number {
  const today = new Date()
  let edad = today.getFullYear() - fechaNacimiento.getFullYear()
  const monthDiff = today.getMonth() - fechaNacimiento.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < fechaNacimiento.getDate())) {
    edad--
  }
  return edad
}

