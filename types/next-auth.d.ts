import 'next-auth'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    user: DefaultSession['user'] & {
      id: string
      role?: string
      firstName?: string
      lastName?: string
    }
  }
  interface User {
    id: string
    role?: string
    firstName?: string
    lastName?: string
  }
}