import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

// Constantes de seguridad
const MAX_EMAIL_LENGTH = 255
const MAX_DESCRIPTION_LENGTH = 5000
const MIN_DESCRIPTION_LENGTH = 50
const MAX_REQUESTS_PER_HOUR = 20 // Rate limiting: máximo 20 solicitudes por hora por email

// Función para validar email
function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false
  if (email.length > MAX_EMAIL_LENGTH) return false
  
  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return false
  
  // Validar que no tenga caracteres peligrosos
  const dangerousChars = /[<>\"'%;()&+]/
  if (dangerousChars.test(email)) return false
  
  return true
}

// Función para sanitizar descripción
function sanitizeDescription(description: string): string {
  if (!description || typeof description !== "string") return ""
  
  // Limitar longitud
  let sanitized = description.trim().slice(0, MAX_DESCRIPTION_LENGTH)
  
  // Remover caracteres de control excepto saltos de línea
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "")
  
  // Limitar saltos de línea consecutivos (máximo 2)
  sanitized = sanitized.replace(/\n{3,}/g, "\n\n")
  
  return sanitized
}

// Función para verificar rate limiting
async function checkRateLimit(email: string): Promise<boolean> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const recentRequests = await prisma.advisorRequest.count({
      where: {
        email: email.trim().toLowerCase(),
        createdAt: {
          gte: oneHourAgo
        }
      }
    })
    
    return recentRequests < MAX_REQUESTS_PER_HOUR
  } catch (error) {
    console.error("Error checking rate limit:", error)
    // En caso de error, permitir la solicitud (fail open)
    return true
  }
}

// POST - Crear nueva solicitud de asesoría
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()

    // Validar que el body sea un objeto
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Datos inválidos" },
        { status: 400 }
      )
    }

    // Extraer y validar email
    const email = body.email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "El correo electrónico es requerido" },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()
    
    if (!validateEmail(trimmedEmail)) {
      return NextResponse.json(
        { error: "El correo electrónico no es válido" },
        { status: 400 }
      )
    }

    // Extraer y validar descripción
    const description = body.description
    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "La descripción es requerida" },
        { status: 400 }
      )
    }

    const sanitizedDescription = sanitizeDescription(description)
    
    if (sanitizedDescription.length < MIN_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `La descripción debe tener al menos ${MIN_DESCRIPTION_LENGTH} caracteres` },
        { status: 400 }
      )
    }

    if (sanitizedDescription.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `La descripción no puede exceder ${MAX_DESCRIPTION_LENGTH} caracteres` },
        { status: 400 }
      )
    }

    // Verificar rate limiting
    const canProceed = await checkRateLimit(trimmedEmail)
    if (!canProceed) {
      return NextResponse.json(
        { error: "Has enviado demasiadas solicitudes. Por favor espera un momento antes de intentar nuevamente." },
        { status: 429 }
      )
    }

    // Obtener userId si el usuario está logueado
    let userId: string | null = null
    if (session?.user?.id) {
      userId = session.user.id
      
      // Verificar que el email de la sesión coincida con el email proporcionado
      // (para prevenir que usuarios logueados usen emails de otros)
      if (session.user.email && session.user.email.toLowerCase() !== trimmedEmail) {
        return NextResponse.json(
          { error: "El correo electrónico debe coincidir con tu cuenta" },
          { status: 400 }
        )
      }
    }

    // Crear la solicitud en la base de datos
    const advisorRequest = await prisma.advisorRequest.create({
      data: {
        email: trimmedEmail,
        userId: userId,
        description: sanitizedDescription,
        status: "pending",
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Solicitud enviada exitosamente",
        id: advisorRequest.id,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error al crear solicitud de asesoría:", error)
    
    // Manejar errores específicos de Prisma
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe una solicitud con este correo electrónico" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Error interno del servidor. Por favor intenta nuevamente." },
      { status: 500 }
    )
  }
}

