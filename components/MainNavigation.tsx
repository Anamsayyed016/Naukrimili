'use client';
import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Bell,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  BriefcaseIcon,
  BuildingIcon,
  FileTextIcon,
  BarChartIcon,
  Brain,
  Home,
  Upload,
  Search,
  ChevronDown,
  Heart,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import UnifiedUserProfile from "./UnifiedUserProfile";
import { NotificationBell } from "./NotificationBell";
import { ComprehensiveNotificationBell } from "./ComprehensiveNotificationBell";
import { MessageBell } from "./MessageBell";

interface MainNavigationProps {
  brandName?: string;
}

export default function MainNavigation({
  brandName = "NaukriMili"
}: MainNavigationProps) {
  
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { data: session, status } = useSession();
  
  // Derived state from session
  const user = session?.user as any; // Type assertion for role property
  const isAuthenticated = status === 'authenticated' && !!user;
  const isMounted = status !== 'loading';

  // Check if screen is mobile size - prevent hydration issues
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileSize = window.innerWidth < 1024;
      setIsMobile(isMobileSize);
      
      // Close mobile menu when switching to desktop
      if (!isMobileSize && isMenuOpen) {
        setIsMenuOpen(false);
      }
      
      // Close dropdown when switching to mobile
      if (isMobileSize && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };
    
    // Only run on client side
    if (typeof window !== 'undefined') {
      checkScreenSize();
      window.addEventListener('resize', checkScreenSize);
      return () => window.removeEventListener('resize', checkScreenSize);
    }
  }, [isMenuOpen, isDropdownOpen]);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
  const closeDropdown = useCallback(() => setIsDropdownOpen(false), []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut({ 
        callbackUrl: '/',
        redirect: true 
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback to manual redirect
      router.push('/');
    }
  }, [router]);

  const navLinks = useMemo(() => {
    // Keep main navigation clean and professional - only public pages
    return [
      { title: "Home", href: "/", icon: Home },
      { title: "Jobs", href: "/jobs", icon: BriefcaseIcon },
      { title: "Companies", href: "/companies", icon: BuildingIcon }
    ];
  }, []);

  // Role-specific links for dropdown menus
  const roleSpecificLinks = useMemo(() => {
    if (!isMounted || !isAuthenticated || !user?.role) return [];

    if (user.role === 'employer') {
      return [
        { title: "Dashboard", href: "/employer/dashboard", icon: BarChartIcon, description: "View analytics and insights" },
        { title: "Post Job", href: "/employer/jobs/create", icon: BriefcaseIcon, description: "Create new job posting" },
        { title: "Manage Jobs", href: "/employer/jobs", icon: FileTextIcon, description: "View and edit job postings" },
        { title: "Applications", href: "/employer/applications", icon: Users, description: "Review job applications" },
        { title: "Company Profile", href: "/employer/company/profile", icon: BuildingIcon, description: "Update company info" }
      ];
    } else if (user.role === 'jobseeker') {
      return [
        { title: "Dashboard", href: "/dashboard/jobseeker", icon: BarChartIcon, description: "View your activity" },
        { title: "My Resumes", href: "/dashboard/jobseeker/resumes", icon: FileTextIcon, description: "Manage your resumes" },
        { title: "Applications", href: "/dashboard/jobseeker/applications", icon: BriefcaseIcon, description: "Track your applications" },
        { title: "Bookmarks", href: "/dashboard/jobseeker/bookmarks", icon: Heart, description: "Saved jobs" }
      ];
    }
    return [];
  }, [isMounted, isAuthenticated, user?.role]);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Brand - Clean Text Only */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-all duration-300 group">
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {brandName}
            </span>
          </Link>

          {/* Main Navigation - Enhanced Desktop */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-300",
                  pathname === link.href && "text-blue-600 bg-blue-50 font-medium"
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.title}
              </Link>
            ))}

            {/* Role-specific dropdown for authenticated users */}
            {isMounted && isAuthenticated && user?.role && roleSpecificLinks.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-300"
                  >
                    <span className="font-medium">
                      {user.role === 'employer' ? 'For Employers' : 'For Job Seekers'}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64">
                  {roleSpecificLinks.map((link) => (
                    <DropdownMenuItem key={link.title} asChild>
                      <Link
                        href={link.href}
                        className="flex items-start gap-3 px-3 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <link.icon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">{link.title}</div>
                          <div className="text-sm text-gray-500 mt-0.5">{link.description}</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Desktop Right Side - Enhanced User Actions */}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-4">
            {/* Desktop Notifications */}
            <ComprehensiveNotificationBell />

            {/* Desktop Messages */}
            <MessageBell />

            {/* Desktop Authentication Section */}
            {isMounted && isAuthenticated && user ? (
              <UnifiedUserProfile variant="desktop" />
            ) : (
              // Desktop Auth Buttons
              <>
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-300 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white rounded-xl transition-all duration-300 font-medium hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Navigation - REACT STATE APPROACH */}
          {isMounted && isMobile && (
            <div className="flex items-center">
            {/* Mobile Notifications - Show when logged in */}
            {isMounted && isAuthenticated && user && (
              <div className="mr-2">
                <ComprehensiveNotificationBell />
              </div>
            )}
            
            {/* Mobile Messages - Show when logged in */}
            {isMounted && isAuthenticated && user && (
              <div className="mr-2">
                <MessageBell />
              </div>
            )}

            {/* Mobile User Profile - Show when logged in */}
            {isMounted && isAuthenticated && user && (
              <div className="mr-3">
                <UnifiedUserProfile variant="mobile" />
              </div>
            )}
            
            {/* Mobile Menu Button - ALWAYS VISIBLE ON MOBILE */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center justify-center w-12 h-12 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{ 
                display: 'flex',
                visibility: 'visible',
                opacity: 1,
                minWidth: '48px',
                minHeight: '48px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
              aria-label="Toggle mobile menu"
              aria-expanded={isMenuOpen}
            >
              <motion.div
                animate={{ rotate: isMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.div>
            </button>
            </div>
          )}
        </div>

        {/* Enhanced Mobile Menu */}
        {isMounted && isMobile && isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200/50 py-6 bg-white/95 backdrop-blur-md"
          >
            <div className="space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center gap-3 px-4 py-4 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-300 touch-target",
                    pathname === link.href && "text-blue-600 bg-blue-50 font-medium"
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  {link.title}
                </Link>
              ))}

              {/* Role-specific features for mobile */}
              {isMounted && isAuthenticated && user?.role && roleSpecificLinks.length > 0 && (
                <div className="px-4 py-3 space-y-2 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-500 mb-3">
                    {user.role === 'employer' ? 'For Employers' : 'For Job Seekers'}
                  </div>
                  {roleSpecificLinks.map((link) => (
                    <Link
                      key={link.title}
                      href={link.href}
                      onClick={closeMenu}
                      className="flex items-start gap-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-300 touch-target"
                    >
                      <link.icon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{link.title}</div>
                        <div className="text-sm text-gray-500 mt-0.5">{link.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              
              {/* Mobile Authentication Section */}
              {isMounted && isAuthenticated && user ? (
                // User is logged in - show profile actions only
                <div className="px-4 py-3 space-y-3 border-t border-gray-200">
                  {/* Mobile Profile Actions */}
                  <div className="space-y-2">
                    <Link
                      href="/profile"
                      onClick={closeMenu}
                      className="w-full flex items-center justify-center px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-300 font-medium border border-gray-200 touch-target"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                    
                    {user.role === 'jobseeker' && (
                      <Link
                        href="/dashboard/jobseeker"
                        onClick={closeMenu}
                        className="w-full flex items-center justify-center px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-300 font-medium border border-gray-200 touch-target"
                      >
                        <BarChartIcon className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    )}
                    
                    {user.role === 'employer' && (
                      <Link
                        href="/dashboard/company"
                        onClick={closeMenu}
                        className="w-full flex items-center justify-center px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-300 font-medium border border-gray-200 touch-target"
                      >
                        <BarChartIcon className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    )}

                    {user.role === 'admin' && (
                      <Link
                        href="/dashboard/admin"
                        onClick={closeMenu}
                        className="w-full flex items-center justify-center px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-300 font-medium border border-gray-200 touch-target"
                      >
                        <BarChartIcon className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    )}
                  </div>
                  
                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      closeMenu();
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center px-4 py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all duration-300 font-medium border border-red-200 min-h-[48px] touch-target"
                  >
                    <LogOut className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span className="text-sm font-medium">Sign Out</span>
                  </button>
                </div>
              ) : (
                // User is not logged in - show auth buttons
                <div className="px-4 py-3 space-y-3 border-t border-gray-200">
                  <Link
                    href="/auth/signin"
                    onClick={closeMenu}
                    className="w-full flex items-center justify-center px-4 py-4 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-300 font-medium border border-gray-200 touch-target"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signin"
                    onClick={closeMenu}
                    className="w-full flex items-center justify-center px-4 py-4 bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl touch-target"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
