import handler from "@/lib/nextauth-config"
import type { NextRequest } from 'next/server'

// Export handlers for Next.js App Router
// NextAuth v4 handler function works as both GET and POST handler
export async function GET(request: NextRequest) {
  console.log('🔍 NextAuth GET request:', request.url);
  return handler(request);
}

export async function POST(request: NextRequest) {
  console.log('🔍 NextAuth POST request:', request.url);
  return handler(request);
}
