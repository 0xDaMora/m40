"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Clock, 
  Shield,
  Calculator,
  Users,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Info,
  Download,
  Share2,
  Star
} from "lucide-react"
import TooltipInteligente from "./TooltipInteligente"
import { calcularISRPension, calcularProyeccionPension, calcularPensionViudez } from "@/lib/all/calcularISR"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface EstrategiaDetalladaProps {
  estrategia: any
  datosUsuario: any
  onVolver: () => void
  debugCode?: string
  familyMemberId?: string
}

const tabs = [
  { id: "resumen", label: "📊 Resumen", icon: Calculator },
  { id: "pagos", label: "💰 Pagos Mensuales", icon: DollarSign },
  { id: "cronograma", label: "📅 Cronograma", icon: Calendar },
  { id: "proyeccion", label: "📈 Proyección 20 Años", icon: TrendingUp },
  { id: "tramites", label: "📋 Trámites", icon: FileText },
  { id: "viudez", label: "🛡️ Pensión Viudez", icon: Shield }
]

export default function EstrategiaDetallada({ estrategia, datosUsuario, onVolver, debugCode, familyMemberId }: EstrategiaDetalladaProps) {
  const [tabActivo, setTabActivo] = useState("resumen")
  const [guardando, setGuardando] = useState(false)
  const [guardada, setGuardada] = useState(false)



  // Calcular ISR
  const isr = calcularISRPension({
    pensionMensual: estrategia.pensionMensual,
    pensionAnual: estrategia.pensionMensual * 12,
    aguinaldo: estrategia.pensionMensual,
    año: 2024
  })

  // Calcular pensión de viudez
  const pensionViudez = calcularPensionViudez(estrategia.pensionMensual)

  // Fechas importantes
  const fechaInicioM40 = new Date(datosUsuario.inicioM40 || "2024-02-01")
  const fechaFinM40 = new Date(fechaInicioM40)
  fechaFinM40.setMonth(fechaFinM40.getMonth() + estrategia.mesesM40)
  
  // Calcular fecha de jubilación objetivo (edad de jubilación)
  let fechaJubilacion: Date
  let fechaTramite: Date
  

  
  // Siempre intentar usar fecha de nacimiento + edad de jubilación
  if (datosUsuario.fechaNacimiento && datosUsuario.edadJubilacion) {
    // Calcular fecha exacta de jubilación basada en fecha de nacimiento + edad objetivo
    const fechaNacimiento = new Date(datosUsuario.fechaNacimiento)
    const edadJubilacion = parseInt(datosUsuario.edadJubilacion)
    
    fechaJubilacion = new Date(fechaNacimiento)
    fechaJubilacion.setFullYear(fechaNacimiento.getFullYear() + edadJubilacion)
    
    // El inicio de trámites es 1 mes antes de la fecha de jubilación objetivo
    fechaTramite = new Date(fechaJubilacion)
    fechaTramite.setMonth(fechaTramite.getMonth() - 1)
    

  } else {
    // Solo usar fallback si realmente no hay datos de fecha de nacimiento
    
    // Fallback: usar fecha de fin M40 + 1 mes para trámites, y + 2 meses para jubilación
    fechaTramite = new Date(fechaFinM40)
    fechaTramite.setMonth(fechaTramite.getMonth() + 1)
    
    fechaJubilacion = new Date(fechaTramite)
    fechaJubilacion.setMonth(fechaJubilacion.getMonth() + 1)
  }
  
  // Calcular año de jubilación para la proyección
  const añoJubilacion = fechaJubilacion.getFullYear()
  

  
  // Calcular proyección 20 años desde el año de jubilación
  const proyeccion = calcularProyeccionPension({
    pensionInicial: estrategia.pensionMensual,
    años: 20,
    incrementoAnual: 5,
    añoInicio: añoJubilacion // Agregar año de inicio
  })

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Función para calcular edad
  const calculateAge = (birthDate: string | Date) => {
    const today = new Date()
    const birth = birthDate instanceof Date ? birthDate : new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const [generandoPDF, setGenerandoPDF] = useState(false)

  const guardarEstrategia = async () => {
    if (!debugCode || guardando || guardada) return
    
    setGuardando(true)
    try {
      const response = await fetch('/api/guardar-estrategia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          debugCode,
          datosEstrategia: estrategia,
          datosUsuario,
          familyMemberId
        }),
      })

      if (response.ok) {
        setGuardada(true)
        console.log('Estrategia guardada exitosamente')
      } else if (response.status === 409) {
        // La estrategia ya existe
        setGuardada(true)
        console.log('Estrategia ya estaba guardada')
      } else {
        throw new Error('Error al guardar estrategia')
      }
    } catch (error) {
      console.error('Error guardando estrategia:', error)
    } finally {
      setGuardando(false)
    }
  }

  const compartirEstrategia = async () => {
    const url = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mi Estrategia de Modalidad 40',
          text: `Estrategia ${estrategia.estrategia === "fijo" ? "UMA Fijo" : "UMA Progresivo"} - ${estrategia.umaElegida} UMA - ${estrategia.mesesM40} meses`,
          url: url
        })
      } catch (error) {
        console.log('Error al compartir:', error)
        // Fallback: copiar al portapapeles
        await navigator.clipboard.writeText(url)
        alert('Enlace copiado al portapapeles')
      }
    } else {
      // Fallback para navegadores que no soportan Web Share API
      try {
        await navigator.clipboard.writeText(url)
        alert('Enlace copiado al portapapeles')
      } catch (error) {
        console.error('Error al copiar:', error)
        alert('No se pudo copiar el enlace')
      }
    }
  }

  const generarPDF = async () => {
    setGenerandoPDF(true)
    
    try {
      console.log('🔍 Iniciando generación de PDF...')
      
      // Crear un elemento con todo el contenido de la estrategia
      const testElement = document.createElement('div')
      testElement.innerHTML = `
        <div style="background-color: #ffffff; color: #000000; padding: 20px; font-family: Arial, sans-serif; max-width: 800px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
            <h1 style="color: #1e40af; font-size: 24px; margin-bottom: 10px;">
              🎯 ${estrategia.estrategia === "fijo" ? "Estrategia UMA Fijo" : "Estrategia UMA Progresivo"}
            </h1>
            <p style="color: #64748b; font-size: 16px;">
              Nivel UMA: ${estrategia.umaElegida} • ${estrategia.mesesM40} meses en M40
            </p>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 10px;">
              Generado el ${new Date().toLocaleDateString('es-MX')}
            </p>
          </div>

          ${datosUsuario.nombreFamiliar ? `
          <!-- Información Personalizada -->
          <div style="margin-bottom: 30px; padding: 20px; background-color: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe;">
            <h2 style="color: #1e40af; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #bfdbfe; padding-bottom: 5px;">
              👤 Información Personalizada
            </h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
              <div style="background-color: white; padding: 10px; border-radius: 6px; border: 1px solid #dbeafe;">
                <div style="font-size: 12px; color: #3b82f6; font-weight: bold; margin-bottom: 5px;">👤 Nombre</div>
                <div style="font-size: 14px; font-weight: bold; color: #1e293b;">${datosUsuario.nombreFamiliar}</div>
              </div>
              <div style="background-color: white; padding: 10px; border-radius: 6px; border: 1px solid #dbeafe;">
                <div style="font-size: 12px; color: #3b82f6; font-weight: bold; margin-bottom: 5px;">📅 Edad Actual</div>
                <div style="font-size: 14px; font-weight: bold; color: #1e293b;">${datosUsuario.edadActual || calculateAge(datosUsuario.fechaNacimiento)} años</div>
              </div>
              <div style="background-color: white; padding: 10px; border-radius: 6px; border: 1px solid #dbeafe;">
                <div style="font-size: 12px; color: #3b82f6; font-weight: bold; margin-bottom: 5px;">🎯 Edad Jubilación</div>
                <div style="font-size: 14px; font-weight: bold; color: #1e293b;">${datosUsuario.edadJubilacion} años</div>
              </div>
              <div style="background-color: white; padding: 10px; border-radius: 6px; border: 1px solid #dbeafe;">
                <div style="font-size: 12px; color: #3b82f6; font-weight: bold; margin-bottom: 5px;">📊 Semanas Cotizadas</div>
                <div style="font-size: 14px; font-weight: bold; color: #1e293b;">${datosUsuario.semanasCotizadas || datosUsuario.semanasPrevias} semanas</div>
              </div>
              <div style="background-color: white; padding: 10px; border-radius: 6px; border: 1px solid #dbeafe;">
                <div style="font-size: 12px; color: #3b82f6; font-weight: bold; margin-bottom: 5px;">💰 Salario Mensual</div>
                <div style="font-size: 14px; font-weight: bold; color: #1e293b;">${formatCurrency(datosUsuario.salarioMensual || (datosUsuario.sdiHistorico * 30.4))}</div>
              </div>
              <div style="background-color: white; padding: 10px; border-radius: 6px; border: 1px solid #dbeafe;">
                <div style="font-size: 12px; color: #3b82f6; font-weight: bold; margin-bottom: 5px;">📈 SDI Actual</div>
                <div style="font-size: 14px; font-weight: bold; color: #1e293b;">${formatCurrency(datosUsuario.sdiActual || datosUsuario.sdiHistorico)}</div>
              </div>
              <div style="background-color: white; padding: 10px; border-radius: 6px; border: 1px solid #dbeafe;">
                <div style="font-size: 12px; color: #3b82f6; font-weight: bold; margin-bottom: 5px;">💍 Estado Civil</div>
                <div style="font-size: 14px; font-weight: bold; color: #1e293b;">${datosUsuario.estadoCivil || 'No especificado'}</div>
              </div>
              <div style="background-color: white; padding: 10px; border-radius: 6px; border: 1px solid #dbeafe;">
                <div style="font-size: 12px; color: #3b82f6; font-weight: bold; margin-bottom: 5px;">💳 Aportación Promedio</div>
                <div style="font-size: 14px; font-weight: bold; color: #1e293b;">${formatCurrency(datosUsuario.aportacionPromedio || (estrategia.inversionTotal / estrategia.mesesM40))}</div>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Métricas principales -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px;">
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 20px; font-weight: bold; color: #1e40af;">${formatCurrency(estrategia.pensionMensual)}</div>
              <div style="font-size: 14px; color: #64748b;">Pensión mensual</div>
            </div>
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 20px; font-weight: bold; color: #16a34a;">${formatCurrency(isr.pensionNeta)}</div>
              <div style="font-size: 14px; color: #64748b;">Pensión neta (después ISR)</div>
            </div>
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 20px; font-weight: bold; color: #dc2626;">${formatCurrency(estrategia.inversionTotal)}</div>
              <div style="font-size: 14px; color: #64748b;">Inversión total</div>
            </div>
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 20px; font-weight: bold; color: #7c3aed;">${estrategia.ROI}%</div>
              <div style="font-size: 14px; color: #64748b;">ROI en 20 años</div>
            </div>
          </div>

          <!-- Desglose de pensión -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #1e293b; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
              📊 Desglose de Pensión
            </h2>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #475569;">Pensión base:</span>
                <span style="font-weight: bold; color: #1e293b;">${formatCurrency(estrategia.pensionMensual)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #475569;">Factor edad (${estrategia.factorEdad}):</span>
                <span style="font-weight: bold; color: #1e293b;">${formatCurrency(estrategia.conFactorEdad)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #475569;">Factor Fox (11%):</span>
                <span style="font-weight: bold; color: #1e293b;">${formatCurrency(estrategia.conLeyFox)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #475569;">Asignaciones familiares:</span>
                <span style="font-weight: bold; color: #1e293b;">${formatCurrency(estrategia.conDependiente)}</span>
              </div>
              <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 15px 0;">
              <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold;">
                <span style="color: #1e293b;">Pensión final:</span>
                <span style="color: #16a34a;">${formatCurrency(estrategia.pensionMensual)}</span>
              </div>
            </div>
          </div>

          <!-- Cálculo de ISR -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #1e293b; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
              💰 Cálculo de ISR
            </h2>
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #475569;">Pensión bruta:</span>
                <span style="font-weight: bold; color: #1e293b;">${formatCurrency(isr.pensionBruta)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #475569;">Umbral exento:</span>
                <span style="font-weight: bold; color: #1e293b;">${formatCurrency(isr.umbralExento)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #475569;">Base gravable:</span>
                <span style="font-weight: bold; color: #1e293b;">${formatCurrency(isr.baseGravable)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #475569;">ISR mensual:</span>
                <span style="font-weight: bold; color: #dc2626;">-${formatCurrency(isr.isrMensual)}</span>
              </div>
              <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 15px 0;">
              <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold;">
                <span style="color: #1e293b;">Pensión neta:</span>
                <span style="color: #16a34a;">${formatCurrency(isr.pensionNeta)}</span>
              </div>
            </div>
          </div>

          <!-- Pagos Mensuales -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #1e293b; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
              💰 Pagos Mensuales (${estrategia.mesesM40} meses)
            </h2>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px;">
              <p style="color: #64748b; font-size: 14px; margin-bottom: 15px;">
                Los pagos mensuales se realizan durante ${estrategia.mesesM40} meses. Cada pago mejora tu promedio salarial para el cálculo final de pensión.
              </p>
              <div style="overflow-x: auto;">
                                 <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                   <thead>
                     <tr style="background-color: #e2e8f0;">
                       <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Mes</th>
                       <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Fecha</th>
                       <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">UMA</th>
                       <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Tasa M40</th>
                       <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">SDI Mensual</th>
                       <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Cuota Mensual</th>
                       <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Acumulado</th>
                     </tr>
                   </thead>
                   <tbody>
                     ${estrategia.registros?.map((registro: any, index: number) => `
                       <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                         <td style="border: 1px solid #cbd5e1; padding: 6px;">${index + 1}</td>
                         <td style="border: 1px solid #cbd5e1; padding: 6px;">${registro.fecha}</td>
                         <td style="border: 1px solid #cbd5e1; padding: 6px;">${registro.uma}</td>
                         <td style="border: 1px solid #cbd5e1; padding: 6px;">${registro.tasaM40 ? registro.tasaM40.toFixed(2) + '%' : 'N/A'}</td>
                         <td style="border: 1px solid #cbd5e1; padding: 6px;">${formatCurrency(registro.sdiMensual)}</td>
                         <td style="border: 1px solid #cbd5e1; padding: 6px;">${formatCurrency(registro.cuotaMensual)}</td>
                         <td style="border: 1px solid #cbd5e1; padding: 6px;">${formatCurrency(registro.acumulado)}</td>
                       </tr>
                     `).join('')}
                   </tbody>
                 </table>
              </div>
            </div>
          </div>

          <!-- Métricas adicionales -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
            <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 18px; font-weight: bold; color: #1e40af;">${estrategia.recuperacionMeses}</div>
              <div style="font-size: 12px; color: #1e40af;">Meses para recuperar inversión</div>
            </div>
            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 18px; font-weight: bold; color: #16a34a;">${estrategia.ROI}%</div>
              <div style="font-size: 12px; color: #16a34a;">ROI en 20 años</div>
            </div>
            <div style="background-color: #faf5ff; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 18px; font-weight: bold; color: #7c3aed;">${formatCurrency(estrategia.pensionConAguinaldo)}</div>
              <div style="font-size: 12px; color: #7c3aed;">Pensión con aguinaldo</div>
            </div>
          </div>

          <!-- Fechas importantes -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #1e293b; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
              📅 Cronograma
            </h2>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px;">
              <div style="margin-bottom: 15px;">
                <div style="font-weight: bold; color: #1e40af; margin-bottom: 5px;">Inicio de Modalidad 40</div>
                <div style="color: #64748b;">${formatDate(fechaInicioM40)}</div>
              </div>
              <div style="margin-bottom: 15px;">
                <div style="font-weight: bold; color: #16a34a; margin-bottom: 5px;">Finalización M40</div>
                <div style="color: #64748b;">${formatDate(fechaFinM40)}</div>
              </div>
              <div style="margin-bottom: 15px;">
                <div style="font-weight: bold; color: #dc2626; margin-bottom: 5px;">Inicio de Trámites</div>
                <div style="color: #64748b;">${formatDate(fechaTramite)}</div>
              </div>
              <div style="margin-bottom: 15px;">
                <div style="font-weight: bold; color: #7c2d12; margin-bottom: 5px;">Fecha de Jubilación</div>
                <div style="color: #64748b;">${formatDate(fechaJubilacion)}</div>
              </div>
            </div>
          </div>

          <!-- Pensión de viudez -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #1e293b; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">
              🛡️ Pensión de Viudez
            </h2>
            <div style="background-color: #faf5ff; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #7c3aed; margin-bottom: 10px;">
                ${formatCurrency(pensionViudez)}
              </div>
              <div style="color: #7c3aed; margin-bottom: 15px;">mensuales (90% de la pensión del titular)</div>
              <div style="font-size: 14px; color: #64748b;">
                Protección familiar garantizada en caso de fallecimiento
              </div>
            </div>
          </div>

          <!-- Información adicional -->
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <div style="font-weight: bold; color: #92400e; margin-bottom: 8px;">Información importante</div>
            <div style="font-size: 14px; color: #92400e;">
              • Los pagos mensuales se realizan durante ${estrategia.mesesM40} meses<br>
              • Cada pago mejora tu promedio salarial para el cálculo final de pensión<br>
              • Tu pensión aumentará 5% cada febrero debido a los incrementos del UMA<br>
              • Esta proyección incluye el cálculo de ISR actualizado
            </div>
          </div>
        </div>
      `
      
      // Agregar al DOM temporalmente
      testElement.style.position = 'absolute'
      testElement.style.left = '-9999px'
      testElement.style.top = '0'
      testElement.style.width = '800px'
      document.body.appendChild(testElement)
      
      console.log('📸 Capturando con html2canvas...')
      
      const canvas = await html2canvas(testElement, {
        scale: 2, // Mejor calidad
        useCORS: false,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: 800,
        height: testElement.scrollHeight,
        ignoreElements: (element: any) => {
          return element.tagName === 'STYLE' || 
                 element.tagName === 'LINK' || 
                 element.classList.contains('ignore-pdf')
        }
      })
      
      console.log('✅ Canvas generado exitosamente')
      
      // Remover elemento temporal
      document.body.removeChild(testElement)
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 190 // Un poco más pequeño que A4 para márgenes
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      // Si la imagen es muy alta, dividir en múltiples páginas
      const pageHeight = 277 // Altura de A4 en mm
      let heightLeft = imgHeight
      let position = 10 // Margen superior
      
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      // Agregar páginas adicionales si es necesario
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      const nombreArchivo = `Estrategia_${estrategia.estrategia}_${estrategia.umaElegida}UMA_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(nombreArchivo)
      
      console.log('🎉 PDF generado exitosamente')
      
    } catch (error: any) {
      console.error('❌ Error generando PDF:', error)
      console.error('🔍 Detalles del error:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      })
      alert('Error al generar el PDF. Revisa la consola para más detalles.')
    } finally {
      setGenerandoPDF(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-7xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Header de la estrategia */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              🎯 {estrategia.estrategia === "fijo" ? "Estrategia UMA Fijo" : "Estrategia UMA Progresivo"}
            </h1>
            <p className="text-blue-100">
              Nivel UMA: {estrategia.umaElegida} • {estrategia.mesesM40} meses en M40
            </p>
          </div>
          <div className="flex items-center gap-3">
            {debugCode && (
              <button
                onClick={guardarEstrategia}
                disabled={guardando || guardada}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  guardada 
                    ? 'bg-yellow-600 hover:bg-yellow-700' 
                    : 'bg-gray-600 hover:bg-gray-700'
                } ${guardando ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {guardando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Star className={`w-4 h-4 ${guardada ? 'fill-current' : ''}`} />
                    {guardada ? 'Guardada' : 'Guardar'}
                  </>
                )}
              </button>
            )}
            <button
              onClick={compartirEstrategia}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Compartir
            </button>
            <button
              onClick={generarPDF}
              disabled={generandoPDF}
              data-pdf-download
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {generandoPDF ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </>
              )}
            </button>
            <button
              onClick={onVolver}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              ← Volver
            </button>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="bg-white/10 p-4 rounded-lg">
             <div className="text-2xl font-bold">{formatCurrency(estrategia.pensionMensual)}</div>
             <div className="text-sm text-blue-100">
               <TooltipInteligente termino="Pensión mensual">
                 Pensión mensual
               </TooltipInteligente>
             </div>
           </div>
           <div className="bg-white/10 p-4 rounded-lg">
             <div className="text-2xl font-bold">{formatCurrency(isr.pensionNeta)}</div>
             <div className="text-sm text-blue-100">
               <TooltipInteligente termino="Pensión neta">
                 Pensión neta (después ISR)
               </TooltipInteligente>
             </div>
           </div>
           <div className="bg-white/10 p-4 rounded-lg">
             <div className="text-2xl font-bold">{formatCurrency(estrategia.inversionTotal)}</div>
             <div className="text-sm text-blue-100">
               <TooltipInteligente termino="Inversión total">
                 Inversión total
               </TooltipInteligente>
             </div>
           </div>
           <div className="bg-white/10 p-4 rounded-lg">
             <div className="text-2xl font-bold">{estrategia.ROI}%</div>
             <div className="text-sm text-blue-100">
               <TooltipInteligente termino="ROI">
                 ROI en 20 años
               </TooltipInteligente>
             </div>
           </div>
        </div>
      </div>

      {/* Información personalizada del familiar */}
      {(datosUsuario.nombreFamiliar || datosUsuario.edadActual || datosUsuario.edadJubilacion || datosUsuario.semanasCotizadas || datosUsuario.sdiActual || datosUsuario.salarioMensual || datosUsuario.estadoCivil || datosUsuario.aportacionPromedio) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Información Personalizada del Familiar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {datosUsuario.nombreFamiliar && (
              <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                <div className="text-sm text-blue-600 font-medium mb-1">👤 Nombre</div>
                <div className="font-semibold text-gray-900">{datosUsuario.nombreFamiliar}</div>
              </div>
            )}
            {datosUsuario.fechaNacimiento && (
              <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                <div className="text-sm text-blue-600 font-medium mb-1">🎂 Fecha de Nacimiento</div>
                <div className="font-semibold text-gray-900">{new Date(datosUsuario.fechaNacimiento).toLocaleDateString('es-MX')}</div>
              </div>
            )}
            {(datosUsuario.edadActual || datosUsuario.fechaNacimiento) && (
              <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                <div className="text-sm text-blue-600 font-medium mb-1">📅 Edad Actual</div>
                <div className="font-semibold text-gray-900">{datosUsuario.edadActual || calculateAge(datosUsuario.fechaNacimiento)} años</div>
              </div>
            )}
            {datosUsuario.edadJubilacion && (
              <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                <div className="text-sm text-blue-600 font-medium mb-1">🎯 Edad Jubilación</div>
                <div className="font-semibold text-gray-900">{datosUsuario.edadJubilacion} años</div>
              </div>
            )}
            {(datosUsuario.semanasCotizadas || datosUsuario.semanasPrevias) && (
              <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                <div className="text-sm text-blue-600 font-medium mb-1">📊 Semanas Cotizadas</div>
                <div className="font-semibold text-gray-900">{datosUsuario.semanasCotizadas || datosUsuario.semanasPrevias} semanas</div>
              </div>
            )}
            {(datosUsuario.salarioMensual || datosUsuario.sdiHistorico) && (
              <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                <div className="text-sm text-blue-600 font-medium mb-1">💰 Salario Mensual</div>
                <div className="font-semibold text-gray-900">{formatCurrency(datosUsuario.salarioMensual || (datosUsuario.sdiHistorico * 30.4))}</div>
              </div>
            )}
            {(datosUsuario.sdiActual || datosUsuario.sdiHistorico) && (
              <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                <div className="text-sm text-blue-600 font-medium mb-1">📈 SDI Actual</div>
                <div className="font-semibold text-gray-900">{formatCurrency(datosUsuario.sdiActual || datosUsuario.sdiHistorico)}</div>
              </div>
            )}
            {datosUsuario.estadoCivil && (
              <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                <div className="text-sm text-blue-600 font-medium mb-1">💍 Estado Civil</div>
                <div className="font-semibold text-gray-900 capitalize">{datosUsuario.estadoCivil}</div>
              </div>
            )}
            {(datosUsuario.aportacionPromedio || estrategia.inversionTotal) && (
              <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                <div className="text-sm text-blue-600 font-medium mb-1">💳 Aportación Promedio</div>
                <div className="font-semibold text-gray-900">{formatCurrency(datosUsuario.aportacionPromedio || (estrategia.inversionTotal / estrategia.mesesM40))}</div>
              </div>
            )}
          </div>
          {datosUsuario.fechaNacimiento && datosUsuario.edadJubilacion && (
            <div className="mt-4 p-4 bg-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-1">
                    🎯 Estrategia Personalizada
                  </h4>
                  <p className="text-sm text-blue-700">
                    Esta estrategia está calculada específicamente para <strong>{datosUsuario.nombreFamiliar}</strong> 
                    basada en su fecha de nacimiento ({new Date(datosUsuario.fechaNacimiento).toLocaleDateString('es-MX')}) 
                    y su edad objetivo de jubilación de <strong>{datosUsuario.edadJubilacion} años</strong>. 
                    Las fechas del cronograma están personalizadas para optimizar su pensión.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs de navegación */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setTabActivo(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  tabActivo === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenido de los tabs */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {tabActivo === "resumen" && (
            <TabResumen 
              key="tab-resumen"
              estrategia={estrategia} 
              isr={isr} 
              datosUsuario={datosUsuario}
              formatCurrency={formatCurrency}
            />
          )}
          {tabActivo === "pagos" && (
            <TabPagos 
              key="tab-pagos"
              estrategia={estrategia}
              formatCurrency={formatCurrency}
            />
          )}
          {tabActivo === "cronograma" && (
                          <TabCronograma
                key="tab-cronograma"
                fechaInicioM40={fechaInicioM40}
                fechaFinM40={fechaFinM40}
                fechaTramite={fechaTramite}
                fechaJubilacion={fechaJubilacion}
                mesesM40={estrategia.mesesM40}
                formatDate={formatDate}
                datosUsuario={datosUsuario}
              />
          )}
          {tabActivo === "proyeccion" && (
            <TabProyeccion 
              key="tab-proyeccion"
              proyeccion={proyeccion}
              formatCurrency={formatCurrency}
              datosUsuario={datosUsuario}
            />
          )}
          {tabActivo === "tramites" && (
            <TabTramites 
              key="tab-tramites"
              fechaTramite={fechaTramite}
              formatDate={formatDate}
            />
          )}
          {tabActivo === "viudez" && (
            <TabViudez 
              key="tab-viudez"
              pensionViudez={pensionViudez}
              formatCurrency={formatCurrency}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// Componentes de cada tab
function TabResumen({ estrategia, isr, datosUsuario, formatCurrency }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desglose de pensión */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Desglose de Pensión
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Pensión base:</span>
              <span className="font-semibold">{formatCurrency(estrategia.pensionMensual)}</span>
            </div>
                         <div className="flex justify-between">
               <span>
                 <TooltipInteligente termino="Factor edad">
                   Factor edad ({estrategia.factorEdad})
                 </TooltipInteligente>:
               </span>
               <span className="font-semibold">{formatCurrency(estrategia.conFactorEdad)}</span>
             </div>
             <div className="flex justify-between">
               <span>
                 <TooltipInteligente termino="Factor Fox">
                   Factor Fox (11%)
                 </TooltipInteligente>:
               </span>
               <span className="font-semibold">{formatCurrency(estrategia.conLeyFox)}</span>
             </div>
             <div className="flex justify-between">
               <span>
                 <TooltipInteligente termino="Asignaciones familiares">
                   Asignaciones familiares
                 </TooltipInteligente>:
               </span>
               <span className="font-semibold">{formatCurrency(estrategia.conDependiente)}</span>
             </div>
            <hr className="my-3" />
            <div className="flex justify-between text-lg font-bold">
              <span>Pensión final:</span>
              <span className="text-green-600">{formatCurrency(estrategia.pensionMensual)}</span>
            </div>
          </div>
        </div>

        {/* Cálculo de ISR */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-red-600" />
            Cálculo de ISR
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Pensión bruta:</span>
              <span className="font-semibold">{formatCurrency(isr.pensionBruta)}</span>
            </div>
                         <div className="flex justify-between">
               <span>
                 <TooltipInteligente termino="Umbral exento">
                   Umbral exento
                 </TooltipInteligente>:
               </span>
               <span className="font-semibold">{formatCurrency(isr.umbralExento)}</span>
             </div>
             <div className="flex justify-between">
               <span>
                 <TooltipInteligente termino="Base gravable">
                   Base gravable
                 </TooltipInteligente>:
               </span>
               <span className="font-semibold">{formatCurrency(isr.baseGravable)}</span>
             </div>
            <div className="flex justify-between">
              <span>ISR mensual:</span>
              <span className="font-semibold text-red-600">-{formatCurrency(isr.isrMensual)}</span>
            </div>
            <hr className="my-3" />
            <div className="flex justify-between text-lg font-bold">
              <span>Pensión neta:</span>
              <span className="text-green-600">{formatCurrency(isr.pensionNeta)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{estrategia.recuperacionMeses}</div>
          <div className="text-sm text-blue-700">Meses para recuperar inversión</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{estrategia.ROI}%</div>
          <div className="text-sm text-green-700">ROI en 20 años</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{formatCurrency(estrategia.pensionConAguinaldo)}</div>
          <div className="text-sm text-purple-700">Pensión con aguinaldo</div>
        </div>
      </div>
    </motion.div>
  )
}

function TabPagos({ estrategia, formatCurrency }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-yellow-800 mb-1">
              Información importante
            </h4>
            <p className="text-sm text-yellow-700">
              Los pagos mensuales se realizan durante {estrategia.mesesM40} meses. 
              Cada pago mejora tu promedio salarial para el cálculo final de pensión.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-3 text-left">Mes</th>
              <th className="border border-gray-300 p-3 text-left">Fecha</th>
              <th className="border border-gray-300 p-3 text-left">UMA</th>
              <th className="border border-gray-300 p-3 text-left">Tasa M40</th>
              <th className="border border-gray-300 p-3 text-left">SDI Mensual</th>
              <th className="border border-gray-300 p-3 text-left">Cuota Mensual</th>
              <th className="border border-gray-300 p-3 text-left">Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {estrategia.registros?.slice(0, 12).map((registro: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-3">{index + 1}</td>
                <td className="border border-gray-300 p-3">{registro.fecha}</td>
                <td className="border border-gray-300 p-3">{registro.uma}</td>
                <td className="border border-gray-300 p-3">{registro.tasaM40 ? `${registro.tasaM40.toFixed(2)}%` : 'N/A'}</td>
                <td className="border border-gray-300 p-3">{formatCurrency(registro.sdiMensual)}</td>
                <td className="border border-gray-300 p-3">{formatCurrency(registro.cuotaMensual)}</td>
                <td className="border border-gray-300 p-3">{formatCurrency(registro.acumulado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-center text-sm text-gray-600">
        Mostrando los primeros 12 meses. Total de {estrategia.mesesM40} meses.
      </div>
    </motion.div>
  )
}

function TabCronograma({ fechaInicioM40, fechaFinM40, fechaTramite, fechaJubilacion, mesesM40, formatDate, datosUsuario }: any) {
  // Función para calcular edad en una fecha específica
  const calcularEdadEnFecha = (fecha: Date) => {
    if (!datosUsuario.fechaNacimiento) return null
    const fechaNacimiento = new Date(datosUsuario.fechaNacimiento)
    let edad = fecha.getFullYear() - fechaNacimiento.getFullYear()
    const monthDiff = fecha.getMonth() - fechaNacimiento.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && fecha.getDate() < fechaNacimiento.getDate())) {
      edad--
    }
    return edad
  }

  // Función para formatear fecha sin días
  const formatDateMonthYear = (date: Date) => {
    return date.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'long'
    })
  }

  // Calcular edades
  const edadInicioM40 = calcularEdadEnFecha(fechaInicioM40)
  const edadFinM40 = calcularEdadEnFecha(fechaFinM40)
  const edadTramite = calcularEdadEnFecha(fechaTramite)
  const edadJubilacion = calcularEdadEnFecha(fechaJubilacion)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-800 mb-1">
              Cronograma Personalizado de Jubilación
            </h4>
            <p className="text-sm text-blue-700">
              Este cronograma está basado en tu fecha de nacimiento ({datosUsuario.fechaNacimiento ? new Date(datosUsuario.fechaNacimiento).toLocaleDateString('es-MX') : 'No especificada'}) 
              y tu edad objetivo de jubilación ({datosUsuario.edadJubilacion || datosUsuario.edad} años).
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-200"></div>
        
        <div className="space-y-8">
          {/* Inicio M40 */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
              1
            </div>
            <div className="flex-1 bg-blue-50 p-4 rounded-lg">
              <h4 className="font-bold text-blue-800 mb-2">Inicio de Modalidad 40</h4>
              <p className="text-blue-700 mb-2 font-semibold">{formatDateMonthYear(fechaInicioM40)}</p>
              {edadInicioM40 && (
                <p className="text-blue-600 mb-2 text-sm">
                  <span className="font-semibold">Edad:</span> {edadInicioM40} años
                </p>
              )}
              <p className="text-sm text-blue-600">
                Comienzas a realizar pagos voluntarios para mejorar tu promedio salarial. 
                Esta fecha fue elegida para optimizar tu estrategia de jubilación.
              </p>
            </div>
          </div>

          {/* Durante M40 */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
              2
            </div>
            <div className="flex-1 bg-green-50 p-4 rounded-lg">
              <h4 className="font-bold text-green-800 mb-2">Período de Pagos</h4>
              <p className="text-green-700 mb-2 font-semibold">{mesesM40} meses de contribuciones</p>
              <p className="text-sm text-green-600">
                Realizas pagos mensuales durante {mesesM40} meses para mejorar tu promedio salarial. 
                Este período fue calculado para maximizar tu pensión final.
              </p>
            </div>
          </div>

          {/* Fin M40 */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
              3
            </div>
            <div className="flex-1 bg-purple-50 p-4 rounded-lg">
              <h4 className="font-bold text-purple-800 mb-2">Finalización M40</h4>
              <p className="text-purple-700 mb-2 font-semibold">{formatDateMonthYear(fechaFinM40)}</p>
              {edadFinM40 && (
                <p className="text-purple-600 mb-2 text-sm">
                  <span className="font-semibold">Edad:</span> {edadFinM40} años
                </p>
              )}
              <p className="text-sm text-purple-600">
                Completas tu período de Modalidad 40. Tu promedio salarial está optimizado 
                y listo para el cálculo de tu pensión.
              </p>
            </div>
          </div>

          {/* Trámites */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
              4
            </div>
            <div className="flex-1 bg-orange-50 p-4 rounded-lg">
              <h4 className="font-bold text-orange-800 mb-2">Inicio de Trámites</h4>
              <p className="text-orange-700 mb-2 font-semibold">{formatDateMonthYear(fechaTramite)}</p>
              {edadTramite && (
                <p className="text-orange-600 mb-2 text-sm">
                  <span className="font-semibold">Edad:</span> {edadTramite} años
                </p>
              )}
              <p className="text-sm text-orange-600">
                Comienzas el proceso de trámites para tu jubilación con el IMSS. 
                Esta fecha es <strong>1 mes antes de tu edad objetivo de jubilación</strong> para 
                asegurar que todo esté listo cuando cumplas {datosUsuario.edadJubilacion || datosUsuario.edad} años.
              </p>
            </div>
          </div>

          {/* Jubilación */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
              5
            </div>
            <div className="flex-1 bg-red-50 p-4 rounded-lg">
              <h4 className="font-bold text-red-800 mb-2">Fecha de Jubilación</h4>
              <p className="text-red-700 mb-2 font-semibold">{formatDateMonthYear(fechaJubilacion)}</p>
              {edadJubilacion && (
                <p className="text-red-600 mb-2 text-sm">
                  <span className="font-semibold">Edad:</span> {edadJubilacion} años
                </p>
              )}
              <p className="text-sm text-red-600">
                Comienzas a recibir tu pensión mensual del IMSS. Esta fecha corresponde a 
                <strong> tu edad objetivo de jubilación ({datosUsuario.edadJubilacion || datosUsuario.edad} años)</strong>, 
                calculada desde tu fecha de nacimiento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function TabProyeccion({ proyeccion, formatCurrency, datosUsuario }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-800 mb-1">
              Proyección con Incrementos Anuales
            </h4>
            <p className="text-sm text-blue-700">
              Tu pensión aumentará 5% cada febrero debido a los incrementos del UMA. 
              Esta proyección comienza en el año {proyeccion[0]?.año || 'N/A'} 
              {datosUsuario.edadJubilacion && ` cuando cumplas ${datosUsuario.edadJubilacion} años`} 
              e incluye el cálculo de ISR actualizado.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-3 text-left">Año</th>
              <th className="border border-gray-300 p-3 text-left">Pensión Bruta</th>
              <th className="border border-gray-300 p-3 text-left">Pensión Neta</th>
              <th className="border border-gray-300 p-3 text-left">ISR Mensual</th>
              <th className="border border-gray-300 p-3 text-left">Incremento</th>
              <th className="border border-gray-300 p-3 text-left">Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {proyeccion.slice(0, 10).map((item: any) => (
              <tr key={item.año} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-3 font-semibold">{item.año}</td>
                <td className="border border-gray-300 p-3">{formatCurrency(item.pensionBruta)}</td>
                <td className="border border-gray-300 p-3">{formatCurrency(item.pensionNeta)}</td>
                <td className="border border-gray-300 p-3">{formatCurrency(item.isrMensual)}</td>
                <td className="border border-gray-300 p-3">+{item.incremento}%</td>
                <td className="border border-gray-300 p-3">+{item.acumulado}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-center text-sm text-gray-600">
        Mostrando los primeros 10 años. Proyección completa de 20 años disponible.
      </div>
    </motion.div>
  )
}

function TabTramites({ fechaTramite, formatDate }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-green-800 mb-1">
              Checklist de Trámites
            </h4>
            <p className="text-sm text-green-700">
              Fecha recomendada para iniciar trámites: {formatDate(fechaTramite)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">Documentos Requeridos</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Identificación oficial vigente</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Comprobante de domicilio</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Acta de nacimiento</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Constancia de semanas cotizadas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Comprobantes de pagos M40</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">Pasos del Trámite</h3>
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-lg border">
              <div className="font-semibold text-blue-600">1. Cita previa</div>
              <div className="text-sm text-gray-600">Agenda cita en el IMSS</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="font-semibold text-blue-600">2. Entrega de documentos</div>
              <div className="text-sm text-gray-600">Presenta toda la documentación</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="font-semibold text-blue-600">3. Dictamen médico</div>
              <div className="text-sm text-gray-600">Evaluación de capacidad laboral</div>
            </div>
            <div className="bg-white p-3 rounded-lg border">
              <div className="font-semibold text-blue-600">4. Resolución</div>
              <div className="text-sm text-gray-600">Aprobación y monto de pensión</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function TabViudez({ pensionViudez, formatCurrency }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg text-center">
        <Shield className="w-16 h-16 text-purple-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-purple-800 mb-2">
          Protección Familiar
        </h3>
                 <p className="text-purple-700 mb-4">
           Tu cónyuge recibirá el 90% de tu pensión en caso de fallecimiento
         </p>
         <p className="text-sm text-purple-600 mb-4">
           <TooltipInteligente termino="Pensión de viudez">
             Protección familiar garantizada
           </TooltipInteligente>
         </p>
        <div className="text-3xl font-bold text-purple-600">
          {formatCurrency(pensionViudez)}
        </div>
        <div className="text-sm text-purple-600 mt-2">mensuales</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h4 className="font-bold text-gray-800 mb-4">Beneficios de la Pensión de Viudez</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• 90% de la pensión del titular</li>
            <li>• Pago mensual garantizado</li>
            <li>• Incrementos anuales del 5%</li>
            <li>• Protección financiera para la familia</li>
            <li>• Sin límite de edad para el cónyuge</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h4 className="font-bold text-gray-800 mb-4">Requisitos</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Matrimonio vigente al momento del fallecimiento</li>
            <li>• Mínimo 5 años de matrimonio</li>
            <li>• No tener ingresos superiores a 2 SMG</li>
            <li>• No estar pensionado por otra institución</li>
            <li>• Presentar documentación de matrimonio</li>
          </ul>
        </div>
      </div>
    </motion.div>
  )
}
