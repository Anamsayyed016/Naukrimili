'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useMessages } from '@/hooks/useMessages';
import { signOut } from 'next-auth/react';
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
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface NavigationProps {
  variant?: 'main' | 'futuristic' | 'simple';
  showSearch?: boolean;
  showLogo?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  brandName?: string;
  className?: string}

export default function Navigation({
  variant = 'main',
  showSearch = true,
  showLogo = true,
  theme = 'light',
  brandName = 'NaukriMili',
  className = ''
}: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [currentLocation, setCurrentLocation] = useState('Bangalore');
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { unreadCount: notificationCount } = useNotifications();
  const { unreadCount: messageCount } = useMessages();

  const closeMenu = () => setIsMenuOpen(false);

  const getUserInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()};

  const navLinks = [
    { title: "Home", href: "/", icon: Home },
    { title: "Jobs", href: "/jobs", icon: BriefcaseIcon },
    { title: "Companies", href: "/companies", icon: BuildingIcon },
  ];

  const getVariantStyles = () => {
    switch (variant) {
      case 'futuristic':
        return {
          nav: 'bg-black/90 backdrop-blur-md border-b border-white/10',
          text: 'text-white',
          hover: 'hover:bg-white/10',
          search: 'bg-white/10 border-white/20 text-white placeholder:text-white/60'};
      case 'simple':
        return {
          nav: 'bg-white border-b border-gray-200',
          text: 'text-gray-700',
          hover: 'hover:bg-gray-100',
          search: 'bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500'};
      default: // main
        return {
          nav: 'bg-white border-b border-gray-200',
          text: 'text-gray-700',
          hover: 'hover:bg-gray-100',
          search: 'bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500'}}
  };

  const styles = getVariantStyles();

  return (
    <nav className={cn('sticky top-0 z-50 w-full', styles.nav, className)}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          {showLogo && (
            <Link href="/" className="flex items-center">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16">
                <Image
                  src="/naukrimili-logo.png"
                  alt={`${brandName} Logo`}
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 640px) 40px, (max-width: 768px) 48px, (max-width: 1024px) 56px, 64px"
                />
              </div>
              <span className={cn('ml-2 text-xl font-bold', styles.text)}>
                {brandName}
              </span>
            </Link>
          )}

          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md transition-colors',
                  styles.text,
                  styles.hover,
                  pathname === link.href && 'bg-gray-100 text-gray-900 font-medium'
                )}
              >
                <link.icon className="w-5 h-5" />
                {link.title}
              </Link>
            ))}
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="hidden lg:flex items-center space-x-4 flex-1 max-w-md mx-8">
              <div className="relative flex-1">
                <Input
                  type="search"
                  placeholder="Search jobs, companies..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className={cn('pl-10', styles.search)}
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {currentLocation}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Select Location</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Remote'].map((location) => (
                    <DropdownMenuItem
                      key={location}
                      onClick={() => setCurrentLocation(location)}
                    >
                      {location}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className={cn('relative', styles.text, styles.hover)}>
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              )}
            </Button>

            {/* Messages */}
            <Button variant="ghost" size="sm" className={cn('relative', styles.text, styles.hover)}>
              <MessageSquare className="w-5 h-5" />
              {messageCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                  {messageCount > 9 ? '9+' : messageCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse hidden sm:block"></div>
              </div>
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className={cn('flex items-center gap-2', styles.text, styles.hover)}>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                      {user?.image ? (
                        <Image 
                          src={user.image} 
                          alt={user.name || 'User'} 
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm font-semibold">
                          {getUserInitials(user?.name || user?.email || 'User')}
                        </span>
                      )}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium">
                        {user?.name || user?.email || 'User'}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {user?.role || 'Job Seeker'}
                      </div>
                    </div>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <div className="font-medium">{user?.name || user?.email || 'User'}</div>
                      <div className="text-sm font-normal text-gray-500 capitalize">
                        {user?.role || 'Job Seeker'}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <BarChartIcon className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileTextIcon className="w-4 h-4 mr-2" />
                    My Applications
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className={cn(styles.text, styles.hover)}>
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className={cn('md:hidden', styles.text, styles.hover)}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 py-4"
          >
            <div className="space-y-4">
              {/* Mobile Search */}
              {showSearch && (
                <div className="relative">
                  <Input
                    type="search"
                    placeholder="Search jobs, companies..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className={cn('pl-10', styles.search)}
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              )}

              {/* Mobile Navigation Links */}
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.title}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-md transition-colors',
                      styles.text,
                      styles.hover,
                      pathname === link.href && 'bg-gray-100 text-gray-900 font-medium'
                    )}
                    onClick={closeMenu}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.title}
                  </Link>
                ))}
              </div>

              {/* Mobile User Actions */}
              {isLoading ? (
                <div className="flex items-center space-x-3 pt-4 border-t border-gray-200 px-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ) : isAuthenticated ? (
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  {/* Mobile User Info */}
                  <div className="flex items-center space-x-3 px-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                      {user?.image ? (
                        <Image 
                          src={user.image} 
                          alt={user.name || 'User'} 
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold">
                          {getUserInitials(user?.name || user?.email || 'User')}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {user?.name || user?.email || 'User'}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {user?.role || 'Job Seeker'}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Notifications and Messages */}
                  <div className="flex items-center justify-around px-4">
                    <Button variant="ghost" size="sm" className={cn('flex items-center gap-2', styles.text, styles.hover)}>
                      <Bell className="w-5 h-5" />
                      <span>Notifications</span>
                      {notificationCount > 0 && (
                        <Badge className="h-5 w-5 rounded-full p-0 text-xs">
                          {notificationCount > 9 ? '9+' : notificationCount}
                        </Badge>
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" className={cn('flex items-center gap-2', styles.text, styles.hover)}>
                      <MessageSquare className="w-5 h-5" />
                      <span>Messages</span>
                      {messageCount > 0 && (
                        <Badge className="h-5 w-5 rounded-full p-0 text-xs">
                          {messageCount > 9 ? '9+' : messageCount}
                        </Badge>
                      )}
                    </Button>
                  </div>

                  {/* Mobile User Menu Items */}
                  <div className="space-y-1 px-4">
                    <Link href="/profile">
                      <Button variant="ghost" className={cn('w-full justify-start', styles.text, styles.hover)} onClick={closeMenu}>
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Button>
                    </Link>
                    <Link href="/dashboard">
                      <Button variant="ghost" className={cn('w-full justify-start', styles.text, styles.hover)} onClick={closeMenu}>
                        <BarChartIcon className="w-4 h-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    <Link href="/applications">
                      <Button variant="ghost" className={cn('w-full justify-start', styles.text, styles.hover)} onClick={closeMenu}>
                        <FileTextIcon className="w-4 h-4 mr-2" />
                        My Applications
                      </Button>
                    </Link>
                    <Link href="/settings">
                      <Button variant="ghost" className={cn('w-full justify-start', styles.text, styles.hover)} onClick={closeMenu}>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-red-600 hover:bg-red-50" 
                      onClick={() => signOut({ callbackUrl: '/' })}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
                  <Link href="/auth/login">
                    <Button variant="ghost" className={cn('w-full justify-start', styles.text, styles.hover)}>
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button className="w-full justify-start">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </nav>)} 
