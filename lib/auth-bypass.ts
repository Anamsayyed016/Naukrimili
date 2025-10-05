/**
 * Authentication Bypass System
 * Safely disables authentication while preserving all functionality
 */

import { env } from './env';

export const isAuthDisabled = () => {
  return env.AUTH_DISABLED === true || env.NEXT_PUBLIC_DISABLE_AUTH === true;
};

export const createBypassUser = (email: string, role: string) => {
  return {
    id: `bypass-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email,
    role,
    name: email.split('@')[0],
    isActive: true,
    isVerified: true,
    isBypassUser: true,
    createdAt: new Date(),
  };
};

export const getBypassSession = () => {
  if (!isAuthDisabled()) return null;
  
  const storedUser = typeof window !== 'undefined' 
    ? localStorage.getItem('bypass-user')
    : null;
    
  return storedUser ? JSON.parse(storedUser) : null;
};

export const setBypassSession = (user: any) => {
  if (!isAuthDisabled()) return;
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('bypass-user', JSON.stringify(user));
  }
};

export const clearBypassSession = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bypass-user');
  }
};
