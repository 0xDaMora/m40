"use client"

import { useSession, signOut } from "next-auth/react"
import { useState } from "react"

export function useAuth() {
  const { data: session, status } = useSession()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const isAuthenticated = status === "authenticated"
  const isLoading = status === "loading"

  const openLoginModal = () => setIsLoginModalOpen(true)
  const closeLoginModal = () => setIsLoginModalOpen(false)

  const logout = async () => {
    await signOut({ callbackUrl: "/" })
  }

  return {
    session,
    isAuthenticated,
    isLoading,
    isLoginModalOpen,
    openLoginModal,
    closeLoginModal,
    logout,
  }
}
