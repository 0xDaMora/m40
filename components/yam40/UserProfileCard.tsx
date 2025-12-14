"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Calendar, Target, Clock, Heart, HelpCircle, Info, ExternalLink, Edit, CheckCircle } from "lucide-react"
import { YaM40State } from "@/types/yam40"

interface UserProfileCardProps {
  profile: YaM40State['profile']
  onProfileChange: (profile: YaM40State['profile']) => void
}

export default function UserProfileCard({ profile, onProfileChange }: UserProfileCardProps) {
  // Iniciar en modo edición si el perfil no está completo
  const isProfileIncomplete = !(
    profile.name &&
    profile.birthDate &&
    profile.totalWeeksContributed > 0
  )
  const [isEditing, setIsEditing] = useState(isProfileIncomplete)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const calcularEdad = (fechaNacimiento: Date | null) => {
    if (!fechaNacimiento) return null
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mesActual = hoy.getMonth()
    const mesNacimiento = nacimiento.getMonth()
    
    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    return edad
  }

  const validar = (profileToValidate: YaM40State['profile'] = profile) => {
    const nuevosErrores: Record<string, string> = {}

    if (!profileToValidate.name || profileToValidate.name.trim().length < 2) {
      nuevosErrores.name = "El nombre debe tener al menos 2 caracteres"
    }

    if (!profileToValidate.birthDate) {
      nuevosErrores.birthDate = "La fecha de nacimiento es requerida"
    } else {
      const fechaMinima = new Date("1959-01-01")
      const fechaMaxima = new Date("1979-12-31")
      const fechaSeleccionada = new Date(profileToValidate.birthDate)
      
      if (fechaSeleccionada < fechaMinima || fechaSeleccionada > fechaMaxima) {
        nuevosErrores.birthDate = "La fecha debe estar entre 1959 y 1979 para aplicar a Ley 73"
      }
    }

    if (!profileToValidate.totalWeeksContributed || profileToValidate.totalWeeksContributed < 0) {
      nuevosErrores.totalWeeksContributed = "Las semanas cotizadas son requeridas"
    }

    setErrors(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  // Ref para el debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-guardar cuando se completa el perfil (con debounce para evitar cerrar mientras se escribe)
  const handleFieldChange = (updates: Partial<YaM40State['profile']>) => {
    const updatedProfile = { ...profile, ...updates }
    onProfileChange(updatedProfile)
    
    // Limpiar el timer anterior si existe
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // Solo cerrar el modo edición después de que el usuario deje de escribir por 1.5 segundos
    debounceTimerRef.current = setTimeout(() => {
      if (
        updatedProfile.name &&
        updatedProfile.birthDate &&
        updatedProfile.totalWeeksContributed > 0 &&
        validar(updatedProfile)
      ) {
        setIsEditing(false)
      }
    }, 1500)
  }

  // Limpiar el timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const edad = calcularEdad(profile.birthDate)

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-50 via-white to-gray-50 border-2 border-gray-200 rounded-2xl shadow-xl overflow-hidden mb-6"
    >
      {/* Diseño tipo credencial */}
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Perfil de Usuario</h2>
            {isEditing && (
              <p className="text-gray-600 text-sm mt-1">
                Completa todos los campos para continuar
              </p>
            )}
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-6">
            {/* Instrucción inicial */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-900 font-semibold mb-1 text-base">📝 Instrucciones</p>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Completa todos los campos a continuación. Si tienes dudas, busca el ícono de ayuda <HelpCircle className="w-4 h-4 inline text-gray-500" /> junto a cada campo.
                  </p>
                </div>
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="flex items-center gap-2 mb-2 text-base font-semibold text-gray-900">
                <User className="w-5 h-5 text-gray-700" />
                Nombre Completo
                <div className="group relative">
                  <HelpCircle className="w-4 h-4 text-gray-500 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                    Ingresa tu nombre completo tal como aparece en tu identificación oficial (INE o pasaporte).
                  </div>
                </div>
              </label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => handleFieldChange({ name: e.target.value })}
                className="w-full px-4 py-3 text-lg rounded-lg bg-white border-2 border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ejemplo: Juan Pérez García"
              />
              {errors.name && (
                <p className="text-red-200 text-sm mt-2 flex items-center gap-2">
                  <span>⚠️</span> {errors.name}
                </p>
              )}
              {!errors.name && profile.name && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-2">
                  <p className="text-green-700 text-sm font-medium flex items-center gap-2">
                    <span>✅</span> Nombre guardado correctamente
                  </p>
                </div>
              )}
            </div>

            {/* Fecha de Nacimiento */}
            <div>
              <label className="flex items-center gap-2 mb-2 text-base font-semibold text-gray-900">
                <Calendar className="w-5 h-5 text-gray-700" />
                Fecha de Nacimiento
                <div className="group relative">
                  <HelpCircle className="w-4 h-4 text-gray-500 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                    <p className="font-semibold mb-1">📅 ¿Dónde encuentro mi fecha de nacimiento?</p>
                    <p className="mb-2">Puedes encontrarla en:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Tu acta de nacimiento</li>
                      <li>Tu INE o credencial de elector</li>
                      <li>Tu pasaporte</li>
                    </ul>
                    <p className="mt-2 text-yellow-300">⚠️ Importante: Debes haber nacido entre 1959 y 1979 para aplicar a Ley 73.</p>
                  </div>
                </div>
              </label>
              <input
                type="date"
                value={profile.birthDate ? new Date(profile.birthDate).toISOString().split('T')[0] : ''}
                onChange={(e) => handleFieldChange({ birthDate: e.target.value ? new Date(e.target.value) : null })}
                min="1959-01-01"
                max="1979-12-31"
                className="w-full px-4 py-3 text-lg rounded-lg bg-white border-2 border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.birthDate && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                  <span>⚠️</span> {errors.birthDate}
                </p>
              )}
              {edad && !errors.birthDate && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                  <p className="text-green-700 text-sm font-medium flex items-center gap-2">
                    <span>✅</span> Edad actual: <strong className="text-green-900">{edad} años</strong> - Califica para Ley 73
                  </p>
                </div>
              )}
              {!profile.birthDate && (
                <p className="text-gray-500 text-sm mt-2">
                  💡 Formato: día/mes/año (ejemplo: 15/03/1965)
                </p>
              )}
            </div>


            {/* Semanas Cotizadas ANTES de M40 */}
            <div>
              <label className="flex items-center gap-2 mb-2 text-base font-semibold text-gray-900">
                <Clock className="w-5 h-5 text-gray-700" />
                Semanas Cotizadas ANTES de Modalidad 40
                <div className="group relative">
                  <HelpCircle className="w-4 h-4 text-gray-500 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                    <p className="font-semibold mb-2">📊 ¿Qué son las semanas cotizadas ANTES de M40?</p>
                    <p className="mb-2">Son las semanas que trabajaste y cotizaste al IMSS <strong>antes</strong> de iniciar Modalidad 40.</p>
                    <p className="mb-2 font-semibold text-yellow-300">⚠️ IMPORTANTE:</p>
                    <p className="mb-2">Solo cuenta las semanas ANTES de empezar M40. Las semanas de M40 se calcularán automáticamente según los meses que selecciones en el calendario.</p>
                    <p className="mt-2 text-green-300">💡 Ejemplo: Si trabajaste 500 semanas antes de iniciar M40, ingresa 500 aquí. Las semanas de M40 se sumarán después.</p>
                  </div>
                </div>
              </label>
              <input
                type="number"
                value={profile.totalWeeksContributed || ''}
                onChange={(e) => handleFieldChange({ totalWeeksContributed: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 text-lg rounded-lg bg-white border-2 border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ejemplo: 500"
                min="0"
              />
              {errors.totalWeeksContributed && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                  <span>⚠️</span> {errors.totalWeeksContributed}
                </p>
              )}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                <p className="text-blue-900 text-sm mb-2">
                  <strong>📋 ¿Dónde encuentro mis semanas cotizadas?</strong>
                </p>
                <p className="text-blue-800 text-sm mb-2">
                  Puedes obtener tu reporte oficial de semanas en el sitio del IMSS:
                </p>
                <a
                  href="https://serviciosdigitales.imss.gob.mx/semanascotizadas-web/usuarios/IngresoAsegurado"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Solicitar mi reporte de semanas en el IMSS
                </a>
                <p className="text-gray-600 text-xs mt-2">
                  💡 Solo ingresa las semanas ANTES de iniciar M40. Las semanas de M40 se calcularán automáticamente.
                </p>
              </div>
            </div>

            {/* Estado Civil */}
            <div>
              <label className="flex items-center gap-2 mb-3 text-base font-semibold text-gray-900">
                <Heart className="w-5 h-5 text-gray-700" />
                Estado Civil
                <div className="group relative">
                  <HelpCircle className="w-4 h-4 text-gray-500 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                    <p className="font-semibold mb-2">💑 Estado Civil</p>
                    <p className="mb-2">Según la Ley 73, si tienes cónyuge o concubina/o:</p>
                    <p className="text-yellow-300 font-semibold">Tu pensión se incrementa en un 15%</p>
                    <p className="mt-2 text-xs">Esto se llama "asignación familiar" y aplica si estás casado o en concubinato.</p>
                  </div>
                </div>
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => handleFieldChange({ civilStatus: 'casado' })}
                  className={`flex-1 px-6 py-4 rounded-lg font-bold text-lg transition-all ${
                    profile.civilStatus === 'casado'
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:scale-102'
                  }`}
                >
                  💑 Casado/a
                  {profile.civilStatus === 'casado' && (
                    <div className="text-xs font-normal mt-1 text-green-600">+15% pensión</div>
                  )}
                </button>
                <button
                  onClick={() => handleFieldChange({ civilStatus: 'soltero' })}
                  className={`flex-1 px-6 py-4 rounded-lg font-bold text-lg transition-all ${
                    profile.civilStatus === 'soltero'
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:scale-102'
                  }`}
                >
                  👤 Soltero/a
                </button>
              </div>
              {profile.civilStatus === 'casado' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                  <p className="text-green-700 text-sm">
                    ✅ Con cónyuge recibirás un <strong className="text-green-900">15% adicional</strong> en tu pensión por asignación familiar.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* Mensaje de éxito */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-700 font-semibold">
                  ✅ Perfil completo - Puedes continuar al siguiente paso
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Nombre</p>
                  <p className="font-semibold text-lg text-gray-900">{profile.name || 'No especificado'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Fecha de Nacimiento</p>
                  <p className="font-semibold text-lg text-gray-900">
                    {profile.birthDate 
                      ? new Date(profile.birthDate).toLocaleDateString('es-MX', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'No especificada'}
                  </p>
                  {edad && <p className="text-gray-500 text-xs">Edad: {edad} años</p>}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Jubilación</p>
                  <p className="font-semibold text-lg text-gray-900">65 años</p>
                  <p className="text-gray-500 text-xs">100% de pensión</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Semanas Cotizadas</p>
                  <p className="font-semibold text-lg text-gray-900">{profile.totalWeeksContributed || 0} semanas</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200 md:col-span-2">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Heart className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Estado Civil</p>
                  <p className="font-semibold text-lg text-gray-900">
                    {profile.civilStatus === 'casado' ? 'Casado/a' : 'Soltero/a'}
                  </p>
                  {profile.civilStatus === 'casado' && (
                    <p className="text-green-600 text-xs">+15% asignación familiar</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

