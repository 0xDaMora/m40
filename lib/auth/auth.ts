import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Si es un usuario de Google, verificar si ya existe
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })

        if (existingUser) {
          // Si el usuario existe pero se registró con email, actualizar authProvider
          if (existingUser.authProvider === 'email') {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { 
                authProvider: 'google',
                image: user.image
              }
            })
          }
        } else {
          // Crear nuevo usuario de Google
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name!,
              authProvider: 'google',
              image: user.image
            }
          })
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Para usuarios de Google, necesitamos obtener el ID real de la base de datos
        if (account?.provider === 'google') {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })
          if (dbUser) {
            token.id = dbUser.id
          } else {
            token.id = user.id
          }
        } else {
          token.id = user.id
        }
        token.authProvider = account?.provider || 'credentials'
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.authProvider = token.authProvider as string
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
  }
}
