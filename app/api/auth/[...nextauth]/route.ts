import handler from "@/lib/nextauth-config"
import type { NextRequest } from 'next/server'

// Export handlers for Next.js App Router
// NextAuth v4 handler function works as both GET and POST handler
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 NextAuth GET request:', request.url);
    console.log('📋 Environment check:', {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    });
    
    const response = await handler(request);
    return response;
  } catch (error: any) {
    console.error('❌ NextAuth GET error:', error);
    console.error('❌ Error stack:', error?.stack);
    console.error('❌ Error details:', {
      message: error?.message,
      name: error?.name,
      cause: error?.cause,
    });
    
    // Return proper error response
    return new Response(
      JSON.stringify({ 
        error: 'Authentication failed',
        message: error?.message || 'Internal server error',
        // Only show details in development
        ...(process.env.NODE_ENV !== 'production' && { stack: error?.stack })
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 NextAuth POST request:', request.url);
    console.log('📋 Environment check:', {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    });
    
    const response = await handler(request);
    return response;
  } catch (error: any) {
    console.error('❌ NextAuth POST error:', error);
    console.error('❌ Error stack:', error?.stack);
    console.error('❌ Error details:', {
      message: error?.message,
      name: error?.name,
      cause: error?.cause,
    });
    
    // Return proper error response
    return new Response(
      JSON.stringify({ 
        error: 'Authentication failed',
        message: error?.message || 'Internal server error',
        // Only show details in development
        ...(process.env.NODE_ENV !== 'production' && { stack: error?.stack })
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
