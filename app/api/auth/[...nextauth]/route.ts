import handler from "@/lib/nextauth-config"

// Export handlers for Next.js App Router
// The handler is already created in nextauth-config.ts
export const GET = handler
export const POST = handler

// Also export the handler for backward compatibility
export default handler
