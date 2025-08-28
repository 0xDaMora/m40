"use client"

import { useState, useEffect, useRef } from "react"
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

  const handleMouseDown = (e: React.MouseEvent, type: 'min' | 'max') => {
    e.preventDefault()
    setIsDragging(type)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newValue = Math.round((min + (max - min) * percentage) / step) * step

    if (isDragging === 'min') {
      const newMin = Math.max(min, Math.min(value.max - step, newValue))
      onChange({ min: newMin, max: value.max })
    } else {
      const newMax = Math.min(max, Math.max(value.min + step, newValue))
      onChange({ min: value.min, max: newMax })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(null)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, value])

  const minPercentage = ((value.min - min) / (max - min)) * 100
  const maxPercentage = ((value.max - min) / (max - min)) * 100

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>{formatValue(value.min)}</span>
        <span>{formatValue(value.max)}</span>
      </div>
      
      <div
        ref={sliderRef}
        className="relative h-6 bg-gray-200 rounded-lg cursor-pointer"
        onMouseDown={(e) => {
          const rect = sliderRef.current?.getBoundingClientRect()
          if (!rect) return
          
          const percentage = (e.clientX - rect.left) / rect.width
          const clickValue = min + (max - min) * percentage
          
          if (Math.abs(clickValue - value.min) < Math.abs(clickValue - value.max)) {
            handleMouseDown(e, 'min')
          } else {
            handleMouseDown(e, 'max')
          }
        }}
      >
        {/* Track de fondo */}
        <div className="absolute inset-0 bg-gray-200 rounded-lg" />
        
        {/* Track activo */}
        <div
          className="absolute h-full bg-blue-500 rounded-lg"
          style={{
            left: `${minPercentage}%`,
            width: `${maxPercentage - minPercentage}%`
          }}
        />
        
        {/* Thumb mínimo */}
        <motion.div
          className="absolute top-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-grab active:cursor-grabbing transform -translate-y-1/2 -translate-x-1/2 shadow-lg"
          style={{ left: `${minPercentage}%` }}
          onMouseDown={(e) => handleMouseDown(e, 'min')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        />
        
        {/* Thumb máximo */}
        <motion.div
          className="absolute top-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-grab active:cursor-grabbing transform -translate-y-1/2 -translate-x-1/2 shadow-lg"
          style={{ left: `${maxPercentage}%` }}
          onMouseDown={(e) => handleMouseDown(e, 'max')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Mín: {formatValue(min)}</span>
        <span>Máx: {formatValue(max)}</span>
      </div>
    </div>
  )
}
