import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

// Configuración del cliente de MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
    idempotencyKey: 'abc'
  }
})

// Inicializar servicios
export const preference = new Preference(client)
export const payment = new Payment(client)

// Configuración de URLs
export const MERCADOPAGO_CONFIG = {
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  publicKey: process.env.MERCADOPAGO_PUBLIC_KEY!,
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET
}

// Validar configuración
export const validateMercadoPagoConfig = () => {
  const requiredVars = [
    'MERCADOPAGO_ACCESS_TOKEN',
    'MERCADOPAGO_PUBLIC_KEY',
    'NEXT_PUBLIC_BASE_URL'
  ]

  const missing = requiredVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`)
  }

  return true
}

// Log de configuración (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 MercadoPago Config:')
  console.log('- Access Token:', process.env.MERCADOPAGO_ACCESS_TOKEN?.substring(0, 10) + '...')
  console.log('- Public Key:', process.env.MERCADOPAGO_PUBLIC_KEY?.substring(0, 10) + '...')
  console.log('- Base URL:', MERCADOPAGO_CONFIG.baseUrl)
}

export default client
