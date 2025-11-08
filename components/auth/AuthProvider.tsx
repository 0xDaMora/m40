"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider
      refetchInterval={0} // Deshabilitar polling automático para evitar loops
      refetchOnWindowFocus={false} // Deshabilitar refetch al cambiar de ventana
    >
      {children}
    </SessionProvider>
  )
}
