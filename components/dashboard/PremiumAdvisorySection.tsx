"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Crown, MessageSquare, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "react-hot-toast"
import { AdvisoryRequestForm } from "./advisory/AdvisoryRequestForm"
import { AdvisoryList } from "./advisory/AdvisoryList"
import { AdvisoryChatView } from "./advisory/AdvisoryChatView"

interface Advisory {
  id: string
  fullName: string
  status: string
  createdAt: string
  updatedAt: string
  unreadCount: number
  lastMessage: any
}

export function PremiumAdvisorySection() {
  const { data: session } = useSession()
  const [advisories, setAdvisories] = useState<Advisory[]>([])
  const [selectedAdvisoryId, setSelectedAdvisoryId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const isPremium = (session?.user as any)?.subscription === 'premium'

  useEffect(() => {
    if (isPremium) {
      loadAdvisories()
    } else {
      setIsLoading(false)
    }
  }, [isPremium])

  const loadAdvisories = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/premium-advisory')
      const data = await response.json()

      if (response.ok) {
        setAdvisories(data.advisories || [])
      } else {
        console.error('Error loading advisories:', data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar asesorías')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    loadAdvisories()
  }

  const handleSelectAdvisory = (id: string) => {
    setSelectedAdvisoryId(id)
    setShowForm(false)
  }

  const handleBack = () => {
    setSelectedAdvisoryId(null)
    loadAdvisories()
  }

  // Si no es Premium, mostrar mensaje de upgrade
  if (!isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200 p-8 text-center"
      >
        <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Asesorías Premium
        </h2>
        <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
          Esta función es exclusiva para usuarios <strong>Premium</strong>. 
          Actualiza tu plan para acceder a asesorías personalizadas con nuestros expertos en Modalidad 40.
        </p>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all inline-flex items-center gap-2"
        >
          <Crown className="w-5 h-5" />
          <span>Obtener Premium</span>
        </button>
      </motion.div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando asesorías...</p>
        </div>
      </div>
    )
  }

  // Si está viendo una asesoría específica
  if (selectedAdvisoryId) {
    return <AdvisoryChatView advisoryId={selectedAdvisoryId} onBack={handleBack} />
  }

  // Si está mostrando el formulario
  if (showForm) {
    return (
      <div>
        <button
          onClick={() => setShowForm(false)}
          className="mb-4 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Volver
        </button>
        <AdvisoryRequestForm onSuccess={handleFormSuccess} />
      </div>
    )
  }

  // Vista principal: lista de asesorías o estado vacío
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mis Asesorías</h2>
          <p className="text-gray-600 mt-1">
            Comunícate con nuestros expertos en Modalidad 40
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2"
        >
          <MessageSquare className="w-5 h-5" />
          <span>Nueva Asesoría</span>
        </button>
      </div>

      {advisories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-12 text-center"
        >
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No tienes asesorías activas
          </h3>
          <p className="text-gray-600 mb-6">
            Crea tu primera solicitud de asesoría para recibir ayuda personalizada de nuestros expertos
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all inline-flex items-center gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Crear Mi Primera Asesoría</span>
          </button>
        </motion.div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <AdvisoryList
            advisories={advisories}
            selectedId={selectedAdvisoryId}
            onSelect={handleSelectAdvisory}
          />
        </div>
      )}

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Tiempo de respuesta: 24 horas máximo</p>
            <p>
              Nuestros asesores responderán tu consulta en un máximo de 24 horas. 
              Recibirás una notificación por correo cuando haya una respuesta.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
