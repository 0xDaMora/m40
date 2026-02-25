# 📧 Configuración del Sistema de Emails para Asesorías Premium

## 📋 Resumen

El sistema de asesorías Premium incluye notificaciones por email que se activan en los siguientes casos:

1. **Usuario crea nueva asesoría** → Email al admin
2. **Admin responde asesoría** → Email al usuario
3. **Usuario envía nuevo mensaje** → Email al admin

## 🔧 Pasos de Configuración

### 1. Elegir Proveedor de Email

Recomendamos **Resend** por su facilidad de uso y plan gratuito generoso.

**Alternativas:**
- SendGrid
- AWS SES
- Mailgun
- Postmark

### 2. Configurar Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
# Email Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx          # Tu API key de Resend
EMAIL_FROM=noreply@tudominio.com          # Email remitente verificado
ADMIN_EMAIL=admin@tudominio.com           # Email del administrador
NEXT_PUBLIC_APP_URL=https://tudominio.com # URL de tu app
```

### 3. Instalar Dependencias

```bash
npm install resend
# o
pnpm add resend
```

### 4. Actualizar el Archivo de Emails

Edita `lib/email/premiumAdvisoryEmails.ts`:

**Descomenta y configura la función `sendEmail`:**

```typescript
import { Resend } from 'resend'

async function sendEmail(config: EmailConfig): Promise<boolean> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@m40.mx',
      to: config.to,
      subject: config.subject,
      html: config.html,
      text: config.text
    })

    console.log('✅ Email enviado exitosamente:', config.subject)
    return true
  } catch (error) {
    console.error('❌ Error enviando email:', error)
    return false
  }
}
```

### 5. Integrar Notificaciones en los Endpoints

Las notificaciones ya están preparadas en los siguientes archivos con comentarios `// TODO`:

#### 📍 `app/api/premium-advisory/route.ts` (línea 190)
```typescript
// Después de crear advisory con mensaje inicial
import { notifyAdminNewAdvisory } from '@/lib/email/premiumAdvisoryEmails'

await notifyAdminNewAdvisory({
  userName: session.user.name || '',
  userEmail: session.user.email || '',
  fullName: advisory.fullName,
  initialMessage: sanitizedMessage,
  advisoryId: advisory.id
})
```

#### 📍 `app/api/premium-advisory/[id]/messages/route.ts` (línea 152)
```typescript
// Después de crear mensaje del usuario
import { notifyAdminUserMessage } from '@/lib/email/premiumAdvisoryEmails'

await notifyAdminUserMessage({
  userEmail: session.user.email || '',
  fullName: advisory.fullName,
  message: sanitizedMessage,
  advisoryId
})
```

#### 📍 `app/api/admin/premium-advisories/[id]/reply/route.ts` (línea 120)
```typescript
// Después de crear respuesta del admin
import { notifyUserAdminReply } from '@/lib/email/premiumAdvisoryEmails'

await notifyUserAdminReply({
  userEmail: advisory.user.email,
  userName: advisory.user.name,
  advisorMessage: sanitizedMessage,
  advisoryId,
  fullName: advisory.fullName
})
```

## 🎨 Personalización de Templates

Los templates de email están en `lib/email/premiumAdvisoryEmails.ts` y pueden personalizarse:

- **Colores**: Modifica los gradientes y colores en los estilos inline
- **Logo**: Agrega tu logo en la sección `<div class="header">`
- **Footer**: Personaliza el footer con tu información de contacto
- **Contenido**: Ajusta los mensajes según tu tono de marca

## ✅ Verificación

### Paso 1: Configurar Resend (o tu proveedor)

1. Ve a [resend.com](https://resend.com)
2. Crea una cuenta
3. Verifica tu dominio
4. Obtén tu API Key
5. Agrégala a `.env`

### Paso 2: Probar el Sistema

```bash
# 1. Crea una asesoría como usuario Premium
# 2. Verifica que llegue email al admin

# 3. Responde como admin
# 4. Verifica que llegue email al usuario

# 5. Usuario responde
# 6. Verifica que llegue email al admin
```

### Paso 3: Monitorear Logs

Los emails se registran en la consola:
```
📧 Email pendiente de enviar: { to: '...', subject: '...' }
✅ Email enviado exitosamente: Nueva Solicitud de Asesoría Premium
```

## 🔒 Seguridad

- ✅ Las API keys están en variables de entorno
- ✅ Los emails se envían desde el servidor (no expuestos al cliente)
- ✅ Se valida que el usuario tenga permisos antes de enviar
- ✅ Rate limiting previene spam

## 📊 Métricas Recomendadas

Considera trackear:
- Tasa de entrega de emails
- Tiempo de respuesta del admin
- Engagement del usuario con las notificaciones

## 🆘 Troubleshooting

### Error: "API key inválida"
- Verifica que `RESEND_API_KEY` esté correctamente configurada
- Asegúrate de reiniciar el servidor después de agregar la variable

### Error: "Dominio no verificado"
- Ve a Resend dashboard y verifica tu dominio
- Mientras tanto, usa el dominio de prueba de Resend

### Emails no llegan
- Revisa spam/correo no deseado
- Verifica los logs de Resend
- Confirma que `EMAIL_FROM` usa un dominio verificado

## 📝 Checklist de Implementación

- [ ] Instalar `resend` (o proveedor elegido)
- [ ] Configurar variables de entorno en `.env`
- [ ] Verificar dominio en Resend
- [ ] Actualizar función `sendEmail` en `premiumAdvisoryEmails.ts`
- [ ] Descomentar las 3 integraciones en los endpoints
- [ ] Reiniciar servidor de desarrollo
- [ ] Probar flujo completo de notificaciones
- [ ] Verificar emails en inbox
- [ ] Personalizar templates (opcional)
- [ ] Configurar en producción

## 🎯 Estado Actual

El código está **100% preparado** para emails. Solo necesitas:
1. Configurar Resend (5 minutos)
2. Agregar variables de entorno (2 minutos)
3. Descomentar 3 líneas de código (1 minuto)
4. ¡Listo! 🚀

---

**¿Necesitas ayuda?** Avísame y te guío paso a paso en la configuración.
