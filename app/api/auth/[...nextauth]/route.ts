import { handlers } from "@/lib/nextauth-config"
import { NextRequest } from "next/server"

// Wrap handlers with error handling to prevent Configuration errors
async function handleGET(request: NextRequest) {
  try {
    // Check if handlers are available
    if (!handlers || !handlers.GET) {
      console.error('❌ NextAuth handlers not available');
      const url = new URL(request.url);
      return Response.redirect(new URL('/auth/error?error=Configuration', url.origin));
    }
    return await handlers.GET(request);
  } catch (error: any) {
    console.error('❌ NextAuth GET handler error:', error?.message);
    console.error('Error stack:', error?.stack);
    // If it's a Configuration error, redirect to error page with details
    if (error?.message?.includes('Configuration') || error?.message?.includes('provider')) {
      const url = new URL(request.url);
      return Response.redirect(new URL(`/auth/error?error=Configuration&details=${encodeURIComponent(error?.message || 'Unknown error')}`, url.origin));
    }
    // For other errors, return 500
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: error?.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handlePOST(request: NextRequest) {
  try {
    // Check if handlers are available
    if (!handlers || !handlers.POST) {
      console.error('❌ NextAuth handlers not available');
      const url = new URL(request.url);
      return Response.redirect(new URL('/auth/error?error=Configuration', url.origin));
    }
    return await handlers.POST(request);
  } catch (error: any) {
    console.error('❌ NextAuth POST handler error:', error?.message);
    console.error('Error stack:', error?.stack);
    // If it's a Configuration error, redirect to error page with details
    if (error?.message?.includes('Configuration') || error?.message?.includes('provider')) {
      const url = new URL(request.url);
      return Response.redirect(new URL(`/auth/error?error=Configuration&details=${encodeURIComponent(error?.message || 'Unknown error')}`, url.origin));
    }
    // For other errors, return 500
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: error?.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const GET = handleGET;
export const POST = handlePOST;