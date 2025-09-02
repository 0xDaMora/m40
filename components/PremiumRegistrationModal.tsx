"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, User, Mail, Lock, Crown, CheckCircle, AlertCircle } from "lucide-react"
import { signIn } from "next-auth/react"
import toast from "react-hot-toast"


interface PremiumRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (userData: any) => void
}

export default function PremiumRegistrationModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: PremiumRegistrationModalProps) {
  const [step, setStep] = useState<'info' | 'register' | 'login'>('info')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleQuickRegister = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Por favor completa todos los campos')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      // Registrar usuario
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      })

      if (!registerResponse.ok) {
        const error = await registerResponse.json()
        throw new Error(error.error || 'Error al registrar usuario')
      }

      // Iniciar sesión automáticamente
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      })

      if (signInResult?.error) {
        throw new Error('Error al iniciar sesión')
      }

      toast.success('¡Registro exitoso!')
      
      // En NextAuth v4, la sesión se actualiza automáticamente
      // Simplemente llamamos al callback de éxito
      onSuccess({
        ...formData,
        isNewUser: true
      })

    } catch (error: any) {
      toast.error(error.message || 'Error en el registro')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = async () => {
    if (!formData.email || !formData.password) {
      toast.error('Por favor completa todos los campos')
      return
    }

    setLoading(true)
    try {
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      })

      if (signInResult?.error) {
        throw new Error('Credenciales incorrectas')
      }

      toast.success('¡Inicio de sesión exitoso!')
      
      // En NextAuth v4, la sesión se actualiza automáticamente
      // Simplemente llamamos al callback de éxito
      onSuccess({
        email: formData.email,
        isExistingUser: true
      })

    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="premium-registration-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Crown className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {step === 'info' && 'Plan Premium'}
                      {step === 'register' && 'Registro rápido'}
                      {step === 'login' && 'Iniciar sesión'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {step === 'info' && 'Acceso ilimitado de por vida'}
                      {step === 'register' && 'Crea tu cuenta en segundos'}
                      {step === 'login' && 'Accede a tu cuenta existente'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {step === 'info' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold mb-3">
                      <Crown className="w-4 h-4" />
                      Plan Premium de por Vida
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      ¡Acceso Ilimitado Completo!
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Con tu Plan Premium tendrás acceso a todas las estrategias, PDFs ilimitados y análisis completo.
                    </p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Beneficios Premium:
                    </h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• 2,000+ estrategias personalizadas</li>
                      <li>• PDFs ilimitados</li>
                      <li>• Análisis completo de 20 años</li>
                      <li>• Acceso de por vida</li>
                      <li>• Soporte prioritario</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('register')}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                    >
                      Crear cuenta
                    </button>
                    <button
                      onClick={() => setStep('login')}
                      className="flex-1 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Ya tengo cuenta
                    </button>
                  </div>
                </div>
              )}

              {step === 'register' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <User className="w-4 h-4 inline mr-1" />
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Tu nombre completo"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Lock className="w-4 h-4 inline mr-1" />
                        Contraseña
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Lock className="w-4 h-4 inline mr-1" />
                        Confirmar contraseña
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Repite tu contraseña"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleQuickRegister}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creando cuenta...
                      </div>
                    ) : (
                      'Crear cuenta'
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      onClick={() => setStep('login')}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      ¿Ya tienes cuenta? Inicia sesión
                    </button>
                  </div>
                </div>
              )}

              {step === 'login' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Lock className="w-4 h-4 inline mr-1" />
                        Contraseña
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Tu contraseña"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleQuickLogin}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Iniciando sesión...
                      </div>
                    ) : (
                      'Iniciar sesión'
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      onClick={() => setStep('register')}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      ¿No tienes cuenta? Regístrate
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
