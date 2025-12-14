"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"

interface RangeSliderProps {
  min: number
  max: number
  value: { min: number; max: number }
  onChange: (value: { min: number; max: number }) => void
  step?: number
  formatValue?: (value: number) => string
  className?: string
}

export function RangeSlider({
  min,
  max,
  value,
  onChange,
  step = 100,
  formatValue = (val) => `$${val.toLocaleString()}`,
  className = ""
}: RangeSliderProps) {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  // Función para calcular el valor basado en la posición
  const calculateValueFromPosition = useCallback((clientX: number) => {
    if (!sliderRef.current) return min
    
    const rect = sliderRef.current.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const newValue = Math.round((min + (max - min) * percentage) / step) * step
    
    return Math.max(min, Math.min(max, newValue))
  }, [min, max, step])

  // Función para manejar el inicio del arrastre
  const handleStart = useCallback((clientX: number, type: 'min' | 'max') => {
    setIsDragging(type)
  }, [])

  // Función para manejar el movimiento del arrastre
  const handleMove = useCallback((clientX: number) => {
    if (!isDragging) return

    const newValue = calculateValueFromPosition(clientX)

    if (isDragging === 'min') {
      const newMin = Math.max(min, Math.min(value.max - step, newValue))
      onChange({ min: newMin, max: value.max })
    } else {
      const newMax = Math.min(max, Math.max(value.min + step, newValue))
      onChange({ min: value.min, max: newMax })
    }
  }, [isDragging, value, min, max, step, onChange, calculateValueFromPosition])

  // Función para manejar el fin del arrastre
  const handleEnd = useCallback(() => {
    setIsDragging(null)
  }, [])

  // Eventos de mouse (PC)
  const handleMouseDown = (e: React.MouseEvent, type: 'min' | 'max') => {
    e.preventDefault()
    handleStart(e.clientX, type)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX)
  }, [handleMove])

  const handleMouseUp = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // Eventos táctiles (Móvil)
  const handleTouchStart = (e: React.TouchEvent, type: 'min' | 'max') => {
    e.preventDefault()
    const touch = e.touches[0]
    handleStart(touch.clientX, type)
  }

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    handleMove(touch.clientX)
  }, [handleMove])

  const handleTouchEnd = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  // Eventos de click para establecer valores
  const handleSliderClick = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const rect = sliderRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const clickValue = calculateValueFromPosition(clientX)
    
    // Determinar cuál thumb está más cerca del click
    if (Math.abs(clickValue - value.min) < Math.abs(clickValue - value.max)) {
      const newMin = Math.max(min, Math.min(value.max - step, clickValue))
      onChange({ min: newMin, max: value.max })
    } else {
      const newMax = Math.min(max, Math.max(value.min + step, clickValue))
      onChange({ min: value.min, max: newMax })
    }
  }

  // Agregar/remover event listeners
  useEffect(() => {
    if (isDragging) {
      // Eventos de mouse
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      // Eventos táctiles
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  const minPercentage = ((value.min - min) / (max - min)) * 100
  const maxPercentage = ((value.max - min) / (max - min)) * 100

  return (
    <div className={`w-full max-w-full ${className}`}>
      {/* Valores actuales - más compacto */}
      <div className="flex justify-between text-xs text-gray-600 mb-2">
        <span className="font-medium truncate text-xs">{formatValue(value.min)}</span>
        <span className="font-medium truncate ml-2 text-xs">{formatValue(value.max)}</span>
      </div>
      
      {/* Slider principal - más pequeño */}
      <div
        ref={sliderRef}
        className="relative h-6 bg-gray-200 rounded-lg cursor-pointer touch-none w-full max-w-full"
        onClick={handleSliderClick}
        onTouchStart={handleSliderClick}
      >
        {/* Track de fondo */}
        <div className="absolute inset-0 bg-gray-200 rounded-lg" />
        
        {/* Track activo */}
        <div
          className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg"
          style={{
            left: `${minPercentage}%`,
            width: `${maxPercentage - minPercentage}%`
          }}
        />
        
        {/* Thumb mínimo - más pequeño */}
        <motion.div
          className="absolute top-1/2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-grab active:cursor-grabbing transform -translate-y-1/2 -translate-x-1/2 shadow-md touch-none"
          style={{ left: `${minPercentage}%` }}
          onMouseDown={(e) => handleMouseDown(e, 'min')}
          onTouchStart={(e) => handleTouchStart(e, 'min')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
        />
        
        {/* Thumb máximo - más pequeño */}
        <motion.div
          className="absolute top-1/2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-grab active:cursor-grabbing transform -translate-y-1/2 -translate-x-1/2 shadow-md touch-none"
          style={{ left: `${maxPercentage}%` }}
          onMouseDown={(e) => handleMouseDown(e, 'max')}
          onTouchStart={(e) => handleTouchStart(e, 'max')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
        />
      </div>
      
      {/* Valores mínimo y máximo - más compacto, opcional */}
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span className="truncate">Mín: {formatValue(min)}</span>
        <span className="truncate ml-1">Máx: {formatValue(max)}</span>
      </div>
    </div>
  )
}
