import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import HeroOnboard from "@/components/HeroOnboard"
import CasosDeExito from "@/components/CasosDeExito"
import ExplicacionModalidad40 from "@/components/ExplicacionModalidad40"
import IndicadoresConfianzaWrapper from "@/components/IndicadoresConfianzaWrapper"
import { SimulatorProvider } from "@/components/SimulatorContext"

export default function LandingPage() {
  return (
    <SimulatorProvider>
      <main className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50">
        <Navbar />
        
        <div className="flex-1">
          {/* Hero Section con explicación integrada */}
          <section className="relative">
            <HeroOnboard />
            
            {/* Indicadores de confianza flotantes */}
            <IndicadoresConfianzaWrapper />
          </section>

          {/* Sección de explicación prominente */}
          <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
            {/* Elementos decorativos */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            </div>
            
            <div className="relative z-10 max-w-7xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  ¿Qué es Modalidad 40?
                </h2>
                <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                  El mecanismo oficial del IMSS que puede aumentar tu pensión hasta 300%
                </p>
              </div>
              
              <ExplicacionModalidad40 />
            </div>
          </section>

          {/* Casos de éxito */}
          <section className="py-16 bg-white">
            <CasosDeExito />
          </section>
        </div>
        
        <Footer />
      </main>
    </SimulatorProvider>
  )
}


