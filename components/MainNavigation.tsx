'use client';
import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from 'next/navigation';
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
  Upload
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

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const navLinks = useMemo(() => [
    { title: "Home", href: "/", icon: Home },
    { title: "Jobs", href: "/jobs", icon: BriefcaseIcon },
    { title: "Companies", href: "/companies", icon: BuildingIcon }
  ], []);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Brand - Enhanced Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-all duration-300 group">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <span className="text-white font-bold text-lg lg:text-xl">N</span>
            </div>
            <span className="ml-3 text-lg lg:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
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
            
            {/* Resume Upload Button - Enhanced */}
            <Link
              href="/resumes/upload"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden xl:inline">Upload Resume</span>
              <span className="xl:hidden">Upload</span>
            </Link>
          </div>

          {/* Right Side - Enhanced User Actions */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Notifications - Enhanced */}
            <button className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110 relative group">
              <Bell className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            {/* Messages - Enhanced */}
            <button className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110 relative group">
              <MessageSquare className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            {/* User Menu - Enhanced */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                <DropdownMenuLabel className="text-base font-semibold text-gray-900">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <User className="w-4 h-4 text-gray-600" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Settings className="w-4 h-4 text-gray-600" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <FileTextIcon className="w-4 h-4 text-gray-600" />
                  <span>My Resumes</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <BarChartIcon className="w-4 h-4 text-gray-600" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors">
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button - Enhanced */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-300"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Enhanced Mobile Menu */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden border-t border-gray-200/50 py-6 bg-white/95 backdrop-blur-md"
          >
            <div className="space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-300",
                    pathname === link.href && "text-blue-600 bg-blue-50 font-medium"
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  {link.title}
                </Link>
              ))}
              
              {/* Mobile Resume Upload Button - Fixed */}
              <Link
                href="/resumes/upload"
                onClick={closeMenu}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-95"
              >
                <Upload className="w-5 h-5" />
                Upload Resume
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
