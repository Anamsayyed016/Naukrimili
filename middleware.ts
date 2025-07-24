import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /about, /api/uploads)
  const path = request.nextUrl.pathname

  // If it's the upload API route
  if (path.startsWith('/api/resumes/upload')) {
    const response = NextResponse.next()

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

    return response
  }

  // Continue with the request
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
