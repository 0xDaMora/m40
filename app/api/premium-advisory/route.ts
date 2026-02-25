import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"

const MAX_DESCRIPTION_LENGTH = 5000
const MIN_DESCRIPTION_LENGTH = 50
const MAX_ADVISORIES_PER_MONTH = 5

// Validar que el usuario sea Premium
async function validatePremiumUser(session: any) {
  if (!session?.user?.id) {
    return { valid: false, error: "No autenticado" }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscription: true }
  })

  if (!user || user.subscription !== 'premium') {
    return { valid: false, error: "Solo usuarios Premium pueden acceder a asesorías" }
  }

  return { valid: true }
}

// Verificar rate limiting
async function checkRateLimit(userId: string): Promise<boolean> {
  try {
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    const recentAdvisories = await prisma.premiumAdvisory.count({
      where: {
        userId,
        createdAt: {
          gte: oneMonthAgo
        }
      }
    })
    
    return recentAdvisories < MAX_ADVISORIES_PER_MONTH
  } catch (error) {
    console.error("Error checking rate limit:", error)
    return true
  }
}

// POST - Crear nueva solicitud de asesoría Premium
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Validar usuario Premium
    const validation = await validatePremiumUser(session)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.error === "No autenticado" ? 401 : 403 }
      )
    }

    const body = await request.json()

    // Validar campos requeridos
    const { fullName, birthDate, weeksContributed, lastSalary, contactMethod, phoneNumber, initialMessage } = body

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: "Nombre completo es requerido (mínimo 2 caracteres)" },
        { status: 400 }
      )
    }

    if (!birthDate) {
      return NextResponse.json(
        { error: "Fecha de nacimiento es requerida" },
        { status: 400 }
      )
    }

    // Validar edad (18-100 años)
    const birthDateObj = new Date(birthDate)
    const today = new Date()
    const age = today.getFullYear() - birthDateObj.getFullYear()
    if (age < 18 || age > 100) {
      return NextResponse.json(
        { error: "Edad debe estar entre 18 y 100 años" },
        { status: 400 }
      )
    }

    if (typeof weeksContributed !== 'number' || weeksContributed < 0 || weeksContributed > 3000) {
      return NextResponse.json(
        { error: "Semanas cotizadas debe ser un número entre 0 y 3000" },
        { status: 400 }
      )
    }

    if (typeof lastSalary !== 'number' || lastSalary < 0) {
      return NextResponse.json(
        { error: "Último salario debe ser un número positivo" },
        { status: 400 }
      )
    }

    if (contactMethod !== 'email' && contactMethod !== 'whatsapp') {
      return NextResponse.json(
        { error: "Método de contacto debe ser 'email' o 'whatsapp'" },
        { status: 400 }
      )
    }

    // Validar teléfono si es WhatsApp
    if (contactMethod === 'whatsapp') {
      if (!phoneNumber || typeof phoneNumber !== 'string') {
        return NextResponse.json(
          { error: "Número de teléfono es requerido para contacto por WhatsApp" },
          { status: 400 }
        )
      }
      const phoneRegex = /^\+?[0-9]{10,15}$/
      if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
        return NextResponse.json(
          { error: "Formato de número de teléfono inválido (10-15 dígitos)" },
          { status: 400 }
        )
      }
    }

    // Validar mensaje inicial
    if (!initialMessage || typeof initialMessage !== 'string') {
      return NextResponse.json(
        { error: "Descripción de la duda es requerida" },
        { status: 400 }
      )
    }

    const sanitizedMessage = initialMessage.trim()
    if (sanitizedMessage.length < MIN_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `La descripción debe tener al menos ${MIN_DESCRIPTION_LENGTH} caracteres` },
        { status: 400 }
      )
    }

    if (sanitizedMessage.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `La descripción no puede exceder ${MAX_DESCRIPTION_LENGTH} caracteres` },
        { status: 400 }
      )
    }

    // Verificar rate limiting
    const canProceed = await checkRateLimit(session!.user!.id)
    if (!canProceed) {
      return NextResponse.json(
        { error: `Has alcanzado el límite de ${MAX_ADVISORIES_PER_MONTH} asesorías por mes` },
        { status: 429 }
      )
    }

    // Crear advisory con mensaje inicial
    const advisory = await prisma.premiumAdvisory.create({
      data: {
        userId: session!.user!.id,
        fullName: fullName.trim(),
        birthDate: birthDateObj,
        weeksContributed,
        lastSalary,
        contactMethod,
        phoneNumber: contactMethod === 'whatsapp' ? phoneNumber?.trim() : null,
        status: 'pending',
        messages: {
          create: {
            senderType: 'user',
            senderId: session!.user!.id,
            message: sanitizedMessage,
            isRead: false
          }
        }
      },
      include: {
        messages: true
      }
    })

    // TODO: Enviar notificación por email al admin (Fase 6)

    return NextResponse.json(
      {
        success: true,
        message: "Asesoría creada exitosamente. Recibirás respuesta en un máximo de 24 horas.",
        advisory
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error al crear asesoría Premium:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// GET - Listar asesorías del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Validar usuario Premium
    const validation = await validatePremiumUser(session)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.error === "No autenticado" ? 401 : 403 }
      )
    }

    const advisories = await prisma.premiumAdvisory.findMany({
      where: {
        userId: session!.user!.id
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        _count: {
          select: {
            messages: {
              where: {
                senderType: 'admin',
                isRead: false
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      advisories: advisories.map(advisory => ({
        ...advisory,
        unreadCount: advisory._count.messages,
        lastMessage: advisory.messages[0] || null
      }))
    })
  } catch (error: any) {
    console.error("Error al listar asesorías:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
