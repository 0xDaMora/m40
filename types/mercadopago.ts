// Tipos para MercadoPago
export interface MercadoPagoPreference {
  id?: string
  items: MercadoPagoItem[]
  external_reference: string
  back_urls: {
    success: string
    pending: string
    failure: string
  }
  auto_return: 'approved' | 'all'
  notification_url: string
  payer?: {
    name?: string
    email?: string
    phone?: {
      number?: string
    }
  }
  metadata?: Record<string, any>
}

export interface MercadoPagoItem {
  title: string
  quantity: number
  unit_price: number
  currency_id?: string
  description?: string
}

export interface MercadoPagoPayment {
  id: number
  status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back'
  status_detail: string
  currency_id: string
  description: string
  external_reference: string
  payment_method_id: string
  payment_type_id: string
  transaction_amount: number
  date_approved?: string
  date_created: string
  date_last_updated: string
  payer: {
    id: string
    email: string
    identification: {
      type: string
      number: string
    }
    phone?: {
      number: string
    }
  }
}

export interface MercadoPagoWebhookPayload {
  id: number
  live_mode: boolean
  type: 'payment'
  date_created: string
  user_id: number
  api_version: string
  action: 'payment.created' | 'payment.updated'
  data: {
    id: string
  }
}

// Tipos para nuestro sistema
export interface OrderData {
  planType: 'basic' | 'premium'
  strategyData?: any
  userData?: any
  amount: number
  currency?: string
}

export interface CreateOrderRequest {
  planType: 'basic' | 'premium'
  strategyData?: any
  userData?: any
  amount: number
}

export interface CreatePreferenceRequest {
  orderId: string
  amount: number
  strategyData?: any
  userData?: any
}

export interface OrderStatus {
  pending: 'pending'
  paid: 'paid'
  failed: 'failed'
  cancelled: 'cancelled'
  expired: 'expired'
}

export type OrderStatusType = keyof OrderStatus
