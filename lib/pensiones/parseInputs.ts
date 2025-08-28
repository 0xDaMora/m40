import { Dependiente } from "./calcular"

export function parseInputs(data: any) {
  const hoy = new Date()
  const nacimiento = new Date(data["Nacimiento"])

  // Edad actual
  let edadActual = hoy.getFullYear() - nacimiento.getFullYear()
  const m = hoy.getMonth() - nacimiento.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edadActual--
  }

  // Edad deseada
  const edadJubilacion = parseInt(data["Edad de Jubilacion"], 10)

  // 🔹 Convertir estado civil a tipo Dependiente
  const dependiente: Dependiente =
    data["Estado Civil"] === "conyuge" ? "conyuge" : "ninguno"

  // === ESCENARIO CONSERVADOR ===
  // Fecha inicio M40 = cumpleaños 55 + 1 mes
  const fechaInicio55 = new Date(nacimiento)
  fechaInicio55.setFullYear(nacimiento.getFullYear() + 55)
  fechaInicio55.setMonth(fechaInicio55.getMonth() + 1)

  const fechaInicioStr55 = `${fechaInicio55.getFullYear()}-${String(
    fechaInicio55.getMonth() + 1
  ).padStart(2, "0")}`

  const escenarioConservador = {
    edadInicio: 55,
    edadJubilacion,
    semanasPrevias: parseInt(data["Semanas"], 10),
    sdi: parseFloat(data["sdi"]),
    dependiente, // ✅ ya es tipo Dependiente
    fechaInicio: fechaInicioStr55,
    mesesM40: 58,
    estrategia: "fijo" as const,
    umaBase: 25,
    modo: "conservador" as const,
  }

  // === ESCENARIO FLEXIBLE (solo válido si ya tiene 54 a 59 años) ===
  let escenarioFlexible = null
  if (edadActual >= 54 && edadActual < 60) {
    const fechaInicioHoy = new Date(hoy)
    fechaInicioHoy.setMonth(fechaInicioHoy.getMonth() + 1)

    const fechaInicioStrHoy = `${fechaInicioHoy.getFullYear()}-${String(
      fechaInicioHoy.getMonth() + 1
    ).padStart(2, "0")}`

    escenarioFlexible = {
      edadInicio: edadActual,
      edadJubilacion,
      semanasPrevias: parseInt(data["Semanas"], 10),
      sdi: parseFloat(data["sdi"]),
      dependiente, // ✅ mismo fix
      fechaInicio: fechaInicioStrHoy,
      mesesM40: 58,
      estrategia: "fijo" as const,
      umaBase: 25,
      modo: "flexible" as const,
    }
  }

  return { conservador: escenarioConservador, flexible: escenarioFlexible }
}

  
  
  