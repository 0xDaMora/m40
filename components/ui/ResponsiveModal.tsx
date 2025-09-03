"use client"

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface ResponsiveModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'
  showCloseButton?: boolean
  className?: string
}

export function ResponsiveModal({ 
  isOpen, 
  onClose, 
  children, 
  maxWidth = '2xl',
  showCloseButton = true,
  className = ""
}: ResponsiveModalProps) {
  if (!isOpen) return null

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl'
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4"
    >
      <motion.div
        initial={{ y: -50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -50, opacity: 0, scale: 0.95 }}
        className={`relative w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] rounded-2xl bg-white shadow-xl overflow-hidden ${className}`}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Contenido con scroll */}
        <div className="overflow-y-auto max-h-[90vh]">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}
