"use client"

import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts'
import { TrendingUp, Users, Award, CheckCircle, Shield } from "lucide-react"
import { useState, useEffect } from "react"
import AnimatedCounter from "./AnimatedCounter"
import TooltipInteligente from "./TooltipInteligente"
import { ajustarPensionConPMG, formatearPMG, obtenerInfoPMG } from "@/lib/config/pensionMinima"

const ejemplosIlustrativos = [
  {
    titulo: "Caso 1: Inversión Baja - Duplicar PMG",
    perfil: "Hombre, 55 años, Guadalajara",
    edad: 62,
    ciudad: "Guadalajara",
    pensionAntes: ajustarPensionConPMG(4200), // PMG ajustada
    pensionDespues: 19449, // Duplicar PMG (9,724.48 × 2)
    inversion: 180000, // $750/mes × 24 meses
    meses: 48,
    descripcion: "Ejemplo de inversión accesible que duplica la pensión mínima garantizada en solo 4 años.",
    placeholder_foto: true
  },
  {
    titulo: "Caso 2: SDI Alto - Duplicar Pensión", 
    perfil: "Mujer, 65 años, CDMX",
    edad: 61,
    ciudad: "CDMX", 
    pensionAntes: 15000, // SDI alto, no necesita PMG
    pensionDespues: 30000, // Duplicar pensión
    inversion: 360000, // $1,000/mes × 36 meses
    meses: 36,
    descripcion: "Perfil con buen SDI que logra duplicar su pensión con inversión moderada en 3 años.",
    placeholder_foto: true
  },
  {
    titulo: "Caso 3: Llegar al TOPE - Máxima Pensión",
    perfil: "Hombre, 60 años, Monterrey",
    edad: 60,
    ciudad: "Monterrey",
    pensionAntes: ajustarPensionConPMG(3800), // PMG ajustada
    pensionDespues: 59000, // Llegar al tope de pensión
    inversion: 900000, // $1,500/mes × 48 meses
    meses: 58,
    descripcion: "Estrategia ambiciosa para alcanzar la máxima pensión posible con inversión a largo plazo.",
    placeholder_foto: true
  }
]

const beneficiosM40 = [
  { metrica: "Aumento máximo posible", valor: "300%", icono: TrendingUp },
  { metrica: "Tiempo mínimo", valor: "12 meses", icono: Users },
  { metrica: "Método oficial", valor: "IMSS", icono: Award },
  { metrica: "Basado en", valor: "Ley 73", icono: CheckCircle }
]

export default function CasosDeExito() {
  const dataComparacion = ejemplosIlustrativos.map((caso, index) => ({
    nombre: `Caso ${index + 1}`,
    antes: caso.pensionAntes,
    despues: caso.pensionDespues,
    mejora: Math.round(((caso.pensionDespues - caso.pensionAntes) / caso.pensionAntes) * 100)
  }))

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <CheckCircle className="w-4 h-4" />
            Ejemplos ilustrativos basados en datos reales
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Potencial de mejora con <TooltipInteligente termino="Modalidad 40">Modalidad 40</TooltipInteligente>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Estos ejemplos muestran cómo diferentes perfiles pueden optimizar su pensión
            del IMSS usando los cálculos oficiales de <TooltipInteligente termino="Modalidad 40">Modalidad 40</TooltipInteligente>
          </p>
          
          {/* Información de PMG */}
          <div className="mt-6 inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
            <Shield className="w-4 h-4" />
            Pensión Mínima Garantizada {obtenerInfoPMG().anio}: {formatearPMG()}
          </div>
        </div>

        {/* Beneficios oficiales M40 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {beneficiosM40.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.1)"
              }}
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 text-center hover:border-blue-200 transition-all duration-300 cursor-default"
            >
              <motion.div 
                className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <stat.icono className="w-6 h-6 text-blue-600" />
              </motion.div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.valor.includes('%') ? (
                  <AnimatedCounter 
                    end={parseInt(stat.valor)} 
                    suffix="%" 
                    duration={2}
                  />
                ) : stat.valor.includes('meses') ? (
                  <AnimatedCounter 
                    end={parseInt(stat.valor)} 
                    suffix=" meses" 
                    duration={2}
                  />
                ) : stat.valor}
              </div>
              <div className="text-sm text-gray-600">{stat.metrica}</div>
            </motion.div>
          ))}
        </div>

        {/* Gráfico de comparación */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
            Ejemplos de mejora en pensión mensual con <TooltipInteligente termino="Modalidad 40">M40</TooltipInteligente>
          </h3>
          <p className="text-sm text-gray-600 text-center mb-6">
            Casos ilustrativos basados en cálculos oficiales IMSS
          </p>
          
          {/* Espacios para fotos de casos */}
          <div className="flex justify-center gap-8 mb-6">
            {ejemplosIlustrativos.map((caso, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden border-2 border-gray-200">
                  <img 
                    src={`/images/old${index + 1}.jpeg`} 
                    alt={`Caso ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-gray-600">{caso.titulo}</p>
              </div>
            ))}
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataComparacion} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="nombre" />
                <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`} />
                <Bar dataKey="antes" fill="#6366f1" name="Antes" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despues" fill="#f59e0b" name="Después" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-indigo-500 rounded"></div>
              <span>Pensión antes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded"></div>
              <span>Pensión después</span>
            </div>
          </div>
        </div>

        {/* Casos detallados */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {ejemplosIlustrativos.map((caso, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
            >
              {/* Header del caso con foto */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                  <img 
                    src={`/images/old${index + 1}.jpeg`} 
                    alt={`Caso ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-900">{caso.titulo}</h4>
                  <p className="text-sm text-gray-600">{caso.perfil}</p>
                  <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium mt-2 inline-block">
                    +{Math.round(((caso.pensionDespues - caso.pensionAntes) / caso.pensionAntes) * 100)}% mejora
                  </div>
                </div>
              </div>

                             {/* Métricas */}
               <div className="space-y-3 mb-4">
                 <div className="flex justify-between items-center py-2 border-b border-gray-100">
                   <span className="text-sm text-gray-600">Pensión anterior</span>
                   <span className="font-semibold text-indigo-600">${caso.pensionAntes.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-gray-100">
                   <span className="text-sm text-gray-600">Pensión optimizada</span>
                   <span className="font-semibold text-amber-600">${caso.pensionDespues.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-gray-100">
                   <span className="text-sm text-gray-600">
                     <TooltipInteligente termino="Inversión estimada">Inversión total</TooltipInteligente>
                   </span>
                   <span className="font-semibold text-blue-600">${caso.inversion.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-gray-100">
                   <span className="text-sm text-gray-600">
                     <TooltipInteligente termino="Aportación Mensual Promedio">Aportación mensual</TooltipInteligente>
                   </span>
                   <span className="font-semibold text-green-600">${Math.round(caso.inversion / caso.meses).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center py-2">
                   <span className="text-sm text-gray-600">
                     <TooltipInteligente termino="Meses en M40">Tiempo en M40</TooltipInteligente>
                   </span>
                   <span className="font-semibold text-gray-700">{caso.meses} meses</span>
                 </div>
               </div>

              {/* Descripción del caso */}
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-blue-800 font-medium mb-1">Caso ilustrativo</p>
                <p className="text-sm text-blue-700">{caso.descripcion}</p>
              </div>

              {/* ROI Badge */}
              <div className="mt-4 text-center">
                <div className="inline-block bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                  ROI: {((caso.pensionDespues * 12 * 20 - caso.pensionAntes * 12 * 20) / caso.inversion).toFixed(1)}x en 20 años
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer importante */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <h4 className="font-bold text-yellow-800 mb-2">Importante:</h4>
          <p className="text-sm text-yellow-700">
            Los casos mostrados son <strong>ejemplos ilustrativos</strong> basados en cálculos oficiales del IMSS 
            para diferentes perfiles típicos. Los resultados reales dependerán de tu situación específica, 
            historial laboral y decisiones de inversión. Siempre consulta con un especialista antes de 
            tomar decisiones financieras importantes.
          </p>
        </div>

        {/* Call to action */}
        <div className="text-center">
          <div className="bg-blue-50 rounded-xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Calcula tu potencial real
            </h3>
            <p className="text-gray-700 mb-6">
              Descubre exactamente cuánto podrías mejorar tu pensión con tus datos específicos.
              <br />
              <strong>Obtén tu cálculo personalizado basado en tablas oficiales IMSS.</strong>
            </p>
            <button 
              onClick={() => {
                document.querySelector('section')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <TrendingUp className="w-5 h-5" />
              Calcular mi estrategia personalizada
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}