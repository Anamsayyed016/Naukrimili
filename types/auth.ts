import type { ReactNode } from 'react'

export type UserRole = 'jobseeker' | 'employer' | 'admin' | 'company'

export interface User {
  id: string
  name: string | null
  email: string | null
  image?: string | null
  role: UserRole
  profileCompletion: number
  createdAt?: Date
  updatedAt?: Date
}

export interface Credentials {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken?: string
}

export interface AuthError {
  message: string
  code?: string
}

export interface RegistrationData {
  email: string
  password: string
  name: string
  role: Exclude<UserRole, 'company'> | 'employer'
  company?: {
    name: string
    website?: string
    industry?: string
  }
}

export interface PasswordResetRequest { email: string }
export interface PasswordResetConfirm { token: string; newPassword: string }
export interface EmailVerification { token: string }

export interface Session {
  user: {
    id: string
    email: string
    name: string
    role: string
  }
  expires: string
  accessToken: string
}

export interface TokenPayload {
  userId: string
  email: string
  role: string
  iat: number
  exp: number
}

export interface BiometricState {
  isAvailable: boolean
  isEnabled: boolean
  toggle: () => Promise<boolean>
  verify: () => Promise<boolean>
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  biometric: BiometricState
  signIn: (credentials: Credentials) => Promise<any>
}

export interface AuthProviderProps { children: ReactNode }