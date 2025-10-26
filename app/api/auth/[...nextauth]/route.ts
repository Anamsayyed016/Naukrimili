import { NextRequest } from 'next/server'
import NextAuth from "@/lib/nextauth-config"

export const GET = async (req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) => {
  return NextAuth(req as any, context as any)
}

export const POST = async (req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) => {
  return NextAuth(req as any, context as any)
}
