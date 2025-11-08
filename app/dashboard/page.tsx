"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { FamilyMembersList } from "@/components/family/FamilyMembersList"
import { SavedStrategiesList } from "@/components/dashboard/SavedStrategiesList"
import { OrdersDashboard } from "@/components/dashboard/OrdersDashboard"


import { motion } from "framer-motion"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const hasRedirected = useRef(false)
  const lastStatusRef = useRef<string | null>(null)

  // Redirigir solo si definitivamente no hay sesión (después de que termine de cargar)
  // Usar un enfoque que solo verifique una vez cuando el status cambia de "loading" a "unauthenticated"
  useEffect(() => {
    // Solo verificar si el status cambió y NO es "loading"
    if (status === "loading") {
      lastStatusRef.current = status
      return
    }

    // Si el status no ha cambiado desde la última vez, no hacer nada
    if (lastStatusRef.current === status && hasRedirected.current) {
      return
    }

    // Solo redirigir si el status cambió a "unauthenticated" y no hemos redirigido ya
    if (status === "unauthenticated" && !hasRedirected.current) {
      hasRedirected.current = true
      lastStatusRef.current = status
      // Usar router.replace en lugar de window.location para evitar recargas completas
      router.replace("/")
      return
    }

    // Actualizar el último status solo si no es "loading"
    if (status !== "loading") {
      lastStatusRef.current = status
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]) // Solo ejecutar cuando status cambia

  // Mostrar loading mientras se carga la sesión
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

  // Si no hay sesión después de cargar, no renderizar nada (ya se redirigió)
  if (!session || status === "unauthenticated") {
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
          {/* Resumen de cuenta */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Resumen de tu cuenta
            </h2>
            <DashboardStats />
          </div>

          {/* Grid de dos columnas: Familiares y Estrategias */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sección de Familiares */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <FamilyMembersList />
            </motion.div>

            {/* Sección de Estrategias */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
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
              <SavedStrategiesList />
            </motion.div>
          </div>

          {/* Sección de Órdenes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl border border-gray-200"
            data-section="orders"
          >
            <OrdersDashboard />
          </motion.div>

          {/* Acciones Rápidas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-xl border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Acciones Rápidas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => router.push('/simulador')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="font-medium text-gray-900">Nueva Simulación</div>
                <div className="text-sm text-gray-600">Calcular estrategia de pensión</div>
              </button>
              <button 
                onClick={() => router.push('/simulador')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="font-medium text-gray-900">Agregar Familiar</div>
                <div className="text-sm text-gray-600">Registrar datos de familiar</div>
              </button>
              <button 
                onClick={() => {
                  const ordersSection = document.querySelector('[data-section="orders"]')
                  ordersSection?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="font-medium text-gray-900">Ver Historial</div>
                <div className="text-sm text-gray-600">Órdenes y compras</div>
              </button>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
