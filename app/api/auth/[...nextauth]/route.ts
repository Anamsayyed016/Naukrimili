import handler from "@/lib/nextauth-config"

// CRITICAL: For NextAuth v4 with Next.js App Router
// NextAuth() returns a single handler function that works for both GET and POST
// Export it directly as both GET and POST - this preserves NextAuth's internal request parsing
export { handler as GET, handler as POST }
