'use client';

import { useState } from 'react';
import { User, ChevronDown, LogOut, Settings, BarChartIcon, FileTextIcon } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MobileUserProfileProps {
  className?: string;
}

export default function MobileUserProfile({ className }: MobileUserProfileProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const user = session?.user as any;
  const isAuthenticated = status === 'authenticated' && !!user;

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/', redirect: true });
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Mobile User Profile Trigger */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-2 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-label="User profile menu"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-sm">
            {(user.firstName || user.name) ? (user.firstName || user.name).charAt(0).toUpperCase() : 'U'}
          </span>
        </div>
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0",
            isDropdownOpen && "rotate-180"
          )}
        />
      </button>

      {/* Mobile User Profile Dropdown */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
          >
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-600 truncate mt-0.5">{user.email}</p>
                  <p className="text-xs text-gray-500 capitalize mt-1 font-normal">{user.role}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  router.push('/profile');
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="text-sm">Profile</span>
              </button>

              <button
                onClick={() => {
                  router.push('/settings');
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">Settings</span>
              </button>

              {user.role === 'jobseeker' && (
                <button
                  onClick={() => {
                    router.push('/dashboard/jobseeker');
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <BarChartIcon className="w-4 h-4" />
                  <span className="text-sm">Dashboard</span>
                </button>
              )}

              {user.role === 'employer' && (
                <button
                  onClick={() => {
                    router.push('/employer/dashboard');
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <BarChartIcon className="w-4 h-4" />
                  <span className="text-sm">Dashboard</span>
                </button>
              )}

              <div className="border-t border-gray-100 my-2"></div>

              <button
                onClick={() => {
                  handleLogout();
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
