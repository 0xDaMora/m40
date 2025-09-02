/**
 * Componente base para todos los steps del HeroOnboard
 */

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface BaseStepProps {
  title: string
  description?: string
  children: React.ReactNode
  onNext?: () => void
  onBack?: () => void
  canProceed?: boolean
  showBackButton?: boolean
  showNextButton?: boolean
  nextButtonText?: string
  backButtonText?: string
  className?: string
}

export default function BaseStep({
  title,
  description,
  children,
  onNext,
  onBack,
  canProceed = true,
  showBackButton = true,
  showNextButton = true,
  nextButtonText = "Continuar",
  backButtonText = "Anterior",
  className = ""
}: BaseStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`max-w-2xl mx-auto p-6 ${className}`}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {title}
        </h2>
        {description && (
          <p className="text-lg text-gray-600">
            {description}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="mb-8">
        {children}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        {showBackButton && onBack && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {backButtonText}
          </motion.button>
        )}

        {showNextButton && onNext && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNext}
            disabled={!canProceed}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              canProceed
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {nextButtonText}
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
