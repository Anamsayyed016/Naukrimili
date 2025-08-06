import React from "react";
"use client";
import { createContext, useContext } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { AuthState } from "@/types/auth";

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>)}

export function useAuthContext(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider")}
  return context} 