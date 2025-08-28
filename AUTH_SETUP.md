# 🔐 Configuración de Autenticación - Modalidad 40

## 📋 Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/m40_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 🔧 Configuración de Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+ 
4. Ve a "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configura las URLs autorizadas:
   - `http://localhost:3000/api/auth/callback/google` (desarrollo)
   - `https://tu-dominio.com/api/auth/callback/google` (producción)

## 🗄️ Configuración de Base de Datos

1. Instala PostgreSQL localmente o usa un servicio como Supabase
2. Crea una base de datos llamada `m40_db`
3. Ejecuta las migraciones:
   ```bash
   npx prisma db push
   ```

## 🚀 Comandos de Desarrollo

```bash
# Generar cliente de Prisma
npx prisma generate

# Ver datos en la base de datos
npx prisma studio

# Ejecutar migraciones
npx prisma migrate dev
```

## 📁 Estructura de Carpetas

```
lib/
├── auth/
│   ├── auth.ts          # Configuración de NextAuth
│   └── useAuth.ts       # Hook personalizado
└── db/
    └── prisma.ts        # Cliente de Prisma

components/
├── auth/
│   ├── AuthProvider.tsx # Provider de sesión
│   ├── LoginButton.tsx  # Botón de login
│   └── LoginModal.tsx   # Modal de autenticación
└── dashboard/           # Componentes del dashboard (futuro)

app/
└── api/
    └── auth/
        └── [...nextauth]/
            └── route.ts # API route de NextAuth

types/
└── next-auth.d.ts       # Tipos personalizados
```

## ✅ Estado Actual

- ✅ NextAuth.js configurado
- ✅ Google OAuth habilitado
- ✅ Autenticación por email/password implementada
- ✅ Registro de usuarios funcional
- ✅ Dashboard básico creado
- ✅ Componentes de UI creados
- ✅ Integración con navbar
- ✅ Tipos TypeScript configurados
- ✅ Esquema de base de datos completo

## 🔄 Próximos Pasos

1. **Configurar variables de entorno** (requerido para funcionar)
2. **Implementar gestión de familiares** (Fase 2)
3. **Sistema de estrategias guardadas** (Fase 3)
4. **Integración con el simulador existente** (Fase 4)
5. **Sistema de usuarios invitados** (Fase 5)
