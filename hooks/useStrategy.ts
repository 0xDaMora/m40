/**
 * Hook personalizado para manejo de estrategias
 */

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import {
  generarCodigoEstrategia,
  construirDatosEstrategia,
  construirDatosUsuario,
  guardarEstrategiaConFallback,
  validarEstrategia
} from '@/lib/utils/strategy'

export const useStrategy = () => {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  const procesarEstrategia = useCallback(async (
    estrategia: any,
    datosUsuario: any,
    nombreFamiliar: string,
    tipo: 'compra' | 'integration' | 'premium' = 'compra'
  ) => {
    if (!validarEstrategia(estrategia)) {
      toast.error('Estrategia inválida')
      return null
    }

    setLoading(true)
    try {
      // Generar código único
      const strategyCode = generarCodigoEstrategia(tipo, {
        familyMemberId: datosUsuario.familyMemberId,
        estrategia: estrategia.estrategia,
        umaElegida: estrategia.umaElegida,
        mesesM40: estrategia.mesesM40,
        edadJubilacion: datosUsuario.edad
      })

      // Construir datos
      const datosEstrategia = construirDatosEstrategia(estrategia, datosUsuario)
      const datosUsuarioCompletos = construirDatosUsuario(datosUsuario, estrategia, nombreFamiliar)

      // Guardar estrategia
      const resultado = await guardarEstrategiaConFallback(
        strategyCode,
        datosEstrategia,
        datosUsuarioCompletos,
        nombreFamiliar
      )

      if (resultado.success) {
        if (resultado.fallback) {
          console.log('🔄 Usando fallback para estrategia')
        } else {
          console.log('✅ Estrategia guardada exitosamente')
        }
        
        // Abrir en nueva pestaña
        window.open(resultado.url, '_blank')
        return resultado.url
      } else {
        throw new Error('Error al procesar estrategia')
      }
    } catch (error) {
      console.error('❌ Error procesando estrategia:', error)
      toast.error('Error al procesar la estrategia')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const actualizarPlanUsuario = useCallback(async (plan: 'basic' | 'premium') => {
    setLoading(true)
    try {
      const response = await fetch('/api/update-user-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: plan }),
      })

      if (response.ok) {
        toast.success(`¡Plan ${plan} activado exitosamente!`)
        // Recargar la página para actualizar el session
        setTimeout(() => {
          window.location.reload()
        }, 1000)
        return true
      } else {
        throw new Error('Error al actualizar el plan')
      }
    } catch (error) {
      console.error('❌ Error actualizando plan:', error)
      toast.error('Error al actualizar el plan')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    procesarEstrategia,
    actualizarPlanUsuario,
    loading,
    isAuthenticated: !!session,
    isPremium: session?.user?.subscription === 'premium'
  }
}
