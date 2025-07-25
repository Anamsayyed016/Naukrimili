"use client";

import { SessionProvider } from "next-auth/react";
import ReactQueryProvider from "@/components/ReactQueryProvider";
import { AuthProvider } from "@/components/auth/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { CandidateProvider } from "@/context/CandidateContext";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ReactQueryProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <CandidateProvider>
              {children}
            </CandidateProvider>
          </AuthProvider>
        </ThemeProvider>
      </ReactQueryProvider>
    </SessionProvider>
  );
}
