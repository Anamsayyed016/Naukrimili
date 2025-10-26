import { handler } from "@/lib/nextauth-config"
import type { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: { nextauth: string[] } }
) {
  return handler(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: { nextauth: string[] } }
) {
  return handler(request, context);
}
