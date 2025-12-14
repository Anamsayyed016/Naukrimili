
import NextAuth from "next-auth";
import nextAuthConfig from "@/lib/nextauth-config";

const handler = NextAuth(nextAuthConfig);

export { handler as GET, handler as POST };
