# Modalidad 40 Simulator

Una aplicación web completa para simular estrategias de Modalidad 40 del IMSS, con sistema de autenticación y gestión de familiares.

## 🚀 Características

- **Simulador Completo**: Calcula estrategias de Modalidad 40 con diferentes parámetros
- **Autenticación**: Sistema de login con Google OAuth y email/password
- **Gestión de Familiares**: Agrega y gestiona perfiles de familiares
- **Estrategias Personalizadas**: Genera estrategias basadas en datos reales
- **Vista Detallada**: Análisis completo con proyecciones a 20 años
- **PDF Export**: Descarga de estrategias en formato PDF
- **URLs Compartibles**: Comparte estrategias con enlaces únicos

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, Framer Motion
- **Base de Datos**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Autenticación**: NextAuth.js v5
- **Gráficos**: Recharts
- **Iconos**: Lucide React

## 📦 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/0xDaMora/m40.git
cd m40
```

2. **Instalar dependencias**
```bash
npm install
# o
pnpm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:
```env
# Database (PostgreSQL)
DATABASE_URL="tu-url-de-supabase"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secreto"

# Google OAuth
GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"
```

4. **Configurar base de datos**
```bash
npx prisma db push
npx prisma generate
```

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

## 🔧 Configuración

### Base de Datos
- Usa Supabase como proveedor de PostgreSQL
- Configura las variables de entorno en `.env.local`
- Ejecuta las migraciones de Prisma

### Autenticación
- Configura Google OAuth en Google Cloud Console
- Agrega las credenciales en las variables de entorno
- El sistema soporta login con email/password y Google

## 📱 Uso

1. **Registro/Login**: Crea una cuenta o inicia sesión
2. **Agregar Familiares**: Configura perfiles de familiares con sus datos
3. **Simular Estrategias**: Selecciona un familiar y configura parámetros
4. **Ver Resultados**: Analiza las estrategias generadas
5. **Guardar/Compartir**: Guarda estrategias favoritas y compártelas

## 🏗️ Estructura del Proyecto

```
m40/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Páginas de autenticación
│   ├── dashboard/         # Dashboard principal
│   └── estrategia/        # Vista de estrategias
├── components/            # Componentes React
│   ├── auth/             # Componentes de autenticación
│   ├── family/           # Gestión de familiares
│   ├── integration/      # Integración de simulador
│   └── ui/               # Componentes UI base
├── lib/                   # Utilidades y lógica
│   ├── all/              # Cálculos de Modalidad 40
│   ├── auth/             # Configuración de autenticación
│   └── db/               # Configuración de base de datos
├── prisma/               # Schema y migraciones
└── types/                # Definiciones TypeScript
```

## 🔐 Variables de Entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DATABASE_URL` | URL de conexión a PostgreSQL | ✅ |
| `NEXTAUTH_URL` | URL base de la aplicación | ✅ |
| `NEXTAUTH_SECRET` | Secreto para NextAuth | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | ❌ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | ❌ |

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes preguntas o problemas, abre un issue en GitHub.

---

Desarrollado con ❤️ para ayudar a entender Modalidad 40
