import handler from "@/lib/nextauth-config"
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest, context: { params: { nextauth: string[] } }) {
  return (handler as any).GET(request)
}

export async function POST(request: NextRequest, context: { params: { nextauth: string[] } }) {
  return (handler as any).POST(request)
}
