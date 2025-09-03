"use client"

import { ReactNode } from 'react'

interface ModalContentProps {
  children: ReactNode
  className?: string
}

export function ModalContent({ children, className = "" }: ModalContentProps) {
  return (
    <div className={`p-4 sm:p-6 md:p-8 ${className}`}>
      {children}
    </div>
  )
}
