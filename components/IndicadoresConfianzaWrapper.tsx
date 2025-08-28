"use client"

import { useSimulator } from "./SimulatorContext"
import IndicadoresConfianza from "./IndicadoresConfianza"

export default function IndicadoresConfianzaWrapper() {
  const { isSimulatorActive } = useSimulator()

  // No mostrar cuando el simulador esté activo
  if (isSimulatorActive) {
    return null
  }

  return (
    <div className="absolute top-4 right-4 z-10 hidden lg:block">
      <IndicadoresConfianza />
    </div>
  )
}
