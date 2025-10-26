import NextAuthHandler from "@/lib/nextauth-config"
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  return NextAuthHandler(req)
}

export async function POST(req: NextRequest) {
  return NextAuthHandler(req)
}
