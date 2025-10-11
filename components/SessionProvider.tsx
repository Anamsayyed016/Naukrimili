"use client";

import React, { ReactNode } from "react";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

interface SessionProviderProps {
  children: ReactNode;
}

export default function SessionProvider({
  children
}: SessionProviderProps) {
  return (
    <NextAuthSessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      {children}
    </NextAuthSessionProvider>
  );
}
