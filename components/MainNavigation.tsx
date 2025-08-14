'use client';
import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from 'next/navigation';
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
  Home
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

interface MainNavigationProps {
  brandName?: string;
}

export default function MainNavigation({
  brandName = "NaukriMili"
}: MainNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [currentLocation, setCurrentLocation] = useState("Bangalore");
  const pathname = usePathname();
  const router = useRouter();

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const navLinks = useMemo(() => [
    { title: "Home", href: "/", icon: Home },
    { title: "Jobs", href: "/jobs", icon: BriefcaseIcon },
    { title: "Companies", href: "/companies", icon: BuildingIcon }
  ], []);

  const handleSearch = useCallback(() => {
    if (searchValue.trim()) {
      const searchUrl = `/jobs?query=${encodeURIComponent(searchValue.trim())}&location=${encodeURIComponent(currentLocation)}`;
      router.push(searchUrl);
    }
  }, [searchValue, currentLocation, router]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      handleSearch();
    }
  }, [searchValue, handleSearch]);

  const handleLocationChange = useCallback((city: string) => {
    setCurrentLocation(city);
    closeMenu();
  }, [closeMenu]);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
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
            <span className="ml-2 text-xl font-bold text-gray-900">{brandName}</span>
          </Link>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                prefetch={true}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200",
                  pathname === link.href && "text-blue-600 font-medium border-b-2 border-blue-600"
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
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-20 py-2 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              {searchValue && (
                <button
                  onClick={handleSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors duration-200"
                >
                  Search
                </button>
              )}
            </div>
          </div>

          {/* Location Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-700 bg-white rounded-full border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors duration-200">
                <MapPin className="w-4 h-4" />
                <span>{currentLocation}</span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Select Location</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'].map((city) => (
                <DropdownMenuItem
                  key={city}
                  onClick={() => handleLocationChange(city)}
                  className={cn(
                    'cursor-pointer transition-colors duration-200',
                    currentLocation === city ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  )}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {city}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-gray-700 hover:text-gray-900 transition-colors duration-200">
                Login
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors duration-200"
                aria-label="Sign Up"
              >
                Sign Up
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
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
          <div className="md:hidden py-4 space-y-4 border-t border-gray-200 bg-gray-50">
            {/* Navigation Links */}
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  prefetch={true}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
                  onClick={closeMenu}
                >
                  <link.icon className="w-5 h-5" />
                  {link.title}
                </Link>
              ))}
            </div>
            <div className="px-4 py-2">
              <div className="flex items-center gap-2 text-gray-700 bg-white px-3 py-2 rounded-lg border border-gray-200">
                <MapPin className="w-4 h-4" />
                <span>{currentLocation}</span>
              </div>
            </div>
            <div className="border-t pt-4 px-4 space-y-2">
              <Link href="/auth/login" className="block">
                <Button variant="ghost" className="w-full text-gray-700 hover:text-gray-900 transition-colors duration-200">
                  Login
                </Button>
              </Link>
              <Link href="/auth/register" className="block">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors duration-200"
                  aria-label="Sign Up"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
