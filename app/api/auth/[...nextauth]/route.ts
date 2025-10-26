import { handler } from "@/lib/nextauth-config"
import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { nextauth: string[] } }
) {
  return await handler(request, { params });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { nextauth: string[] } }
) {
  return await handler(request, { params });
}
