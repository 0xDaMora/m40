"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { FamilyMembersList } from "@/components/family/FamilyMembersList"
import { FamilySimulatorIntegration } from "@/components/integration/FamilySimulatorIntegration"

import { motion } from "framer-motion"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Resumen de tu cuenta
            </h2>
            <DashboardStats />
          </div>

          {/* Componente de Integración Familiar-Simulador */}
          <motion.div
            id="simulator-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <FamilySimulatorIntegration />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Sección de Familiares */}
             <motion.div
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="bg-white p-6 rounded-xl border border-gray-200"
             >
               <FamilyMembersList />
             </motion.div>

            {/* Sección de Estrategias */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Estrategias Guardadas
                </h3>
                <button 
                  onClick={() => router.push('/mis-estrategias')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Ver todas →
                </button>
              </div>
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">
                  Gestiona y comparte tus estrategias
                </p>
                <div className="space-y-2">
                  <button 
                    onClick={() => router.push('/mis-estrategias')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-2"
                  >
                    Mis Estrategias
                  </button>
                  <button 
                    onClick={() => document.getElementById('simulator-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Nueva Simulación
                  </button>
                </div>
              </div>
            </motion.div>
          </div>



          {/* Acciones Rápidas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Acciones Rápidas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="font-medium text-gray-900">Nueva Simulación</div>
                <div className="text-sm text-gray-600">Calcular estrategia de pensión</div>
              </button>
                             <button 
                 onClick={() => window.location.reload()}
                 className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
               >
                 <div className="font-medium text-gray-900">Agregar Familiar</div>
                 <div className="text-sm text-gray-600">Registrar datos de familiar</div>
               </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <div className="font-medium text-gray-900">Ver Historial</div>
                <div className="text-sm text-gray-600">Simulaciones anteriores</div>
              </button>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
