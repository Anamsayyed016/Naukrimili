"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

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
    
    // Check for stored auth data on component mount
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Sync with NextAuth session when available
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // If NextAuth session is available, use it instead of stored data
      const nextAuthUser: User = {
        id: session.user.id || '',
        name: session.user.name || '',
        email: session.user.email || '',
        role: (session.user as any)?.role || 'jobseeker',
        isVerified: true,
        isActive: true,
        // Add other fields as needed
      };
      
      setUser(nextAuthUser);
      setToken('nextauth-session'); // Use a placeholder for NextAuth sessions
      
      // Clear stored data since we're using NextAuth
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } else if (status === 'unauthenticated') {
      // If NextAuth session is not available, check stored data
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
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
