"use client"

import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'OAuthCallback':
        return 'Error en la autenticación con Google. Por favor, intenta de nuevo.'
      case 'Configuration':
        return 'Error de configuración. Contacta al administrador.'
      case 'AccessDenied':
        return 'Acceso denegado. No se pudo completar la autenticación.'
      default:
        return 'Ocurrió un error durante la autenticación. Por favor, intenta de nuevo.'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl max-w-md w-full p-6 shadow-lg"
      >
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Error de Autenticación
          </h1>
          
          <p className="text-gray-600 mb-6">
            {getErrorMessage(error)}
          </p>

          <div className="space-y-3">
            <Link href="/">
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio
              </button>
            </Link>
            
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
