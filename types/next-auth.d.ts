import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      authProvider: string
      subscription?: string
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    authProvider: string
    subscription?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    authProvider: string
    subscription?: string
  }
}
