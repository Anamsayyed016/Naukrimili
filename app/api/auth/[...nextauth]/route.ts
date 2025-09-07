import NextAuth from 'next-auth'
import { authOptions } from '@/lib/nextauth-config'
import { NextRequest } from 'next/server'

const handler = NextAuth(authOptions)

export async function GET(request: NextRequest) {
  return handler(request)
}

export async function POST(request: NextRequest) {
  return handler(request)
}





