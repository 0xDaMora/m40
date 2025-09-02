import { FamilySimulatorIntegration } from "@/components/integration/FamilySimulatorIntegration"
import { Navbar } from "@/components/layout/Navbar"
import { Suspense } from "react"

export default function SimuladorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Simulador Modalidad 40
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Calcula las mejores estrategias de ahorro para tu jubilación. 
            Compara diferentes escenarios y encuentra la opción que mejor se adapte a tus necesidades.
          </p>
        </div>
        
        <Suspense fallback={<div className="text-center py-8">Cargando simulador...</div>}>
          <FamilySimulatorIntegration />
        </Suspense>
      </div>
    </div>
  )
}
