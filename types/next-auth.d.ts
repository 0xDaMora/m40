import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      authProvider: string
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    authProvider: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    authProvider: string
  }
}
