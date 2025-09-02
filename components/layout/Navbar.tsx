"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { motion } from "framer-motion"
import { Calculator, Home, User, Menu, X, Crown, Star, LogOut } from "lucide-react"
import PremiumModal from "../PremiumModal"
import { LoginModal } from "../auth/LoginModal"

export function Navbar() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <>
      <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y nombre */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M40</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Modalidad 40</span>
            </Link>

            {/* Navegación desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                href="/" 
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Inicio</span>
              </Link>
              
              <Link 
                href="/simulador" 
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Calculator className="w-4 h-4" />
                <span>Simulador M40</span>
              </Link>

              {session && (
                <Link 
                  href="/dashboard" 
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
              )}
            </div>

            {/* Botón de login y menú móvil */}
            <div className="flex items-center space-x-4">
              {session ? (
                <div className="flex items-center space-x-3">
                  {/* Botón Premium (solo si no es premium) */}
                  {(!session.user?.subscription || session.user.subscription !== 'premium') && (
                    <button 
                      onClick={() => setShowPremiumModal(true)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                      <Crown className="w-4 h-4" />
                      <span className="hidden sm:inline">Premium</span>
                    </button>
                  )}
                  
                                     {/* Información del usuario */}
                   <div className="flex items-center space-x-2">
                     <Link 
                       href="/dashboard" 
                       className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                     >
                       <User className="w-4 h-4" />
                       <span className="hidden sm:inline">{session.user?.name || 'Usuario'}</span>
                     </Link>
                     
                     {/* Badge del plan */}
                     {session.user?.subscription && (
                       <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                         session.user.subscription === 'premium' 
                           ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border border-purple-200' 
                           : 'bg-blue-100 text-blue-800 border border-blue-200'
                       }`}>
                         {session.user.subscription === 'premium' ? (
                           <div className="flex items-center gap-1">
                             <Crown className="w-3 h-3" />
                             <span>Premium</span>
                           </div>
                         ) : (
                           <div className="flex items-center gap-1">
                             <Star className="w-3 h-3" />
                             <span>Básico</span>
                           </div>
                         )}
                       </div>
                     )}
                     
                     {/* Botón de logout */}
                     <button
                       onClick={() => signOut({ callbackUrl: '/' })}
                       className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                       title="Cerrar sesión"
                     >
                       <LogOut className="w-4 h-4" />
                       <span className="hidden sm:inline">Salir</span>
                     </button>
                   </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  {/* Botón Premium para usuarios no logueados */}
                  <button 
                    onClick={() => setShowPremiumModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    <span className="hidden sm:inline">Premium</span>
                  </button>
                  
                                  <button 
                  onClick={() => setShowLoginModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Iniciar Sesión
                </button>
                </div>
              )}
              
              {/* Botón de menú móvil */}
              <button
                onClick={toggleMenu}
                className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Menú móvil */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 py-4"
            >
              <div className="flex flex-col space-y-4">
                <Link 
                  href="/" 
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home className="w-4 h-4" />
                  <span>Inicio</span>
                </Link>
                
                <Link 
                  href="/simulador" 
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Calculator className="w-4 h-4" />
                  <span>Simulador M40</span>
                </Link>

                {session && (
                  <>
                    <Link 
                      href="/dashboard" 
                      className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                    
                                                              {/* Botón Premium en menú móvil */}
                     {(!session.user?.subscription || session.user.subscription !== 'premium') && (
                       <button 
                         onClick={() => {
                           setShowPremiumModal(true)
                           setIsMenuOpen(false)
                         }}
                         className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors"
                       >
                         <Crown className="w-4 h-4" />
                         <span>Plan Premium</span>
                       </button>
                     )}
                     
                     {/* Botón de logout en menú móvil */}
                     <button 
                       onClick={() => {
                         signOut({ callbackUrl: '/' })
                         setIsMenuOpen(false)
                       }}
                       className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
                     >
                       <LogOut className="w-4 h-4" />
                       <span>Cerrar sesión</span>
                     </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Modal Premium */}
      <PremiumModal 
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />

      {/* Modal Login */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false)
          // Recargar la página para actualizar el estado de la sesión
          window.location.reload()
        }}
      />
    </>
  )
}
