/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ⚠️ Peligroso: Ignora errores de TypeScript durante el build
    ignoreBuildErrors: true,
  },
  eslint: {
    // ⚠️ Peligroso: Ignora errores de ESLint durante el build
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
