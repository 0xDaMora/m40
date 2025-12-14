"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Info, X, Calculator, TrendingUp, Clock, DollarSign, Shield, Users, FileText, Zap, Calendar, CheckCircle, Star } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"

interface TooltipInteligenteProps {
  termino: string
  children: React.ReactNode
  tipo?: "concepto" | "estrategia" | "numero" | "beneficio"
  posicion?: "top" | "bottom" | "left" | "right"
  colorTexto?: string // Color personalizado para el texto del tooltip
  asSpan?: boolean // Si es true, usa span en lugar de button (útil cuando está dentro de otro button)
}

const explicaciones = {
  "UMA Fijo": {
    titulo: "UMA Fijo",
    subtitulo: "Estrategia de pago constante",
    explicacion: "Con UMA Fijo, pagas la misma cantidad todos los meses durante todo el tiempo que estés en Modalidad 40. El monto se calcula al inicio y no cambia.",
    ejemplo: "Si eliges 15 UMA fijo, pagarás $8,500 mensuales durante 36 meses, sin importar si la UMA sube o baja.",
    ventajas: [
      "✅ Pagos predecibles y estables",
      "✅ Fácil de planificar en tu presupuesto",
      "✅ No te afectan los cambios en la UMA"
    ],
    consideraciones: [
      "⚠️ Si la UMA sube, podrías pagar menos de lo óptimo",
      "⚠️ Si la UMA baja, podrías pagar más de lo necesario"
    ],
    icono: Shield,
    color: "blue"
  },
  "UMA Progresivo": {
    titulo: "UMA Progresivo",
    subtitulo: "Estrategia de pago variable",
    explicacion: "Con UMA Progresivo, tu pago mensual cambia cada año según la UMA oficial. Si la UMA sube, tu pago sube; si baja, tu pago baja.",
    ejemplo: "Si eliges 15 UMA progresivo, pagarás $8,500 en 2024, pero si la UMA sube 5% en 2025, pagarás $8,925.",
    ventajas: [
      "✅ Siempre pagas el valor actual de la UMA",
      "✅ Aprovechas si la UMA sube más de lo esperado",
      "✅ Pagos más eficientes a largo plazo"
    ],
    consideraciones: [
      "⚠️ Pagos variables que pueden cambiar",
      "⚠️ Requiere más flexibilidad en tu presupuesto"
    ],
    icono: TrendingUp,
    color: "green"
  },
  "Nivel UMA": {
    titulo: "Nivel UMA",
    subtitulo: "Multiplicador de tu base salarial",
    explicacion: "El nivel UMA determina cuántas veces el salario mínimo (UMA) usarás como base para calcular tu pensión. Más UMA = mayor pensión, pero también mayores pagos.",
    ejemplo: "15 UMA significa que tu base salarial será 15 veces el salario mínimo diario ($108.57 en 2024) = $1,628 diarios.",
    ventajas: [
      "✅ Más UMA = mayor pensión final",
      "✅ Puedes elegir entre 1 y 25 UMA",
      "✅ Se adapta a tu capacidad de pago"
    ],
    consideraciones: [
      "⚠️ Más UMA = pagos mensuales más altos",
      "⚠️ El límite legal es 25 UMA"
    ],
    icono: Calculator,
    color: "purple"
  },
  "ROI": {
    titulo: "ROI (Retorno de Inversión)",
    subtitulo: "Cuánto ganas por cada peso invertido",
    explicacion: "El ROI te dice cuántas veces recuperarás tu inversión en M40. Por ejemplo, un ROI de 15x significa que por cada peso que inviertas, ganarás 15 pesos en tu pensión.",
    ejemplo: "Si inviertes $50,000 y tu ROI es 15x, ganarás $750,000 adicionales en tu pensión durante tu jubilación.",
    ventajas: [
      "✅ Te ayuda a comparar estrategias",
      "✅ Muestra la eficiencia de tu inversión",
      "✅ Considera 20 años de pensión"
    ],
    consideraciones: [
      "⚠️ Es una proyección a largo plazo",
      "⚠️ No incluye inflación"
    ],
    icono: TrendingUp,
    color: "orange"
  },
  "Meses en M40": {
    titulo: "Meses en M40",
    subtitulo: "Tiempo de aportación voluntaria",
    explicacion: "Son los meses que pagarás contribuciones voluntarias en Modalidad 40. Puedes elegir entre 1 y 58 meses (máximo legal).",
    ejemplo: "36 meses significa que pagarás contribuciones voluntarias durante 3 años, mejorando tu promedio salarial para el cálculo de pensión.",
    ventajas: [
      "✅ Más meses = mejor promedio salarial",
      "✅ Puedes elegir el tiempo que prefieras",
      "✅ Mínimo 12 meses recomendado"
    ],
    consideraciones: [
      "⚠️ Más meses = mayor inversión total",
      "⚠️ Máximo legal: 58 meses"
    ],
    icono: Clock,
    color: "blue"
  },
  "UMA": {
    titulo: "UMA (Unidad de Medida y Actualización)",
    subtitulo: "Salario mínimo diario oficial",
    explicacion: "La UMA es el salario mínimo diario que usa el IMSS para calcular pensiones. En 2024 vale $108.57 pesos. Tu nivel UMA determina tu base salarial para la pensión.",
    ejemplo: "15 UMA = 15 × $108.57 = $1,628 diarios = $48,840 mensuales como base para tu pensión.",
    ventajas: [
      "✅ Base oficial y actualizada anualmente",
      "✅ Más UMA = mayor pensión",
      "✅ Límite legal: 25 UMA"
    ],
    consideraciones: [
      "⚠️ Más UMA = pagos más altos",
      "⚠️ Se actualiza cada año"
    ],
    icono: Calculator,
    color: "orange"
  },
  "Inversión Total": {
    titulo: "Inversión Total",
    subtitulo: "Costo total de tu estrategia M40",
    explicacion: "Es la suma de todos los pagos que harás durante tu tiempo en Modalidad 40. Incluye contribuciones voluntarias al IMSS.",
    ejemplo: "Si pagas $5,000 mensuales durante 36 meses, tu inversión total será $180,000.",
    ventajas: [
      "✅ Inversión única en tu futuro",
      "✅ Pagos distribuidos en el tiempo",
      "✅ Recuperable en 2-3 años"
    ],
    consideraciones: [
      "⚠️ Requiere planificación financiera",
      "⚠️ Compromiso de varios meses"
    ],
    icono: DollarSign,
    color: "blue"
  },
  "Duración": {
    titulo: "Duración",
    subtitulo: "Tiempo en Modalidad 40",
    explicacion: "Es el número de meses que estarás pagando contribuciones voluntarias en Modalidad 40. Afecta tu inversión total y el impacto en tu pensión.",
    ejemplo: "24 meses = 2 años de pagos, 36 meses = 3 años, 48 meses = 4 años.",
    ventajas: [
      "✅ Más tiempo = mejor promedio salarial",
      "✅ Pagos distribuidos en más tiempo",
      "✅ Menor impacto mensual"
    ],
    consideraciones: [
      "⚠️ Más tiempo = mayor inversión total",
      "⚠️ Compromiso a largo plazo"
    ],
    icono: Clock,
    color: "green"
  },
  "Aportación Mensual Promedio": {
    titulo: "Aportación Mensual Promedio",
    subtitulo: "Pago mensual típico",
    explicacion: "Es el pago mensual promedio que harás durante tu tiempo en Modalidad 40. Se calcula dividiendo la inversión total entre los meses.",
    ejemplo: "Inversión total $180,000 ÷ 36 meses = $5,000 mensual promedio.",
    ventajas: [
      "✅ Te ayuda a planificar tu presupuesto",
      "✅ Pagos manejables mensualmente",
      "✅ Inversión en tu futuro"
    ],
    consideraciones: [
      "⚠️ Compromiso mensual fijo",
      "⚠️ Requiere estabilidad financiera"
    ],
    icono: DollarSign,
    color: "indigo"
  },
  "Pensión Mensual": {
    titulo: "Pensión Mensual",
    subtitulo: "Tu pensión proyectada",
    explicacion: "Es la pensión mensual que recibirás al jubilarte, calculada con las tablas oficiales del IMSS y tu estrategia de Modalidad 40.",
    ejemplo: "Sin M40: $3,500 mensual. Con M40: $15,000 mensual. Diferencia: $11,500 más por mes.",
    ventajas: [
      "✅ Pensión significativamente mayor",
      "✅ Ingresos garantizados de por vida",
      "✅ Basado en tablas oficiales IMSS"
    ],
    consideraciones: [
      "⚠️ Es una proyección",
      "⚠️ Depende de continuidad en M40"
    ],
    icono: DollarSign,
    color: "green"
  },
  "Modalidad 40": {
    titulo: "Modalidad 40",
    subtitulo: "Contribuciones voluntarias al IMSS",
    explicacion: "Es un programa del IMSS que te permite hacer contribuciones voluntarias para mejorar tu pensión. Se basa en la Ley 73 del IMSS.",
    ejemplo: "Pagas contribuciones voluntarias por 36 meses y mejoras tu pensión de $3,500 a $15,000 mensual.",
    ventajas: [
      "✅ 100% legal y oficial",
      "✅ Mejora significativa de pensión",
      "✅ Basado en Ley 73 del IMSS"
    ],
    consideraciones: [
      "⚠️ Requiere compromiso financiero",
      "⚠️ Máximo 58 meses permitidos"
    ],
    icono: Shield,
    color: "blue"
  },
  "Estrategia Progresiva": {
    titulo: "Estrategia Progresiva",
    subtitulo: "Pagos variables según UMA",
    explicacion: "Tu pago mensual cambia cada año según la UMA oficial. Si la UMA sube, tu pago sube; si baja, tu pago baja.",
    ejemplo: "Año 1: $5,000, Año 2: $5,250 (si UMA sube 5%), Año 3: $5,512.",
    ventajas: [
      "✅ Siempre pagas el valor actual",
      "✅ Aprovechas si UMA sube más",
      "✅ Pagos más eficientes"
    ],
    consideraciones: [
      "⚠️ Pagos variables",
      "⚠️ Requiere flexibilidad presupuestal"
    ],
    icono: TrendingUp,
    color: "green"
  },
  "Estrategia Fija": {
    titulo: "Estrategia Fija",
    subtitulo: "Pagos constantes",
    explicacion: "Pagas la misma cantidad todos los meses durante todo tu tiempo en Modalidad 40. El monto se calcula al inicio y no cambia.",
    ejemplo: "36 meses de $5,000 mensual = $180,000 total, sin importar cambios en UMA.",
    ventajas: [
      "✅ Pagos predecibles",
      "✅ Fácil de planificar",
      "✅ No te afectan cambios en UMA"
    ],
    consideraciones: [
      "⚠️ No aprovechas si UMA sube",
      "⚠️ Podrías pagar más si UMA baja"
    ],
    icono: Shield,
    color: "blue"
  },
  "Cálculos Verificados": {
    titulo: "Cálculos Verificados",
    subtitulo: "Basados en tablas oficiales IMSS",
    explicacion: "Todos nuestros cálculos están basados en las tablas oficiales del IMSS 2025 y la Ley 73. Hemos verificado cada fórmula con las publicaciones oficiales.",
    ejemplo: "Usamos las tablas de factor de edad, factor familiar, y porcentajes de pensión exactamente como los publica el IMSS.",
    ventajas: [
      "✅ 100% precisos según IMSS",
      "✅ Basados en Ley 73 oficial",
      "✅ Verificados con tablas 2025"
    ],
    consideraciones: [
      "⚠️ Son proyecciones",
      "⚠️ Dependen de continuidad"
    ],
    icono: CheckCircle,
    color: "green"
  },
  "100% Legal": {
    titulo: "100% Legal",
    subtitulo: "Basado en Ley 73 del IMSS",
    explicacion: "Modalidad 40 es un programa oficial del IMSS establecido en la Ley 73. Todas las estrategias que mostramos están dentro del marco legal.",
    ejemplo: "La Ley 73 permite contribuciones voluntarias de hasta 58 meses y un máximo de 25 UMA como base salarial.",
    ventajas: [
      "✅ Programa oficial del IMSS",
      "✅ Basado en Ley 73",
      "✅ Aprobado por autoridades"
    ],
    consideraciones: [
      "⚠️ Requiere cumplir requisitos",
      "⚠️ Máximo 58 meses permitidos"
    ],
    icono: Shield,
    color: "blue"
  },
  "Estrategias Optimizadas": {
    titulo: "Estrategias Optimizadas",
    subtitulo: "Seleccionadas para tu perfil",
    explicacion: "Nuestro algoritmo analiza más de 2,000 combinaciones posibles y selecciona las 5 mejores estrategias según tu situación específica.",
    ejemplo: "Consideramos tu edad, semanas cotizadas, SDI actual, y preferencias para encontrar las estrategias con mejor ROI y pensión.",
    ventajas: [
      "✅ Más de 2,000 escenarios analizados",
      "✅ Personalizadas para ti",
      "✅ Mejor relación costo-beneficio"
    ],
    consideraciones: [
      "⚠️ Basadas en datos proporcionados",
      "⚠️ Requieren evaluación personal"
    ],
    icono: TrendingUp,
    color: "purple"
  },
  "Ranking de Estrategia": {
    titulo: "Ranking de Estrategia",
    subtitulo: "Posición en el top 5",
    explicacion: "Cada estrategia está ordenada por su puntuación total, considerando pensión mensual, ROI, duración y otros factores importantes.",
    ejemplo: "#1 Mejor = mayor pensión, #2-5 = otras opciones con buen balance entre pensión, ROI y duración.",
    ventajas: [
      "✅ Ordenadas por beneficio",
      "✅ Primera = mejor pensión",
      "✅ Diversidad de opciones"
    ],
    consideraciones: [
      "⚠️ Evalúa según tus necesidades",
      "⚠️ Considera tu capacidad de pago"
    ],
    icono: Star,
    color: "yellow"
  },
  "Comprar Estrategia": {
    titulo: "Comprar Estrategia",
    subtitulo: "Acceso completo a tu plan",
    explicacion: "Al comprar obtienes acceso completo a tu estrategia detallada, incluyendo cronograma de pagos, trámites paso a paso, y proyección completa.",
    ejemplo: "Recibirás PDF con cronograma mensual, fechas de trámites, formatos oficiales, y proyección de 20 años.",
    ventajas: [
      "✅ Plan completo paso a paso",
      "✅ Cronograma detallado",
      "✅ Soporte para trámites"
    ],
    consideraciones: [
      "⚠️ Requiere compromiso",
      "⚠️ Inversión única"
    ],
    icono: DollarSign,
    color: "green"
  },
  "Ver Detalles del Plan": {
    titulo: "Ver Detalles del Plan",
    subtitulo: "Qué incluye tu compra",
    explicacion: "Revisa exactamente qué recibirás al comprar: cronograma de pagos, trámites paso a paso, formatos oficiales, y proyección completa.",
    ejemplo: "Incluye: cronograma mensual, fechas de trámites, formatos IMSS, proyección 20 años, y soporte.",
    ventajas: [
      "✅ Información completa",
      "✅ Sin sorpresas",
      "✅ Transparencia total"
    ],
    consideraciones: [
      "⚠️ Toma tu tiempo",
      "⚠️ Evalúa bien tu decisión"
    ],
    icono: FileText,
    color: "blue"
  },
  "Nueva Simulación": {
    titulo: "Nueva Simulación",
    subtitulo: "Probar diferentes parámetros",
    explicacion: "Puedes hacer una nueva simulación cambiando tu edad de jubilación, semanas cotizadas, SDI, o preferencias de estrategia.",
    ejemplo: "Prueba jubilarte a 65 en lugar de 60, o con más semanas cotizadas, para ver cómo cambian tus opciones.",
    ventajas: [
      "✅ Comparar diferentes escenarios",
      "✅ Encontrar la mejor opción",
      "✅ Gratis e ilimitado"
    ],
    consideraciones: [
      "⚠️ Usa datos realistas",
      "⚠️ Considera tu situación actual"
    ],
    icono: Calculator,
    color: "blue"
  },
  "Recuperación": {
    titulo: "Tiempo de Recuperación",
    subtitulo: "Cuándo recuperas tu inversión",
    explicacion: "Es el número de meses que tardarás en recuperar tu inversión total en M40 a través de la mejora en tu pensión mensual.",
    ejemplo: "Si inviertes $60,000 y tu pensión mejora $3,000 mensual, recuperarás tu inversión en 20 meses ($60,000 ÷ $3,000 = 20).",
    ventajas: [
      "✅ Te dice cuándo empezarás a ganar",
      "✅ Ayuda a evaluar la estrategia",
      "✅ Considera solo la mejora en pensión"
    ],
    consideraciones: [
      "⚠️ Es una estimación",
      "⚠️ No incluye inflación"
    ],
    icono: DollarSign,
    color: "green"
  },
  "Aguinaldo": {
    titulo: "Aguinaldo Anual",
    subtitulo: "Pago extra en noviembre",
    explicacion: "El aguinaldo es un pago extra que recibes en noviembre. Es igual a tu pensión mensual y se suma a tus ingresos anuales.",
    ejemplo: "Si tu pensión es $12,000 mensual, recibirás $12,000 extra en noviembre como aguinaldo.",
    ventajas: [
      "✅ Pago garantizado por ley",
      "✅ Se suma a tu pensión mensual",
      "✅ Mejora con M40"
    ],
    consideraciones: [
      "⚠️ Se paga una vez al año",
      "⚠️ Está sujeto a impuestos"
    ],
    icono: DollarSign,
    color: "purple"
  },
  "Modalidad 40": {
    titulo: "Modalidad 40",
    subtitulo: "Mecanismo oficial del IMSS",
    explicacion: "Modalidad 40 es un programa oficial del IMSS que te permite mejorar tu pensión pagando contribuciones voluntarias. Está establecido en el Artículo 167 de la Ley del Seguro Social.",
    ejemplo: "Es como 'comprar' semanas de trabajo de alta calidad para mejorar tu promedio salarial al jubilarte.",
    ventajas: [
      "✅ 100% legal y oficial",
      "✅ Aumenta tu pensión hasta 300%",
      "✅ Garantizado por el gobierno"
    ],
    consideraciones: [
      "⚠️ Requiere inversión inicial",
      "⚠️ Tiempo mínimo 12 meses"
    ],
    icono: Shield,
    color: "blue"
  },
  "Intensivo": {
    titulo: "Estrategia Intensiva",
    subtitulo: "Pagos altos por poco tiempo",
    explicacion: "Una estrategia intensiva significa que pagarás montos altos mensualmente pero por un período corto (24 meses o menos). Es ideal si tienes buena capacidad de pago.",
    ejemplo: "Pagar $15,000 mensuales por 24 meses en lugar de $8,000 por 48 meses.",
    ventajas: [
      "✅ Terminas rápido (1-2 años)",
      "✅ Menos riesgo de cambios de ley",
      "✅ Recuperas inversión pronto"
    ],
    consideraciones: [
      "⚠️ Pagos mensuales altos",
      "⚠️ Mayor impacto en presupuesto"
    ],
    icono: Zap,
    color: "red"
  },
           "Alto ROI": {
           titulo: "Alto Retorno de Inversión",
           subtitulo: "Excelente relación costo-beneficio",
           explicacion: "Un ROI alto (15x o más) significa que por cada peso que inviertas, ganarás 15 o más pesos en tu pensión. Es una de las mejores estrategias disponibles.",
           ejemplo: "Invertir $40,000 para ganar $600,000 adicionales en tu pensión (ROI 15x).",
           ventajas: [
             "✅ Máxima eficiencia de inversión",
             "✅ Mejor relación costo-beneficio",
             "✅ Recuperación rápida"
           ],
           consideraciones: [
             "⚠️ Puede requerir pagos altos",
             "⚠️ Necesita estabilidad financiera"
           ],
           icono: TrendingUp,
           color: "yellow"
         },
         "Inversión estimada": {
           titulo: "Inversión Estimada",
           subtitulo: "Total de contribuciones voluntarias",
           explicacion: "Es el monto total que pagarás en contribuciones voluntarias durante todo el tiempo que estés en Modalidad 40. Se calcula multiplicando tu pago mensual por los meses de duración.",
           ejemplo: "Si pagas $8,000 mensuales por 36 meses, tu inversión total será $288,000.",
           ventajas: [
             "✅ Te permite planificar tu presupuesto",
             "✅ Conoces el costo total de antemano",
             "✅ Puedes ajustar la estrategia"
           ],
           consideraciones: [
             "⚠️ Es una inversión significativa",
             "⚠️ Requiere compromiso financiero"
           ],
           icono: DollarSign,
           color: "blue"
         },
         "Factor edad": {
           titulo: "Factor edad",
           subtitulo: "Ajuste por edad de jubilación",
           explicacion: "El factor edad ajusta tu pensión según la edad a la que te jubiles. Jubilarse a los 65 años te da el 100% de la pensión base.",
           ejemplo: "Si te jubilas a los 60 años, tu pensión será 75% de la base. A los 65 años será 100%.",
           ventajas: [
             "✅ Jubilación tardía = mayor pensión",
             "✅ Factor oficial del IMSS",
             "✅ Aplicado automáticamente"
           ],
           consideraciones: [
             "⚠️ Jubilación temprana reduce pensión",
             "⚠️ Planificar edad de jubilación"
           ],
           icono: Calendar,
           color: "blue"
         },
         "Factor Fox": {
           titulo: "Factor Fox (11%)",
           subtitulo: "Incremento por Ley Fox",
           explicacion: "La Ley Fox otorga un incremento del 11% a todas las pensiones del IMSS. Es un beneficio adicional garantizado por ley.",
           ejemplo: "Si tu pensión base es $10,000, con el Factor Fox recibirás $11,100 mensuales.",
           ventajas: [
             "✅ Incremento garantizado por ley",
             "✅ Se aplica automáticamente",
             "✅ Beneficio permanente"
           ],
           consideraciones: [
             "⚠️ Solo aplica a pensiones IMSS",
             "⚠️ No afecta otros ingresos"
           ],
           icono: TrendingUp,
           color: "green"
         },
         "Asignaciones familiares": {
           titulo: "Asignaciones familiares",
           subtitulo: "Beneficio por dependientes",
           explicacion: "Si tienes cónyuge, recibes un incremento del 15% en tu pensión. Es un beneficio adicional por tener dependientes económicos.",
           ejemplo: "Con pensión de $10,000 y cónyuge, recibirás $11,500 mensuales.",
           ventajas: [
             "✅ Protección familiar",
             "✅ Incremento automático",
             "✅ Beneficio permanente"
           ],
           consideraciones: [
             "⚠️ Solo aplica si tienes cónyuge",
             "⚠️ Requiere matrimonio vigente"
           ],
           icono: Users,
           color: "purple"
         },
         "Umbral exento": {
           titulo: "Umbral exento ISR",
           subtitulo: "Límite libre de impuestos",
           explicacion: "Las pensiones del IMSS están exentas de ISR hasta cierto límite mensual. Solo se paga impuestos sobre el excedente.",
           ejemplo: "Con umbral de $15,000, si tu pensión es $20,000, solo pagas ISR sobre $5,000.",
           ventajas: [
             "✅ Beneficio fiscal",
             "✅ Pensión neta mayor",
             "✅ Ahorro en impuestos"
           ],
           consideraciones: [
             "⚠️ Límite puede cambiar",
             "⚠️ Consultar con contador"
           ],
           icono: Shield,
           color: "green"
         },
         "Base gravable": {
           titulo: "Base gravable",
           subtitulo: "Monto sujeto a ISR",
           explicacion: "Es la parte de tu pensión que excede el umbral exento y sobre la cual debes pagar impuestos.",
           ejemplo: "Pensión $20,000 - Umbral $15,000 = Base gravable $5,000.",
           ventajas: [
             "✅ Cálculo transparente",
             "✅ Solo sobre excedente",
             "✅ Tasa progresiva"
           ],
           consideraciones: [
             "⚠️ Varía según pensión",
             "⚠️ Consultar tabla ISR"
           ],
           icono: Calculator,
           color: "orange"
         },
         "Pensión de viudez": {
           titulo: "Pensión de viudez",
           subtitulo: "Protección familiar",
           explicacion: "Tu cónyuge recibirá el 90% de tu pensión si falleces. Es una protección financiera para tu familia.",
           ejemplo: "Si tu pensión es $15,000, tu cónyuge recibirá $13,500 mensuales.",
           ventajas: [
             "✅ Protección familiar",
             "✅ 90% de tu pensión",
             "✅ Beneficio permanente"
           ],
           consideraciones: [
             "⚠️ Solo para cónyuge",
             "⚠️ Requiere matrimonio vigente"
           ],
           icono: Shield,
           color: "purple"
         },
         "Aportación mensual promedio": {
           titulo: "Aportación Mensual Promedio",
           subtitulo: "Pago mensual durante M40",
           explicacion: "Es el monto promedio que pagarás cada mes durante tu tiempo en Modalidad 40. Se calcula dividiendo tu inversión total entre los meses de duración.",
           ejemplo: "Si inviertes $288,000 en 36 meses, tu aportación mensual promedio será $8,000.",
           ventajas: [
             "✅ Te ayuda a planificar tu presupuesto mensual",
             "✅ Conoces el compromiso financiero",
             "✅ Puedes ajustar la estrategia según tu capacidad"
           ],
           consideraciones: [
             "⚠️ Es un compromiso mensual fijo",
             "⚠️ Debes tener estabilidad financiera"
           ],
           icono: DollarSign,
           color: "blue"
         },
         "Pensión neta": {
           titulo: "Pensión Neta",
           subtitulo: "Pensión después de impuestos",
           explicacion: "Es el monto que recibirás cada mes después de descontar el Impuesto Sobre la Renta (ISR). Las pensiones del IMSS tienen un umbral exento de impuestos, y solo se paga ISR sobre el excedente.",
           ejemplo: "Si tu pensión bruta es $20,000 y el umbral exento es $15,000, solo pagarás ISR sobre $5,000. Tu pensión neta será aproximadamente $19,000.",
           ventajas: [
             "✅ Beneficio fiscal en pensiones",
             "✅ Umbral exento de impuestos",
             "✅ Pensión neta mayor que bruta"
           ],
           consideraciones: [
             "⚠️ El umbral puede cambiar anualmente",
             "⚠️ Solo aplica a pensiones del IMSS"
           ],
           icono: DollarSign,
           color: "green"
         },
         "Inversión total": {
           titulo: "Inversión Total",
           subtitulo: "Costo total de tu estrategia M40",
           explicacion: "Es la suma de todos los pagos que harás durante tu tiempo en Modalidad 40. Incluye todas las contribuciones voluntarias al IMSS durante los meses que elijas.",
           ejemplo: "Si pagas $8,000 mensuales durante 36 meses, tu inversión total será $288,000.",
           ventajas: [
             "✅ Inversión única en tu futuro",
             "✅ Pagos distribuidos en el tiempo",
             "✅ Recuperable en 2-3 años"
           ],
           consideraciones: [
             "⚠️ Requiere planificación financiera",
             "⚠️ Compromiso de varios meses"
           ],
           icono: DollarSign,
           color: "blue"
         },
         "Pensión mensual": {
           titulo: "Pensión Mensual",
           subtitulo: "Ingreso mensual al jubilarse",
           explicacion: "Es el monto que recibirás cada mes de tu pensión del IMSS después de jubilarte. Incluye todos los factores y beneficios aplicables.",
           ejemplo: "Una pensión de $15,000 mensuales significa que recibirás $180,000 anuales durante toda tu jubilación.",
           ventajas: [
             "✅ Ingreso garantizado de por vida",
             "✅ Se ajusta con la inflación",
             "✅ Incluye aguinaldo anual"
           ],
           consideraciones: [
             "⚠️ Está sujeto a impuestos",
             "⚠️ Puede cambiar con reformas"
           ],
           icono: DollarSign,
           color: "green"
         }
}

export default function TooltipInteligente({ 
  termino, 
  children, 
  tipo = "concepto",
  posicion = "top",
  colorTexto,
  asSpan = false
}: TooltipInteligenteProps) {
  // Siempre mantener el mismo orden/cantidad de hooks en todos los renders
  const [isOpen, setIsOpen] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0, placement: 'bottom' })
  const triggerRef = useRef<HTMLButtonElement | HTMLSpanElement>(null)
  // Fallback seguro para evitar retornos condicionales antes/después de hooks
  const explicacion = explicaciones[termino as keyof typeof explicaciones] || {
    titulo: termino,
    subtitulo: "",
    explicacion: "",
    ejemplo: "",
    ventajas: [] as string[],
    consideraciones: [] as string[],
    icono: Info,
    color: "blue"
  }

  const IconComponent = explicacion.icono

  // Calcular posición dinámica
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      const tooltipWidth = 320
      const tooltipHeight = 280 // Reducido para ser más compacto
      
      const spaceTop = rect.top
      const spaceBottom = viewportHeight - rect.bottom
      const spaceLeft = rect.left
      const spaceRight = viewportWidth - rect.right
      
      let placement = 'bottom'
      let x = rect.left + rect.width / 2
      let y = rect.bottom + 8
      
             // Determinar la mejor posición
       if (spaceBottom >= tooltipHeight + 20) {
         placement = 'bottom'
         y = rect.bottom + 8
       } else if (spaceTop >= tooltipHeight + 20) {
         placement = 'top'
         y = rect.top - tooltipHeight - 8
       } else if (spaceRight >= tooltipWidth + 20) {
         placement = 'right'
         x = rect.right + 8
         y = rect.top + rect.height / 2 - tooltipHeight / 2
       } else if (spaceLeft >= tooltipWidth + 20) {
         placement = 'left'
         x = rect.left - tooltipWidth - 8
         y = rect.top + rect.height / 2 - tooltipHeight / 2
       } else {
         // Centrar en la pantalla si no hay espacio, evitando el navbar
         placement = 'center'
         x = viewportWidth / 2 - tooltipWidth / 2
         y = Math.max(80, viewportHeight / 2 - tooltipHeight / 2) // Evitar navbar
       }
       
       // Asegurar que no se salga de los bordes
       x = Math.max(10, Math.min(x, viewportWidth - tooltipWidth - 10))
       y = Math.max(10, Math.min(y, viewportHeight - tooltipHeight - 10))
      
      setTooltipPosition({ x, y, placement })
    }
  }, [isOpen])

  // Cerrar tooltip al hacer scroll
  useEffect(() => {
    const handleScroll = () => setIsOpen(false)
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [])

  return (
    <>
      {React.isValidElement(children) && children.type === 'button' ? (
        <div
          ref={triggerRef}
          data-tooltip-trigger
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center gap-1 transition-colors cursor-pointer group relative ${
            colorTexto || "text-blue-600 hover:text-blue-800"
          }`}
        >
          {children}
          <Info className={`w-4 h-4 group-hover:scale-110 transition-transform ${
            colorTexto || "text-blue-600"
          }`} />
          {/* Indicador para móvil */}
          <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse sm:hidden ${
            colorTexto ? "bg-current" : "bg-blue-500"
          }`}></span>
        </div>
      ) : asSpan ? (
        <span
          ref={triggerRef}
          data-tooltip-trigger
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
          className={`inline-flex items-center gap-1 transition-colors cursor-pointer group relative ${
            colorTexto || "text-blue-600 hover:text-blue-800"
          }`}
        >
          {children}
          <Info className={`w-4 h-4 group-hover:scale-110 transition-transform ${
            colorTexto || "text-blue-600"
          }`} />
          {/* Indicador para móvil */}
          <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse sm:hidden ${
            colorTexto ? "bg-current" : "bg-blue-500"
          }`}></span>
        </span>
      ) : (
        <button
          ref={triggerRef}
          data-tooltip-trigger
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center gap-1 transition-colors cursor-pointer group relative ${
            colorTexto || "text-blue-600 hover:text-blue-800"
          }`}
        >
          {children}
          <Info className={`w-4 h-4 group-hover:scale-110 transition-transform ${
            colorTexto || "text-blue-600"
          }`} />
          {/* Indicador para móvil */}
          <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse sm:hidden ${
            colorTexto ? "bg-current" : "bg-blue-500"
          }`}></span>
        </button>
      )}

      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            key="tooltip-inteligente"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed z-60"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
            }}
          >
            {/* Tooltip content - Versión más compacta */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-3 w-72 max-w-[90vw] sm:w-80">
              {/* Header compacto */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${
                    explicacion.color === 'blue' ? 'bg-blue-100' :
                    explicacion.color === 'green' ? 'bg-green-100' :
                    explicacion.color === 'purple' ? 'bg-purple-100' :
                    'bg-orange-100'
                  }`}>
                    <IconComponent className={`w-3 h-3 ${
                      explicacion.color === 'blue' ? 'text-blue-600' :
                      explicacion.color === 'green' ? 'text-green-600' :
                      explicacion.color === 'purple' ? 'text-purple-600' :
                      'text-orange-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-xs">
                      {explicacion.titulo}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {explicacion.subtitulo}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Explicación compacta */}
              <p className="text-xs text-gray-700 mb-2 leading-relaxed">
                {explicacion.explicacion}
              </p>

              {/* Ejemplo compacto - oculto en móvil */}
              <div className="hidden sm:block bg-blue-50 border border-blue-200 p-2 rounded mb-2">
                <p className="text-xs text-blue-800 font-medium mb-1">Ejemplo:</p>
                <p className="text-xs text-blue-700">
                  {explicacion.ejemplo}
                </p>
              </div>

              {/* Ventajas y consideraciones compactas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <h5 className="text-xs font-semibold text-green-600 mb-1">VENTAJAS:</h5>
                  <ul className="space-y-0.5">
                    {explicacion.ventajas.slice(0, window.innerWidth < 640 ? 1 : 2).map((ventaja, index) => (
                      <li key={index} className="text-xs text-green-700 flex items-start gap-1">
                        <span className="text-green-500 mt-0.5">•</span>
                        {ventaja}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="hidden sm:block">
                  <h5 className="text-xs font-semibold text-orange-600 mb-1">CONSIDERACIONES:</h5>
                  <ul className="space-y-0.5">
                    {explicacion.consideraciones.slice(0, 2).map((consideracion, index) => (
                      <li key={index} className="text-xs text-orange-700 flex items-start gap-1">
                        <span className="text-orange-500 mt-0.5">•</span>
                        {consideracion}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer compacto */}
              <div className="mt-2 pt-1 border-t border-gray-100">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <FileText className="w-2 h-2" />
                    <span>Ley 73</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-2 h-2" />
                    <span>Oficial</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Overlay para cerrar al hacer clic fuera */}
      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setIsOpen(false)}
        />,
        document.body
      )}
    </>
  )
}
