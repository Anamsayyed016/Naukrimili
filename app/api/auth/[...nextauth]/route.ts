import handler from "@/lib/nextauth-config"
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return handler.GET(request)
}

export async function POST(request: NextRequest) {
  return handler.POST(request)
}
