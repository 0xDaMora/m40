"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface SimulatorContextType {
  isSimulatorActive: boolean
  setIsSimulatorActive: (active: boolean) => void
}

const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined)

export function SimulatorProvider({ children }: { children: ReactNode }) {
  const [isSimulatorActive, setIsSimulatorActive] = useState(false)

  return (
    <SimulatorContext.Provider value={{ isSimulatorActive, setIsSimulatorActive }}>
      {children}
    </SimulatorContext.Provider>
  )
}

export function useSimulator() {
  const context = useContext(SimulatorContext)
  if (context === undefined) {
    throw new Error('useSimulator must be used within a SimulatorProvider')
  }
  return context
}
