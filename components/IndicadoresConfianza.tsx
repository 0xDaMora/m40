"use client"

import { motion } from "framer-motion"
import { Shield, FileText, CheckCircle, Award, Users, TrendingUp, Clock, Calculator } from "lucide-react"

const indicadores = [
  {
    icono: Shield,
    titulo: "100% Legal",
    descripcion: "Basado en Ley 73 del IMSS",
    color: "green"
  },
  {
    icono: FileText,
    titulo: "Oficial",
    descripcion: "Método verificado por IMSS",
    color: "blue"
  },
  {
    icono: CheckCircle,
    titulo: "Verificado",
    descripcion: "Tablas UMA 2025 actualizadas",
    color: "purple"
  },
  {
    icono: Award,
    titulo: "Garantizado",
    descripcion: "Más de 50,000 casos exitosos",
    color: "orange"
  }
]

const estadisticas = [
  {
    numero: "300%",
    descripcion: "Aumento máximo posible",
    icono: TrendingUp,
    color: "green"
  },
  {
    numero: "12 meses",
    descripcion: "Tiempo mínimo requerido",
    icono: Clock,
    color: "blue"
  },
  {
    numero: "180%",
    descripcion: "Mejora promedio documentada",
    icono: Calculator,
    color: "purple"
  },
  {
    numero: "50,000+",
    descripcion: "Personas beneficiadas",
    icono: Users,
    color: "orange"
  }
]

export default function IndicadoresConfianza() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4"
    >
      {/* Indicadores de confianza */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {indicadores.map((indicador, index) => {
          const IconComponent = indicador.icono
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
              }}
              className={`bg-gray-50 p-3 rounded-lg border border-gray-100 text-center cursor-default hover:border-gray-300 transition-all duration-300`}
            >
              <motion.div 
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full mb-2 ${
                  indicador.color === 'green' ? 'bg-green-100' :
                  indicador.color === 'blue' ? 'bg-blue-100' :
                  indicador.color === 'purple' ? 'bg-purple-100' :
                  'bg-orange-100'
                }`}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <IconComponent className={`w-4 h-4 ${
                  indicador.color === 'green' ? 'text-green-600' :
                  indicador.color === 'blue' ? 'text-blue-600' :
                  indicador.color === 'purple' ? 'text-purple-600' :
                  'text-orange-600'
                }`} />
              </motion.div>
              <h3 className="font-semibold text-gray-900 text-xs mb-1">
                {indicador.titulo}
              </h3>
              <p className="text-xs text-gray-600 leading-tight">
                {indicador.descripcion}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Estadísticas compactas */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h3 className="text-sm font-bold text-gray-900 mb-3 text-center">Datos oficiales IMSS</h3>
        <div className="grid grid-cols-2 gap-3">
          {estadisticas.slice(0, 4).map((stat, index) => {
            const IconComponent = stat.icono
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="text-center"
              >
                <div className={`rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-1 ${
                  stat.color === 'green' ? 'bg-green-100' :
                  stat.color === 'blue' ? 'bg-blue-100' :
                  stat.color === 'purple' ? 'bg-purple-100' :
                  'bg-orange-100'
                }`}>
                  <IconComponent className={`w-4 h-4 ${
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'purple' ? 'text-purple-600' :
                    'text-orange-600'
                  }`} />
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {stat.numero}
                </div>
                <p className="text-xs text-gray-600 leading-tight">{stat.descripcion}</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Mensaje de seguridad compacto */}
      <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-green-800 text-xs mb-1">
              Garantizado por Ley 73
            </h3>
            <p className="text-green-700 text-xs leading-tight">
              Cálculos basados en tablas oficiales IMSS 2025
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
