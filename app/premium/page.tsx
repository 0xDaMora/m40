"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { Crown, Star, CheckCircle, TrendingUp, FileText, Users, Zap, Shield, ArrowRight, Calculator } from "lucide-react"
import { toast } from "react-hot-toast"
import Link from "next/link"

export default function PremiumPage() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const handlePremiumPurchase = () => {
    if (!session) {
      // Redirigir a login
      // Show login modal instead of redirecting to deleted page
      window.location.href = '/?login=true&callbackUrl=/premium'
      return
    }

    // Aquí iría la lógica de compra Premium
    setIsLoading(true)
    setTimeout(() => {
      toast.success('¡Plan Premium activado!')
      setIsLoading(false)
    }, 2000)
  }

  const benefits = [
    {
      icon: Calculator,
      title: "2,000+ Estrategias",
      description: "Todas las combinaciones posibles analizadas para tu perfil específico"
    },
    {
      icon: FileText,
      title: "PDFs Ilimitados",
      description: "Descarga todas las estrategias que quieras en formato PDF"
    },
    {
      icon: TrendingUp,
      title: "Análisis Completo",
      description: "Proyección detallada de 20 años con todos los factores"
    },
    {
      icon: Crown,
      title: "Acceso de por Vida",
      description: "Una sola compra, acceso ilimitado para siempre"
    },
    {
      icon: Users,
      title: "Familia Completa",
      description: "Gestiona hasta 10 familiares con estrategias personalizadas"
    },
    {
      icon: Zap,
      title: "Soporte Prioritario",
      description: "Atención especializada para usuarios Premium"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <Crown className="w-5 h-5" />
                Plan Premium
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Acceso Ilimitado a
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> Modalidad 40</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Desbloquea todas las estrategias posibles, PDFs ilimitados y análisis completo de tu pensión
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Beneficios */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl flex items-center justify-center mb-4">
                <benefit.icon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {benefit.title}
              </h3>
              <p className="text-gray-600">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Precio y CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden"
        >
          {/* Elementos decorativos */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Crown className="w-8 h-8" />
              <h2 className="text-3xl md:text-4xl font-bold">Plan Premium</h2>
            </div>
            
            <div className="mb-8">
              <div className="text-6xl md:text-7xl font-bold mb-2">$999</div>
              <div className="text-xl opacity-90">Pago único de por vida</div>
              <div className="text-sm opacity-75 mt-2">Sin suscripciones, sin renovaciones</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white bg-opacity-10 rounded-xl p-4">
                <div className="text-2xl font-bold">2,000+</div>
                <div className="text-sm opacity-90">Estrategias</div>
              </div>
              <div className="bg-white bg-opacity-10 rounded-xl p-4">
                <div className="text-2xl font-bold">∞</div>
                <div className="text-sm opacity-90">PDFs</div>
              </div>
              <div className="bg-white bg-opacity-10 rounded-xl p-4">
                <div className="text-2xl font-bold">20</div>
                <div className="text-sm opacity-90">Años análisis</div>
              </div>
            </div>

            <button
              onClick={handlePremiumPurchase}
              disabled={isLoading}
              className="bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  {session ? 'Comprar Premium' : 'Iniciar Sesión'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="mt-6 text-sm opacity-75">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-4 h-4" />
                Pago seguro con Stripe
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Garantía de 30 días
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Comparación */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Compara Planes
          </h2>
          <p className="text-gray-600">
            Ve la diferencia entre el plan básico y Premium
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Plan Básico */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-8 border-2 border-gray-200"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Básico</h3>
              <div className="text-3xl font-bold text-blue-600 mb-1">$50</div>
              <div className="text-gray-600">Por estrategia</div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>1 estrategia personalizada</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>1 PDF descargable</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Análisis básico</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                <span>Acceso limitado</span>
              </li>
            </ul>

            <Link
              href="/"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors block text-center"
            >
              Ir al Simulador
            </Link>
          </motion.div>

          {/* Plan Premium */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white relative overflow-hidden"
          >
            <div className="absolute top-4 right-4">
              <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                MEJOR VALOR
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Plan Premium</h3>
              <div className="text-3xl font-bold mb-1">$999</div>
              <div className="opacity-90">Pago único de por vida</div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>2,000+ estrategias personalizadas</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>PDFs ilimitados</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Análisis completo de 20 años</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Acceso de por vida</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Hasta 10 familiares</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Soporte prioritario</span>
              </li>
            </ul>

            <button
              onClick={handlePremiumPurchase}
              disabled={isLoading}
              className="w-full bg-white text-purple-600 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Procesando...' : 'Comprar Premium'}
            </button>
          </motion.div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Preguntas Frecuentes
          </h2>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">
              ¿El Plan Premium es realmente de por vida?
            </h3>
            <p className="text-gray-600">
              Sí, es un pago único. Una vez que compres el Plan Premium, tendrás acceso ilimitado para siempre, sin renovaciones ni pagos adicionales.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">
              ¿Puedo usar el Plan Premium para mi familia?
            </h3>
            <p className="text-gray-600">
              Absolutamente. Puedes crear perfiles para hasta 10 familiares y generar estrategias personalizadas para cada uno.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">
              ¿Qué incluye el análisis completo de 20 años?
            </h3>
            <p className="text-gray-600">
              Incluye proyección detallada de tu pensión, considerando inflación, cambios en la UMA, y todos los factores oficiales del IMSS.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
