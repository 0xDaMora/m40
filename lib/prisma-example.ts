// Ejemplo de uso de Prisma Accelerate
// Este archivo muestra cómo usar Prisma con la extensión Accelerate

import prisma from './prisma'
import { prismaEdge } from './prisma'
import { PrismaClient } from '@prisma/client/edge'

// Ejemplo 1: Uso básico con Accelerate
export async function getUserWithAccelerate(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        familyMembers: true,
        savedStrategies: true
      }
    })
    return user
  } catch (error) {
    console.error('Error fetching user:', error)
    throw error
  }
}

// Ejemplo 2: Uso en funciones serverless (Edge Runtime)
export async function getUserEdge(userId: string) {
  try {
    const user = await prismaEdge.user.findUnique({
      where: { id: userId },
      include: {
        familyMembers: true
      }
    })
    return user
  } catch (error) {
    console.error('Error fetching user in edge:', error)
    throw error
  }
}

// Ejemplo 3: Transacciones con Accelerate
export async function createUserWithFamily(userData: any, familyData: any) {
  try {
    const result = await prisma.$transaction(async (tx: PrismaClient) => {
      const user = await tx.user.create({
        data: userData
      })
      
      const familyMember = await tx.familyMember.create({
        data: {
          ...familyData,
          userId: user.id
        }
      })
      
      return { user, familyMember }
    })
    
    return result
  } catch (error) {
    console.error('Error in transaction:', error)
    throw error
  }
}

// Ejemplo 4: Consultas optimizadas con Accelerate
export async function getStrategiesWithFilters(filters: any) {
  try {
    const strategies = await prisma.savedStrategy.findMany({
      where: filters,
      include: {
        user: true,
        familyMember: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return strategies
  } catch (error) {
    console.error('Error fetching strategies:', error)
    throw error
  }
}
