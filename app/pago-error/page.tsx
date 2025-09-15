'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle, RefreshCw } from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  status: string
  amount: number
  planType: string
}

export default function PagoErrorPage() {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)
  
  useEffect(() => {
    // Obtener parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search)
    const paymentId = urlParams.get('payment_id')
    const externalRef = urlParams.get('external_reference')
    
    if (externalRef) {
      fetchOrderByExternalRef(externalRef)
    } else if (paymentId) {
      fetchOrderByPaymentId(paymentId)
    } else {
      setLoading(false)
    }
  }, [])
  
  const fetchOrderByExternalRef = async (externalRef: string) => {
    try {
      const response = await fetch(`/api/orders/external/${externalRef}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const fetchOrderByPaymentId = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/orders/payment/${paymentId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const retryPayment = async () => {
    if (!order) return
    
    setRetrying(true)
    try {
      // Crear nueva preferencia para reintentar el pago
      const response = await fetch('/api/mercadopago/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          amount: order.amount,
          planType: order.planType
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        // Redirigir a MercadoPago
        window.location.href = data.init_point
      } else {
        console.error('Error creating new preference')
      }
    } catch (error) {
      console.error('Error retrying payment:', error)
    } finally {
      setRetrying(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-red-700">Cargando información del pago...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <XCircle className="w-16 h-16 text-red-600 mx-auto mb-6" />
        
        <h1 className="text-2xl font-bold text-red-800 mb-4">
          Pago Fallido
        </h1>
        
        <p className="text-red-700 mb-6">
          No se pudo procesar tu pago. Por favor, verifica tu información y intenta nuevamente.
        </p>
        
        {order && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <span className="font-medium">Orden:</span> #{order.orderNumber}
              </p>
              <p>
                <span className="font-medium">Monto:</span> ${order.amount} MXN
              </p>
              <p>
                <span className="font-medium">Plan:</span> {
                  order.planType === 'premium' ? 'Premium' : 'Básico'
                }
              </p>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <button
            onClick={retryPayment}
            disabled={retrying}
            className="w-full bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {retrying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Procesando...
              </>
            ) : (
              'Intentar Nuevamente'
            )}
          </button>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Ir al Dashboard
          </button>
          
          <button
            onClick={() => router.push('/simulador')}
            className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al Simulador
          </button>
        </div>
        
        <div className="mt-6 text-xs text-gray-500">
          <p className="font-medium mb-2">Posibles causas del error:</p>
          <ul className="text-left space-y-1">
            <li>• Fondos insuficientes</li>
            <li>• Datos de tarjeta incorrectos</li>
            <li>• Tarjeta bloqueada o expirada</li>
            <li>• Problemas de conexión</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
