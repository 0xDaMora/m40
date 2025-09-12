/**
 * EJEMPLO DE USO - EstrategiaDetalladaTramites
 * 
 * Este archivo muestra cómo usar el componente actualizado con la línea de tiempo
 * y los tutoriales integrados.
 */

import React from "react"
import EstrategiaDetalladaTramites from "./EstrategiaDetalladaTramites"

// Ejemplo de datos de una estrategia
const ejemploEstrategia = {
  fechaInicio: new Date('2024-01-15'),
  fechaJubilacion: new Date('2029-01-15'),
  mesesM40: 60, // 5 años
  esProgresivo: true,
  registros: [
    {
      fecha: '2024-01-15',
      uma: 108.57,
      tasaM40: 0.25,
      sdiMensual: 5000,
      cuotaMensual: 1250,
      acumulado: 1250
    },
    {
      fecha: '2024-02-15',
      uma: 108.57,
      tasaM40: 0.25,
      sdiMensual: 5000,
      cuotaMensual: 1250,
      acumulado: 2500
    },
    // ... más registros mensuales
  ]
}

// Funciones de formateo
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
    currency: 'MXN'
  }).format(amount)
}

export default function EjemploUso() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Ejemplo de Línea de Tiempo de Trámites
      </h1>
      
      <EstrategiaDetalladaTramites
        fechaTramite={ejemploEstrategia.fechaInicio}
        formatDate={formatDate}
        fechaInicio={ejemploEstrategia.fechaInicio}
        fechaJubilacion={ejemploEstrategia.fechaJubilacion}
        mesesM40={ejemploEstrategia.mesesM40}
        registros={ejemploEstrategia.registros}
        esProgresivo={ejemploEstrategia.esProgresivo}
        formatCurrency={formatCurrency}
      />
    </div>
  )
}

/**
 * CARACTERÍSTICAS IMPLEMENTADAS:
 * 
 * ✅ Línea de tiempo horizontal con Recharts
 * ✅ Pagos mensuales con colores:
 *    - Verde: Pagos normales
 *    - Rojo: No pagar (Dic/Ene en progresivo)
 *    - Amarillo: Reingreso (Feb en progresivo)
 * ✅ Scroll horizontal optimizado para móvil
 * ✅ 5 tutoriales independientes con navegación
 * ✅ Lógica progresiva automática
 * ✅ Cálculo de fechas de baja por mora
 * ✅ Integración completa con datos de estrategia
 * 
 * TUTORIALES DISPONIBLES:
 * 1. Darse de Alta (4 páginas)
 * 2. Realizar Pagos (5 páginas)
 * 3. Baja por Mora (5 páginas) - Solo si es progresivo
 * 4. Solicitar Jubilación (5 páginas)
 * 5. Solicitar AFORE (5 páginas)
 * 
 * FUNCIONALIDADES:
 * - Botones Siguiente/Anterior en tutoriales
 * - Barra de progreso visual
 * - Se cierran automáticamente al finalizar
 * - Contenido manual (no editable)
 * - Links a videos cuando es necesario
 * - Responsive design
 */
