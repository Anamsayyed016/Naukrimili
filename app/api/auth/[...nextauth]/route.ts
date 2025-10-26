import type { NextRequest } from 'next/server'
import handler from '@/lib/nextauth-config'

export async function GET(request: NextRequest, context: { params: { nextauth: string[] } }) {
  return handler(request)
}

export async function POST(request: NextRequest, context: { params: { nextauth: string[] } }) {
  return handler(request)
}
