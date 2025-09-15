import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface MercadoPagoOrderData {
  planType: 'basic' | 'premium'
  strategyData?: any
  userData?: any
  amount: number
}

interface MercadoPagoHookReturn {
  processPurchase: (orderData: MercadoPagoOrderData) => Promise<boolean>
  loading: boolean
  error: string | null
}

export const useMercadoPago = (): MercadoPagoHookReturn => {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)


  const processPurchase = async (orderData: MercadoPagoOrderData): Promise<boolean> => {
    if (!(session?.user as any)?.id) {
      toast.error('Debes iniciar sesión para continuar')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🛒 Procesando compra con MercadoPago:', orderData)
      
      // 1. Crear orden
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderData)
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json()
        throw new Error(errorData.error || 'Error al crear la orden')
      }

      const { order } = await orderResponse.json()
      console.log('✅ Orden creada exitosamente:', order)

      // 2. Crear preferencia y redirigir
      const preferenceResponse = await fetch('/api/mercadopago/preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId: order.id,
          amount: orderData.amount,
          strategyData: orderData.strategyData,
          userData: orderData.userData
        })
      })

      if (!preferenceResponse.ok) {
        const errorData = await preferenceResponse.json()
        throw new Error(errorData.error || 'Error al crear la preferencia')
      }

      const { init_point } = await preferenceResponse.json()
      console.log('✅ Preferencia creada exitosamente')
      
      // 3. Redirigir a MercadoPago
      if (init_point) {
        toast.success('Redirigiendo a MercadoPago...')
        window.location.href = init_point
        return true
      }
      
      return false
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('❌ Error procesando compra:', errorMessage)
      setError(errorMessage)
      toast.error(`Error al procesar la compra: ${errorMessage}`)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    processPurchase,
    loading,
    error
  }
}
