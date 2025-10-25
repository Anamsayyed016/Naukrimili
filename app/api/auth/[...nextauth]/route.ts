import { handlers } from "@/lib/nextauth-config"

// Export NextAuth handlers directly - no wrapping to avoid interference
export const { GET, POST } = handlers