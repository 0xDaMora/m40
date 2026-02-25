"use client"

import { useState } from "react"
import { Calendar, Briefcase, DollarSign, Mail, MessageSquare, Phone, ExternalLink } from "lucide-react"
import { toast } from "react-hot-toast"

interface AdvisoryRequestFormProps {
  onSuccess: () => void
}

export function AdvisoryRequestForm({ onSuccess }: AdvisoryRequestFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    birthDate: "",
    weeksContributed: "",
    lastSalary: "",
    contactMethod: "email" as "email" | "whatsapp",
    phoneNumber: "",
    initialMessage: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/premium-advisory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          birthDate: formData.birthDate,
          weeksContributed: parseInt(formData.weeksContributed),
          lastSalary: parseFloat(formData.lastSalary),
          contactMethod: formData.contactMethod,
          phoneNumber: formData.contactMethod === "whatsapp" ? formData.phoneNumber : null,
          initialMessage: formData.initialMessage
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear asesoría")
      }

      toast.success("¡Asesoría creada! Recibirás respuesta en máximo 24 horas")
      onSuccess()
    } catch (error: any) {
      console.error("Error:", error)
      toast.error(error.message || "Error al crear asesoría")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Nueva Solicitud de Asesoría
        </h2>
        <p className="text-gray-600">
          Completa el formulario para recibir asesoría personalizada de nuestros expertos en Modalidad 40
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre Completo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre Completo <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Juan Pérez García"
            />
            <Briefcase className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Fecha de Nacimiento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Nacimiento <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              required
              value={formData.birthDate}
              onChange={(e) => handleChange("birthDate", e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Semanas Cotizadas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Semanas Cotizadas <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              required
              min="0"
              max="3000"
              value={formData.weeksContributed}
              onChange={(e) => handleChange("weeksContributed", e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: 1250"
            />
            <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          </div>
          <a
            href="https://serviciosdigitales.imss.gob.mx/portal-ciudadano-web-externo/home"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <ExternalLink className="w-4 h-4" />
            ¿Cómo consultar mis semanas en el IMSS?
          </a>
        </div>

        {/* Último Salario Bruto Mensual */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Último Salario Bruto Mensual <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.lastSalary}
              onChange={(e) => handleChange("lastSalary", e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: 15000.00"
            />
            <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          </div>
          <p className="mt-1 text-xs text-gray-500">En pesos mexicanos (MXN)</p>
        </div>

        {/* Método de Contacto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Método de Contacto Preferido <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="contactMethod"
                value="email"
                checked={formData.contactMethod === "email"}
                onChange={(e) => handleChange("contactMethod", e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <Mail className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">Correo Electrónico</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="contactMethod"
                value="whatsapp"
                checked={formData.contactMethod === "whatsapp"}
                onChange={(e) => handleChange("contactMethod", e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <Phone className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">WhatsApp</span>
            </label>
          </div>
        </div>

        {/* Número de Teléfono (condicional) */}
        {formData.contactMethod === "whatsapp" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Teléfono <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 5512345678"
              />
              <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            </div>
            <p className="mt-1 text-xs text-gray-500">10 dígitos sin espacios ni guiones</p>
          </div>
        )}

        {/* Descripción de la Duda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe tu duda o consulta <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <textarea
              required
              rows={6}
              minLength={50}
              maxLength={5000}
              value={formData.initialMessage}
              onChange={(e) => handleChange("initialMessage", e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Describe detalladamente tu situación y qué necesitas que te ayudemos..."
            />
            <MessageSquare className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>Mínimo 50 caracteres</span>
            <span>{formData.initialMessage.length} / 5000</span>
          </div>
        </div>

        {/* Mensaje Informativo */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            ℹ️ Te notificaremos por correo cuando recibas respuesta. El tiempo máximo de respuesta es de <strong>24 horas</strong>.
          </p>
        </div>

        {/* Botón Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <MessageSquare className="w-5 h-5" />
              <span>Iniciar Solicitud de Asesoría</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
