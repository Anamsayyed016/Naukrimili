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
  
  // Only access localStorage on client side
  if (typeof window === 'undefined') return null;
  
  try {
    const storedUser = localStorage.getItem('bypass-user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.warn('Error reading bypass session:', error);
    return null;
  }
};

export const setBypassSession = (user: any) => {
  if (!isAuthDisabled()) return;
  
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('bypass-user', JSON.stringify(user));
    } catch (error) {
      console.warn('Error setting bypass session:', error);
    }
  }
};

export const clearBypassSession = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('bypass-user');
    } catch (error) {
      console.warn('Error clearing bypass session:', error);
    }
  }
};
