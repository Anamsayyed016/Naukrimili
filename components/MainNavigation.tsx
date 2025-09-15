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
  ChevronDown
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
    const baseLinks = [
      { title: "Home", href: "/", icon: Home },
      { title: "Jobs", href: "/jobs", icon: BriefcaseIcon },
      { title: "Companies", href: "/companies", icon: BuildingIcon }
    ];

    // Add role-specific links
    if (isMounted && isAuthenticated && user?.role) {
      if (user.role === 'employer') {
        baseLinks.push(
          { title: "Dashboard", href: "/employer/dashboard", icon: BarChartIcon },
          { title: "Post Job", href: "/employer/jobs/create", icon: BriefcaseIcon },
          { title: "Applications", href: "/employer/applications", icon: FileTextIcon }
        );
      } else if (user.role === 'jobseeker') {
        baseLinks.push(
          { title: "Dashboard", href: "/dashboard/jobseeker", icon: BarChartIcon },
          { title: "My Resumes", href: "/dashboard/jobseeker/resumes", icon: FileTextIcon },
          { title: "Applications", href: "/dashboard/jobseeker/applications", icon: BriefcaseIcon }
        );
      }
    }

    return baseLinks;
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
          </div>

          {/* Desktop Right Side - Enhanced User Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Desktop Notifications and Messages */}
            <button className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110 relative group">
              <Bell className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            <button className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110 relative group">
              <MessageSquare className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            {/* Desktop Authentication Section */}
            {isMounted && isAuthenticated && user ? (
              <DropdownMenu onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110 flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="User menu"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-gray-700 font-medium text-sm">
                        {user.name || 'User'}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {user.role || 'User'}
                      </span>
                    </div>
                    <ChevronDown 
                      className={cn(
                        "w-4 h-4 text-gray-500 transition-transform duration-200",
                        isDropdownOpen && "rotate-180"
                      )} 
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-72 p-3 bg-white border border-gray-200 shadow-xl rounded-xl z-50"
                  sideOffset={8}
                >
                  <DropdownMenuLabel className="text-base font-semibold text-gray-900 px-2 py-2">
                    My Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  
                  {/* User Info */}
                  <div className="px-2 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-xs text-blue-600 font-medium capitalize">{user.role}</p>
                  </div>
                  
                  <DropdownMenuSeparator className="bg-gray-200" />
                  
                  {/* Menu Items */}
                  <div className="py-2">
                    <DropdownMenuItem asChild className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <Link href="/profile" className="flex items-center gap-3 w-full">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-900 font-medium">Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <Link href="/settings" className="flex items-center gap-3 w-full">
                        <Settings className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-900 font-medium">Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    {user.role === 'jobseeker' && (
                      <DropdownMenuItem asChild className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <Link href="/dashboard/jobseeker/resumes" className="flex items-center gap-3 w-full">
                          <FileTextIcon className="w-4 h-4 text-gray-600" />
                          <span className="text-gray-900 font-medium">My Resumes</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem asChild className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <Link href={user.role === 'employer' ? '/employer/dashboard' : '/dashboard/jobseeker'} className="flex items-center gap-3 w-full">
                        <BarChartIcon className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-900 font-medium">Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>
                  
                  <DropdownMenuSeparator className="bg-gray-200" />
                  
                  {/* Logout */}
                  <DropdownMenuItem 
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            {/* Mobile User Indicator - Show when logged in */}
            {isMounted && isAuthenticated && user && (
              <div className="flex items-center space-x-2 mr-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user.name?.split(' ')[0] || 'User'}
                </span>
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
              
              {/* Mobile Authentication Section */}
              {isMounted && isAuthenticated && user ? (
                // User is logged in - show user info and actions
                <div className="px-4 py-3 space-y-3 border-t border-gray-200">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-blue-600 font-medium capitalize">{user.role}</p>
                      </div>
                    </div>
                  </div>
                  
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
                        href="/employer/dashboard"
                        onClick={closeMenu}
                        className="w-full flex items-center justify-center px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-300 font-medium border border-gray-200 touch-target"
                      >
                        <BarChartIcon className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    )}
                  </div>
                  
                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      closeMenu();
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all duration-300 font-medium border border-red-200 touch-target"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
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
