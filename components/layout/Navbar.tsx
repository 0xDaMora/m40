"use client"

import Link from "next/link"
import { User, CreditCard, HelpCircle, LogIn } from "lucide-react"
import { LoginButton } from "@/components/auth/LoginButton"

export function Navbar() {
  return (
    <nav className="w-full bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-blue-700 text-white font-bold text-lg px-3 py-1 rounded-lg">
            M40
          </div>
          <span className="font-bold text-gray-800 text-lg hidden sm:block">
            Calculadora de Pensiones
          </span>
        </Link>

        {/* Navigation Links - Desktop */}
        <div className="hidden lg:flex items-center space-x-6">
          <Link href="#precios" className="text-gray-700 hover:text-blue-700 font-medium flex items-center gap-1">
            <CreditCard className="w-4 h-4" />
            Precios
          </Link>
          <Link href="#como-funciona" className="text-gray-700 hover:text-blue-700 font-medium">
            ¿Cómo funciona?
          </Link>
          <Link href="#soporte" className="text-gray-700 hover:text-blue-700 font-medium flex items-center gap-1">
            <HelpCircle className="w-4 h-4" />
            Soporte
          </Link>
        </div>

        {/* Auth Section */}
        <div className="flex items-center gap-3">
          <LoginButton />
        </div>
      </div>

      {/* Mobile Menu - TODO: implementar después */}
    </nav>
  )
}
