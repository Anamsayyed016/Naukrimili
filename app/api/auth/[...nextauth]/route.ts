import { handlers } from "@/lib/nextauth-config"

// Safety check - ensure handlers are defined
if (!handlers || !handlers.GET || !handlers.POST) {
  console.error('❌ NextAuth handlers are not properly initialized');
  throw new Error('NextAuth handlers not available');
}

// Export NextAuth handlers directly - no wrapping to avoid interference
export const { GET, POST } = handlers