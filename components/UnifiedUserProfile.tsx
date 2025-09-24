'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, ChevronDown, LogOut, Settings, BarChartIcon, FileTextIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface UnifiedUserProfileProps {
  className?: string;
  variant?: 'desktop' | 'mobile';
}

export default function UnifiedUserProfile({ 
  className, 
  variant = 'desktop' 
}: UnifiedUserProfileProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Ensure component is mounted on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const user = session?.user as any;
  const isAuthenticated = status === 'authenticated' && !!user;
  const isLoading = status === 'loading';

  const handleLogout = useCallback(async () => {
    try {
      console.log('🔄 Starting logout process...');
      setIsDropdownOpen(false);
      
      // Clear any local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('auth-token');
        localStorage.removeItem('session-token');
      }
      
      // Sign out from NextAuth
      await signOut({ 
        callbackUrl: '/', 
        redirect: true 
      });
      
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Fallback to manual redirect
      router.push('/');
    }
  }, [router]);

  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen) {
        const target = event.target as Element;
        if (!target.closest('[data-user-profile]')) {
          closeDropdown();
        }
      }
    };

    if (isMounted) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen, closeDropdown, isMounted]);

  // Don't render until mounted to prevent hydration issues
  if (!isMounted) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="hidden sm:block">
          <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  const userInitials = user.name ? user.name.charAt(0).toUpperCase() : 'U';
  const displayName = user.name || 'User';
  const userRole = user.role || 'User';

  if (variant === 'mobile') {
    return (
      <div className={cn("relative", className)} data-user-profile>
        {/* Mobile User Profile Trigger */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 min-h-[44px] min-w-[44px] touch-target"
          aria-label="User profile menu"
          aria-expanded={isDropdownOpen}
        >
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {userInitials}
            </span>
          </div>
          <ChevronDown 
            className={cn(
              "w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0",
              isDropdownOpen && "rotate-180"
            )}
          />
        </button>

        {/* Mobile Backdrop */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-25 z-[9998]"
              onClick={closeDropdown}
            />
          )}
        </AnimatePresence>

        {/* Mobile User Profile Dropdown */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed top-16 right-4 w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] max-h-[calc(100vh-5rem)] overflow-y-auto"
            >
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {userInitials}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-600 truncate mt-0.5">{user.email}</p>
                    <p className="text-xs text-gray-500 capitalize mt-1 font-normal">{userRole}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={() => {
                    router.push('/profile');
                    closeDropdown();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-4 text-gray-700 hover:bg-gray-50 transition-colors min-h-[48px] touch-target"
                >
                  <User className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Profile</span>
                </button>

                <button
                  onClick={() => {
                    router.push('/settings');
                    closeDropdown();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-4 text-gray-700 hover:bg-gray-50 transition-colors min-h-[48px] touch-target"
                >
                  <Settings className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Settings</span>
                </button>

                {userRole === 'jobseeker' && (
                  <button
                    onClick={() => {
                      router.push('/dashboard/jobseeker');
                      closeDropdown();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-4 text-gray-700 hover:bg-gray-50 transition-colors min-h-[48px] touch-target"
                  >
                    <BarChartIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">Dashboard</span>
                  </button>
                )}

                {userRole === 'employer' && (
                  <button
                    onClick={() => {
                      router.push('/dashboard/company');
                      closeDropdown();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-4 text-gray-700 hover:bg-gray-50 transition-colors min-h-[48px] touch-target"
                  >
                    <BarChartIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">Dashboard</span>
                  </button>
                )}

                {userRole === 'admin' && (
                  <button
                    onClick={() => {
                      router.push('/dashboard/admin');
                      closeDropdown();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-4 text-gray-700 hover:bg-gray-50 transition-colors min-h-[48px] touch-target"
                  >
                    <BarChartIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">Admin Dashboard</span>
                  </button>
                )}

                <div className="border-t border-gray-100 my-2"></div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-4 text-red-600 hover:bg-red-50 transition-colors min-h-[48px] touch-target font-medium"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop variant
  return (
    <div className={cn("relative", className)} data-user-profile>
      {/* Desktop User Profile Trigger */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px] touch-target"
        aria-label="User profile menu"
        aria-expanded={isDropdownOpen}
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-xs sm:text-sm">
            {userInitials}
          </span>
        </div>
        <ChevronDown 
          className={cn(
            "w-3 h-3 sm:w-4 sm:h-4 text-gray-500 transition-transform duration-200 flex-shrink-0",
            isDropdownOpen && "rotate-180"
          )}
        />
      </button>

      {/* Desktop User Profile Dropdown */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] max-h-[calc(100vh-5rem)] overflow-y-auto"
          >
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {userInitials}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-none">{displayName}</p>
                  <p className="text-xs text-gray-600 truncate max-w-[200px] sm:max-w-none mt-0.5">{user.email}</p>
                  <p className="text-xs text-gray-500 capitalize mt-1 font-normal">{userRole}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  router.push('/profile');
                  closeDropdown();
                }}
                className="w-full flex items-center gap-3 px-4 py-4 text-gray-700 hover:bg-gray-50 transition-colors text-left min-h-[48px] touch-target"
              >
                <User className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium truncate">Profile</span>
              </button>

              <button
                onClick={() => {
                  router.push('/settings');
                  closeDropdown();
                }}
                className="w-full flex items-center gap-3 px-4 py-4 text-gray-700 hover:bg-gray-50 transition-colors text-left min-h-[48px] touch-target"
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium truncate">Settings</span>
              </button>

              {userRole === 'jobseeker' && (
                <button
                  onClick={() => {
                    router.push('/dashboard/jobseeker');
                    closeDropdown();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-4 text-gray-700 hover:bg-gray-50 transition-colors text-left min-h-[48px] touch-target"
                >
                  <BarChartIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">Dashboard</span>
                </button>
              )}

              {userRole === 'employer' && (
                <button
                  onClick={() => {
                    router.push('/dashboard/company');
                    closeDropdown();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-4 text-gray-700 hover:bg-gray-50 transition-colors text-left min-h-[48px] touch-target"
                >
                  <BarChartIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">Dashboard</span>
                </button>
              )}

              {userRole === 'admin' && (
                <button
                  onClick={() => {
                    router.push('/dashboard/admin');
                    closeDropdown();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-4 text-gray-700 hover:bg-gray-50 transition-colors text-left min-h-[48px] touch-target"
                >
                  <BarChartIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">Admin Dashboard</span>
                </button>
              )}

              <div className="border-t border-gray-100 my-2"></div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-4 text-red-600 hover:bg-red-50 transition-colors text-left min-h-[48px] touch-target font-medium"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium truncate">Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
