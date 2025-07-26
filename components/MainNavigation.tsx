"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "next-auth/react";
import {
  Search,
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
  MapPin,
  ChevronDown,
  Home,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface MainNavigationProps {
  brandName?: string;
}

export default function MainNavigation({ brandName = "NaukriMili" }: MainNavigationProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [currentLocation, setCurrentLocation] = useState("Bangalore");
  const pathname = usePathname();

  const closeMenu = () => setIsMenuOpen(false);

  const navLinks = [
    { title: "Home", href: "/", icon: Home },
    { title: "Jobs", href: "/jobs", icon: BriefcaseIcon },
    { title: "Companies", href: "/companies", icon: BuildingIcon },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" className="flex items-center">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16">
              <Image
                src="/naukrimili-logo.png"
                alt="Job Portal Logo"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 640px) 40px, (max-width: 768px) 48px, (max-width: 1024px) 56px, 64px"
              />
            </div>
          </Link>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900",
                  pathname === link.href && "text-gray-900 font-medium"
                )}
              >
                <link.icon className="w-5 h-5" />
                {link.title}
              </Link>
            ))}
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Location Selector */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-700 bg-white rounded-full border border-gray-200 hover:border-gray-300">
            <MapPin className="w-4 h-4" />
            <span>{currentLocation}</span>
            <ChevronDown className="w-4 h-4" />
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <img
                      src={user?.image || "/placeholder-user.jpg"}
                      alt={user?.name || "User"}
                      className="h-10 w-10 rounded-full"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-gray-700">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            {/* Navigation Links */}
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900"
                  onClick={closeMenu}
                >
                  <link.icon className="w-5 h-5" />
                  {link.title}
                </Link>
              ))}
            </div>
            <div className="px-4 py-2">
              <div className="flex items-center gap-2 text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                <MapPin className="w-4 h-4" />
                <span>{currentLocation}</span>
              </div>
            </div>
            {!isAuthenticated && (
              <div className="border-t pt-4 px-4 space-y-2">
                <Link href="/auth/login" className="block">
                  <Button variant="ghost" className="w-full text-gray-700">Login</Button>
                </Link>
                <Link href="/auth/register" className="block">
                  <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
} 