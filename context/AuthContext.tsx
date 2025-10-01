"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  role: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  profilePicture?: string;
  isVerified?: boolean;
  isActive?: boolean;
  isNewUser?: boolean; // Flag to track if user is new (OAuth registration)
  companyName?: string;
  recruiterName?: string;
  companyWebsite?: string;
  companyIndustry?: string;
  companySize?: string;
  companyFounded?: number;
  locationPreference?: string;
  salaryExpectation?: number;
  jobTypePreference?: string[];
  remotePreference?: boolean;
  joinedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, authToken: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isMounted: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    // Set mounted state to prevent hydration mismatch
    setIsMounted(true);
    
    // Don't automatically restore stored auth data - require explicit login
    // This prevents auto-login behavior
  }, []);

  // Only render children after component is mounted to prevent hydration mismatch
  if (!isMounted) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  // Sync with NextAuth session when available
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const user = session.user as any;
      
      // Only authenticate if user has a valid role and is active
      if (user.role && user.isActive !== false) {
        // Check if user requires OTP verification for Google OAuth
        if (user.requiresOTP && user.otpPurpose === 'gmail-oauth') {
          // User is in Google OAuth OTP verification flow - don't set as authenticated yet
          setUser(null);
          setToken(null);
          console.log('🔐 Google OAuth user requires OTP verification, not setting as authenticated');
        } else {
          // User is fully authenticated
          const nextAuthUser: User = {
            id: session.user.id || '',
            name: session.user.name || '',
            email: session.user.email || '',
            role: user?.role || 'jobseeker',
            isVerified: user?.isVerified !== false, // Use session verification status
            isActive: true,
            isNewUser: user?.isNewUser || false, // Track if user is new (OAuth registration)
            // Add other fields as needed
          };
          
          setUser(nextAuthUser);
          setToken('nextauth-session'); // Use a placeholder for NextAuth sessions
          
          // Show welcome notification for new OAuth users (only once per session)
          if (user?.isNewUser && !sessionStorage.getItem('welcome-shown')) {
            toast({
              title: "🎉 Welcome to Naukrimili!",
              description: "You have successfully connected to Naukrimili! Start exploring job opportunities.",
              duration: 5000,
            });
            // Mark welcome as shown for this session
            sessionStorage.setItem('welcome-shown', 'true');
          }
          
          // Clear stored data since we're using NextAuth
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } else {
        // User doesn't have a role or is inactive, clear auth state
        console.log('🔐 User has no role or is inactive, clearing auth state');
        setUser(null);
        setToken(null);
      }
    } else if (status === 'unauthenticated') {
      // If NextAuth session is not available, clear auth state
      // Don't restore from localStorage to prevent auto-login
      setUser(null);
      setToken(null);
    }
  }, [session, status]);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user && !!token,
    isMounted,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
