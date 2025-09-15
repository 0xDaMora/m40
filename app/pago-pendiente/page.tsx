'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  status: string
  amount: number
  planType: string
}

export default function PagoPendientePage() {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [hasRedirected, setHasRedirected] = useState(false)
  
  useEffect(() => {
    // Verificar si ya se redirigió para evitar redirección infinita
    const redirected = sessionStorage.getItem('pago-pendiente-redirected')
    if (redirected) {
      setHasRedirected(true)
      setLoading(false)
      return
    }
    
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
  
  const checkOrderStatus = async () => {
    if (!order) return
    
    setCheckingStatus(true)
    try {
      const response = await fetch(`/api/orders/${order.id}`)
      if (response.ok) {
        const data = await response.json()
        const updatedOrder = data.order
        
        if (updatedOrder.status === 'paid') {
          // Marcar redirección y redirigir a página de éxito
          sessionStorage.setItem('pago-pendiente-redirected', 'true')
          router.push('/pago-exitoso?external_reference=' + order.id)
        } else if (updatedOrder.status === 'failed') {
          // Marcar redirección y redirigir a página de error
          sessionStorage.setItem('pago-pendiente-redirected', 'true')
          router.push('/pago-error')
        } else {
          setOrder(updatedOrder)
        }
      }
    } catch (error) {
      console.error('Error checking status:', error)
    } finally {
      setCheckingStatus(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-yellow-700">Cargando información del pago...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <Clock className="w-16 h-16 text-yellow-600 mx-auto mb-6" />
        
        <h1 className="text-2xl font-bold text-yellow-800 mb-4">
          Pago Pendiente
        </h1>
        
        <p className="text-yellow-700 mb-6">
          Tu pago está siendo procesado. Te notificaremos cuando se confirme.
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
            onClick={checkOrderStatus}
            disabled={checkingStatus}
            className="w-full bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {checkingStatus ? 'Verificando...' : 'Verificar Estado'}
          </button>
          
          <button
            onClick={() => {
              sessionStorage.removeItem('pago-pendiente-redirected')
              router.push('/dashboard')
            }}
            className="w-full bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Ir al Dashboard
          </button>
          
          {hasRedirected && (
            <button
              onClick={() => {
                sessionStorage.removeItem('pago-pendiente-redirected')
                window.location.reload()
              }}
              className="w-full bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Ver Detalles del Pago
            </button>
          )}
        </div>
        
        <div className="mt-6 text-xs text-gray-500">
          <p>Los pagos pueden tardar hasta 24 horas en procesarse.</p>
          <p>Recibirás una notificación por email cuando se confirme.</p>
        </div>
      </div>
    </div>
  )
}
