"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, User, Mail, Lock, Calendar, DollarSign, Users, CheckCircle, AlertCircle } from "lucide-react"
import { signIn } from "next-auth/react"
import toast from "react-hot-toast"

interface QuickRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (userData: any) => void
  strategyData: any
  userData: any // Datos del HeroOnboard
}

export default function QuickRegistrationModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  strategyData, 
  userData 
}: QuickRegistrationModalProps) {
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

      // Crear familiar automáticamente
      const familyResponse = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          birthDate: userData["Nacimiento"] || userData.fechaNacimiento,
          weeksContributed: parseInt(userData["Semanas"]) || userData.semanasPrevias || 500,
          lastGrossSalary: parseFloat(userData["sdi"] || userData.sdiHistorico || "100") * 30.4,
          civilStatus: userData["Estado Civil"] === "Casado(a)" ? "casado" : "soltero"
        })
      })

      if (!familyResponse.ok) {
        console.warn('Error al crear familiar automáticamente')
      }

      toast.success('¡Registro exitoso!')
      onSuccess({
        ...formData,
        familyMember: {
          name: formData.name,
          birthDate: userData["Nacimiento"] || userData.fechaNacimiento,
          weeksContributed: parseInt(userData["Semanas"]) || userData.semanasPrevias || 500,
          lastGrossSalary: parseFloat(userData["sdi"] || userData.sdiHistorico || "100") * 30.4,
          civilStatus: userData["Estado Civil"] === "Casado(a)" ? "casado" : "soltero"
        }
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
          key="quick-registration-modal"
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
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {step === 'info' && (strategyData ? 'Completar tu compra' : 'Acceder a Herramienta Avanzada')}
                      {step === 'register' && 'Registro rápido'}
                      {step === 'login' && 'Iniciar sesión'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {step === 'info' && (strategyData ? 'Necesitamos algunos datos para procesar tu compra' : 'Crea tu cuenta para acceder a cálculos personalizados')}
                      {step === 'register' && 'Crea tu cuenta en segundos'}
                      {step === 'login' && 'Accede a tu cuenta existente'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6">
              {step === 'info' && (
                <div className="space-y-6">
                  {/* Resumen de la estrategia - Solo mostrar si hay estrategia */}
                  {strategyData ? (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-3">Estrategia seleccionada:</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-blue-600">Pensión mensual:</span>
                          <div className="font-bold text-blue-900">
                            ${strategyData?.pensionMensual?.toLocaleString()} MXN
                          </div>
                        </div>
                        <div>
                          <span className="text-blue-600">Inversión total:</span>
                          <div className="font-bold text-blue-900">
                            ${strategyData?.inversionTotal?.toLocaleString()} MXN
                          </div>
                        </div>
                        <div>
                          <span className="text-blue-600">Duración:</span>
                          <div className="font-bold text-blue-900">
                            {strategyData?.mesesM40} meses
                          </div>
                        </div>
                        <div>
                          <span className="text-blue-600">ROI:</span>
                          <div className="font-bold text-blue-900">
                            {strategyData?.ROI?.toFixed(1)}x
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-3">🎯 Herramienta Avanzada</h3>
                      <p className="text-sm text-blue-800">
                        Al crear tu cuenta, podrás acceder a nuestra herramienta avanzada para calcular estrategias personalizadas con fecha de inicio específica, pensión objetivo y duración exacta en Modalidad 40.
                      </p>
                    </div>
                  )}

                  {/* Datos del usuario */}
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-3">Tus datos del simulador:</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Fecha de nacimiento:</span>
                        <span className="font-medium">{userData["Nacimiento"]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Semanas cotizadas:</span>
                        <span className="font-medium">{userData["Semanas"]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">SDI:</span>
                        <span className="font-medium">${userData["sdi"]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Opciones */}
                  <div className="space-y-3">
                    <button
                      onClick={() => setStep('register')}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Crear cuenta nueva
                    </button>
                    <button
                      onClick={() => setStep('login')}
                      className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Ya tengo cuenta
                    </button>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      Al continuar, aceptas nuestros términos y condiciones
                    </p>
                  </div>
                </div>
              )}

              {step === 'register' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tu nombre completo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo electrónico *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar contraseña *
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Repite tu contraseña"
                    />
                  </div>

                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div className="text-sm text-green-800">
                        <p className="font-medium mb-1">¡Beneficios incluidos!</p>
                        <ul className="space-y-1">
                          <li>• Familiar creado automáticamente</li>
                          <li>• Estrategia guardada en tu dashboard</li>
                          <li>• Acceso a todas tus simulaciones</li>
                          <li>• Soporte personalizado</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('info')}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={handleQuickRegister}
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Creando cuenta...
                        </>
                      ) : (
                        <>
                          <User className="w-4 h-4" />
                          Crear cuenta
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {step === 'login' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tu contraseña"
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">¿No tienes cuenta?</p>
                        <p>Si es tu primera vez, te recomendamos crear una cuenta nueva para aprovechar todos los beneficios.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('info')}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={handleQuickLogin}
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Iniciando sesión...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Iniciar sesión
                        </>
                      )}
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
