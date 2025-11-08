"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
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
      <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y nombre - Responsive */}
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                <svg 
                  width="32" 
                  height="32" 
                  viewBox="0 0 32 32" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8"
                >
                  {/* Fondo circular azul */}
                  <circle cx="16" cy="16" r="16" fill="#2563eb"/>
                  
                  {/* Texto M40 en blanco */}
                  <text 
                    x="16" 
                    y="22" 
                    fontFamily="Arial, sans-serif" 
                    fontSize="14" 
                    fontWeight="bold" 
                    textAnchor="middle" 
                    fill="white"
                  >
                    M40
                  </text>
                  
                  {/* Pequeño acento dorado */}
                  <circle cx="24" cy="8" r="3" fill="#f59e0b"/>
                </svg>
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900 hidden sm:block">Modalidad 40</span>
              <span className="text-lg font-bold text-gray-900 sm:hidden">M40</span>
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
            <div className="flex items-center space-x-2 sm:space-x-4">
              {session ? (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {/* Botón Premium (solo si no es premium) */}
                  {(!session.user?.subscription || session.user.subscription !== 'premium') && (
                    <button 
                      onClick={() => setShowPremiumModal(true)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2 text-sm sm:text-base"
                    >
                      <Crown className="w-4 h-4" />
                      <span className="hidden sm:inline">Premium</span>
                    </button>
                  )}
                  
                  {/* Información del usuario - Nuevo diseño móvil */}
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    {/* En móvil: solo icono del usuario con diferenciador de color, al presionarlo abre menú */}
                    <div className="md:hidden">
                      <button
                        onClick={toggleMenu}
                        className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 hover:scale-105 ${
                          session.user?.subscription === 'premium'
                            ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 hover:from-purple-200 hover:to-blue-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                        aria-label="Abrir menú de usuario"
                      >
                        <User className="w-5 h-5" />
                      </button>
                    </div>

                    {/* En desktop: diseño original completo */}
                    <div className="hidden md:flex items-center space-x-2">
                      <Link 
                        href="/dashboard" 
                        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-gray-50"
                      >
                        <User className="w-4 h-4" />
                        <span>{session.user?.name || 'Usuario'}</span>
                      </Link>
                      
                      {/* Badge del plan - Solo en desktop */}
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
                      
                      {/* Botón de logout - Solo en desktop */}
                      <button
                        onClick={() => signOut({ callbackUrl: window.location.origin })}
                        className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                        title="Cerrar sesión"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Salir</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {/* Botón Premium para usuarios no logueados */}
                  <button 
                    onClick={() => setShowPremiumModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Crown className="w-4 h-4" />
                    <span className="hidden sm:inline">Premium</span>
                  </button>
                  
                  <button 
                    onClick={() => setShowLoginModal(true)}
                    className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    <span className="hidden sm:inline">Iniciar Sesión</span>
                    <span className="sm:hidden">Login</span>
                  </button>
                </div>
              )}
              
              {/* Botón de menú móvil - Solo para usuarios no logueados */}
              {!session && (
                <button
                  onClick={toggleMenu}
                  className="md:hidden p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 active:scale-95"
                  aria-label="Abrir menú"
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              )}
            </div>
          </div>

          {/* Menú móvil mejorado */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="md:hidden border-t border-gray-200 bg-white"
              >
                <div className="py-6 px-4 space-y-4">
                  {/* Enlaces principales */}
                  <div className="space-y-3">
                    <Link 
                      href="/" 
                      className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 transition-colors p-3 rounded-lg hover:bg-blue-50 group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Home className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="font-medium">Inicio</span>
                        <p className="text-sm text-gray-500">Página principal</p>
                      </div>
                    </Link>
                    
                    <Link 
                      href="/simulador" 
                      className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 transition-colors p-3 rounded-lg hover:bg-blue-50 group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <Calculator className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <span className="font-medium">Simulador M40</span>
                        <p className="text-sm text-gray-500">Calcula tu estrategia</p>
                      </div>
                    </Link>

                    {session && (
                      <Link 
                        href="/dashboard" 
                        className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 transition-colors p-3 rounded-lg hover:bg-blue-50 group"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                          <User className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <span className="font-medium">Dashboard</span>
                          <p className="text-sm text-gray-500">Gestiona tu cuenta</p>
                        </div>
                      </Link>
                    )}
                  </div>

                  {/* Separador */}
                  <div className="border-t border-gray-200 pt-4">
                    {session ? (
                      <div className="space-y-3">
                        {/* Botón Premium en menú móvil */}
                        {(!session.user?.subscription || session.user.subscription !== 'premium') && (
                          <button 
                            onClick={() => {
                              setShowPremiumModal(true)
                              setIsMenuOpen(false)
                            }}
                            className="w-full flex items-center space-x-3 text-purple-600 hover:text-purple-700 transition-colors p-3 rounded-lg hover:bg-purple-50 group"
                          >
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                              <Crown className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="text-left">
                              <span className="font-medium">Plan Premium</span>
                              <p className="text-sm text-purple-500">Desbloquea todas las estrategias</p>
                            </div>
                          </button>
                        )}
                        
                        {/* Botón de logout en menú móvil */}
                        <button 
                          onClick={() => {
                            signOut({ callbackUrl: window.location.origin })
                            setIsMenuOpen(false)
                          }}
                          className="w-full flex items-center space-x-3 text-red-600 hover:text-red-700 transition-colors p-3 rounded-lg hover:bg-red-50 group"
                        >
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                            <LogOut className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="text-left">
                            <span className="font-medium">Cerrar sesión</span>
                            <p className="text-sm text-red-500">Salir de tu cuenta</p>
                          </div>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <button 
                          onClick={() => {
                            setShowPremiumModal(true)
                            setIsMenuOpen(false)
                          }}
                          className="w-full flex items-center space-x-3 text-purple-600 hover:text-purple-700 transition-colors p-3 rounded-lg hover:bg-purple-50 group"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <Crown className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="text-left">
                            <span className="font-medium">Plan Premium</span>
                            <p className="text-sm text-purple-500">Accede a todas las estrategias</p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
