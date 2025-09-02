import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

// Extender globalThis para incluir nuestras propiedades
declare global {
  var prisma: PrismaClient | undefined
  var prismaEdge: PrismaClient | undefined
}

// Configuración para desarrollo
const prismaClientSingleton = () => {
  return new PrismaClient().$extends(withAccelerate())
}

// Configuración para producción (serverless)
const prismaClientEdgeSingleton = () => {
  return new PrismaClient().$extends(withAccelerate())
}

// Usar el cliente apropiado según el entorno
const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

export default prisma

// Exportar también el cliente edge para funciones serverless
export const prismaEdge = globalThis.prismaEdge ?? prismaClientEdgeSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaEdge = prismaEdge
