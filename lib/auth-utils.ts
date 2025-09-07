import { auth } from "./nextauth-config";
import { prisma } from "./prisma";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export interface CompanyUser extends AuthUser {
  company: {
    id: string;
    name: string;
    description?: string;
    logo?: string;
    website?: string;
    location?: string;
    industry?: string;
    size?: string;
    founded?: number;
    isVerified: boolean;
  };
}

/**
 * Get authenticated user session with proper type conversion
 */
export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return null;
    }

    // Use string ID directly
    const userId = session.user.id as string;
    if (!userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    return user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Get authenticated employer user with company information
 */
export async function getAuthenticatedEmployer(): Promise<CompanyUser | null> {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== "employer") {
      return null;
    }

    const employerWithCompany = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        createdCompanies: {
          select: {
            id: true,
            name: true,
            description: true,
            logo: true,
            website: true,
            location: true,
            industry: true,
            size: true,
            founded: true,
            isVerified: true
          }
        }
      }
    });

    if (!employerWithCompany || !employerWithCompany.createdCompanies.length) {
      return null;
    }

    return {
      ...user,
      company: employerWithCompany.createdCompanies[0]
    };
  } catch (error) {
    console.error('Error getting authenticated employer:', error);
    return null;
  }
}

/**
 * Require authentication and return user or error
 */
export async function requireAuth(): Promise<{ user: AuthUser } | { error: string; status: number }> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }
  return { user };
}

/**
 * Require employer authentication and return user with company or error
 */
export async function requireEmployerAuth(): Promise<{ user: CompanyUser } | { error: string; status: number }> {
  const user = await getAuthenticatedEmployer();
  if (!user) {
    return { error: "Access denied. Employer account required.", status: 403 };
  }
  return { user };
}

/**
 * Require admin authentication
 */
export async function requireAdminAuth(): Promise<{ user: AuthUser } | { error: string; status: number }> {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "admin") {
    return { error: "Access denied. Admin account required.", status: 403 };
  }
  return { user };
}

/**
 * Authentication Utility Functions
 * Comprehensive browser storage clearing and session management
 */

/**
 * Clear all browser authentication data and storage
 * This function aggressively removes all auth-related data from the browser
 */
export function clearAllBrowserAuthData(): void {
  if (typeof window === 'undefined') return;

  try {
    // Clear all localStorage
    localStorage.clear();
    
    // Clear all sessionStorage
    sessionStorage.clear();
    
    // Clear all cookies for the current domain
    clearAllCookies();
    
    // Clear IndexedDB if available
    clearIndexedDB();
    
    // Clear Service Worker registrations
    clearServiceWorkers();
    
    // Force clear any remaining auth-related data
    clearRemainingAuthData();
    
    console.log('✅ All browser authentication data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing browser auth data:', error);
  }
}

/**
 * Clear all cookies for the current domain
 */
function clearAllCookies(): void {
  try {
    const cookies = document.cookie.split(';');
    
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // Remove cookie by setting it to expire in the past
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
      
      // Also try to remove with various path combinations
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/api`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/auth`;
    });
    
    console.log('🍪 All cookies cleared');
  } catch (error) {
    console.error('❌ Error clearing cookies:', error);
  }
}

/**
 * Clear IndexedDB if available
 */
function clearIndexedDB(): void {
  try {
    if ('indexedDB' in window) {
      // Clear all IndexedDB databases
      indexedDB.databases().then(databases => {
        databases.forEach(db => {
          if (db.name) {
            const deleteRequest = indexedDB.deleteDatabase(db.name);
            deleteRequest.onsuccess = () => console.log(`🗄️ IndexedDB database ${db.name} deleted`);
            deleteRequest.onerror = () => console.log(`⚠️ Failed to delete IndexedDB database ${db.name}`);
          }
        });
      });
    }
  } catch (error) {
    console.error('❌ Error clearing IndexedDB:', error);
  }
}

/**
 * Clear Service Worker registrations
 */
function clearServiceWorkers(): void {
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
          console.log('🔧 Service Worker unregistered');
        });
      });
    }
  } catch (error) {
    console.error('❌ Error clearing Service Workers:', error);
  }
}

/**
 * Clear any remaining auth-related data that might be cached
 */
function clearRemainingAuthData(): void {
  try {
    // Clear any cached data in memory
    if (window.caches) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
          console.log(`🗑️ Cache ${cacheName} cleared`);
        });
      });
    }
    
    // Clear any remaining localStorage items that might have been missed
    Object.keys(localStorage).forEach(key => {
      if (key.includes('auth') || key.includes('user') || key.includes('token') || 
          key.includes('session') || key.includes('next') || key.includes('oauth')) {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed localStorage item: ${key}`);
      }
    });
    
    // Clear any remaining sessionStorage items
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('auth') || key.includes('user') || key.includes('token') || 
          key.includes('session') || key.includes('next') || key.includes('oauth')) {
        sessionStorage.removeItem(key);
        console.log(`🗑️ Removed sessionStorage item: ${key}`);
      }
    });
  } catch (error) {
    console.error('❌ Error clearing remaining auth data:', error);
  }
}

/**
 * Force refresh the page and clear all caches
 */
export function forceRefreshAndClear(): void {
  try {
    // Clear all auth data first
    clearAllBrowserAuthData();
    
    // Force reload the page without cache
    window.location.reload();
  } catch (error) {
    console.error('❌ Error during force refresh:', error);
    // Fallback to regular reload
    window.location.reload();
  }
}

/**
 * Clear authentication data and redirect to a specific URL
 */
export function clearAuthAndRedirect(url: string = '/'): void {
  try {
    clearAllBrowserAuthData();
    window.location.href = url;
  } catch (error) {
    console.error('❌ Error during auth clear and redirect:', error);
    window.location.href = url;
  }
}

/**
 * Check if there are any remaining authentication artifacts
 */
export function checkRemainingAuthData(): {
  hasLocalStorage: boolean;
  hasSessionStorage: boolean;
  hasCookies: boolean;
  remainingItems: string[];
} {
  if (typeof window === 'undefined') {
    return {
      hasLocalStorage: false,
      hasSessionStorage: false,
      hasCookies: false,
      remainingItems: []
    };
  }

  const remainingItems: string[] = [];
  
  // Check localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.includes('auth') || key.includes('user') || key.includes('token') || 
        key.includes('session') || key.includes('next') || key.includes('oauth')) {
      remainingItems.push(`localStorage: ${key}`);
    }
  });
  
  // Check sessionStorage
  Object.keys(sessionStorage).forEach(key => {
    if (key.includes('auth') || key.includes('user') || key.includes('token') || 
        key.includes('session') || key.includes('next') || key.includes('oauth')) {
      remainingItems.push(`sessionStorage: ${key}`);
    }
  });
  
  // Check cookies
  const cookies = document.cookie.split(';');
  cookies.forEach(cookie => {
    const name = cookie.split('=')[0]?.trim();
    if (name && (name.includes('auth') || name.includes('user') || name.includes('token') || 
        name.includes('session') || name.includes('next') || name.includes('oauth'))) {
      remainingItems.push(`cookie: ${name}`);
    }
  });

  return {
    hasLocalStorage: remainingItems.some(item => item.startsWith('localStorage:')),
    hasSessionStorage: remainingItems.some(item => item.startsWith('sessionStorage:')),
    hasCookies: remainingItems.some(item => item.startsWith('cookie:')),
    remainingItems
  };
}

/**
 * Generate a new NEXTAUTH_SECRET for development/testing
 * This will invalidate all existing sessions
 */
export function generateNewAuthSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
