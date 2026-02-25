// Sistema de notificaciones por email para Asesorías Premium
// Este archivo contiene las funciones para enviar emails relacionados con asesorías

interface EmailConfig {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Función base para enviar emails
 * NOTA: Debes configurar tu servicio de email (Resend, SendGrid, etc.)
 * 
 * Ejemplo con Resend:
 * import { Resend } from 'resend'
 * const resend = new Resend(process.env.RESEND_API_KEY)
 */
async function sendEmail(config: EmailConfig): Promise<boolean> {
  try {
    // TODO: Reemplazar con tu servicio de email
    // Ejemplo con Resend:
    /*
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@m40.mx',
      to: config.to,
      subject: config.subject,
      html: config.html,
      text: config.text
    })
    */

    console.log('📧 Email pendiente de enviar:', {
      to: config.to,
      subject: config.subject
    })

    // Simular éxito por ahora
    return true
  } catch (error) {
    console.error('Error enviando email:', error)
    return false
  }
}

/**
 * Notificar al admin cuando un usuario crea una nueva asesoría
 */
export async function notifyAdminNewAdvisory(advisoryData: {
  userName: string
  userEmail: string
  fullName: string
  initialMessage: string
  advisoryId: string
}) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@m40.mx'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #667eea; border-radius: 5px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 Nueva Solicitud de Asesoría Premium</h1>
        </div>
        <div class="content">
          <p>Un usuario Premium ha solicitado una asesoría. Detalles:</p>
          
          <div class="info-box">
            <strong>Usuario:</strong> ${advisoryData.userName || advisoryData.userEmail}<br>
            <strong>Email:</strong> ${advisoryData.userEmail}<br>
            <strong>Nombre Completo:</strong> ${advisoryData.fullName}
          </div>

          <div class="info-box">
            <strong>Mensaje inicial:</strong><br>
            <p style="margin-top: 10px; white-space: pre-wrap;">${advisoryData.initialMessage}</p>
          </div>

          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/premium-advisories?id=${advisoryData.advisoryId}" class="button">
            Ver y Responder Asesoría
          </a>

          <div class="footer">
            <p>⏱️ Recuerda: El tiempo máximo de respuesta es de 24 horas</p>
            <p>Panel de Admin • M40 Pensiones</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
    Nueva Solicitud de Asesoría Premium
    
    Usuario: ${advisoryData.userName || advisoryData.userEmail}
    Email: ${advisoryData.userEmail}
    Nombre: ${advisoryData.fullName}
    
    Mensaje:
    ${advisoryData.initialMessage}
    
    Ver en: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/premium-advisories?id=${advisoryData.advisoryId}
  `

  return sendEmail({
    to: adminEmail,
    subject: '🎯 Nueva Solicitud de Asesoría Premium - M40',
    html,
    text
  })
}

/**
 * Notificar al usuario cuando el admin responde su asesoría
 */
export async function notifyUserAdminReply(userData: {
  userEmail: string
  userName: string | null
  advisorMessage: string
  advisoryId: string
  fullName: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .message-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981; border-radius: 5px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💬 Tienes una Nueva Respuesta</h1>
        </div>
        <div class="content">
          <p>Hola ${userData.userName || userData.fullName},</p>
          <p>Nuestro equipo de asesores ha respondido a tu solicitud de asesoría Premium:</p>
          
          <div class="message-box">
            <strong>Respuesta del Asesor:</strong><br>
            <p style="margin-top: 10px; white-space: pre-wrap;">${userData.advisorMessage}</p>
          </div>

          <p>Puedes continuar la conversación respondiendo directamente desde tu dashboard.</p>

          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard#advisories" class="button">
            Ver y Responder en Dashboard
          </a>

          <div class="footer">
            <p>✨ Gracias por ser usuario Premium de M40</p>
            <p>Dashboard • M40 Pensiones</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
    Tienes una Nueva Respuesta
    
    Hola ${userData.userName || userData.fullName},
    
    Nuestro equipo ha respondido a tu solicitud de asesoría:
    
    ${userData.advisorMessage}
    
    Ver y responder en: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard#advisories
  `

  return sendEmail({
    to: userData.userEmail,
    subject: '💬 Nueva Respuesta a tu Asesoría - M40 Premium',
    html,
    text
  })
}

/**
 * Notificar al admin cuando el usuario envía un nuevo mensaje
 */
export async function notifyAdminUserMessage(data: {
  userEmail: string
  fullName: string
  message: string
  advisoryId: string
}) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@m40.mx'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .message-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6; border-radius: 5px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📩 Nuevo Mensaje en Asesoría</h1>
        </div>
        <div class="content">
          <p>El usuario <strong>${data.fullName}</strong> ha enviado un nuevo mensaje:</p>
          
          <div class="message-box">
            <p style="white-space: pre-wrap;">${data.message}</p>
          </div>

          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/premium-advisories?id=${data.advisoryId}" class="button">
            Ver y Responder
          </a>

          <div class="footer">
            <p>Panel de Admin • M40 Pensiones</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: adminEmail,
    subject: `📩 Nuevo Mensaje de ${data.fullName} - Asesoría M40`,
    html
  })
}
