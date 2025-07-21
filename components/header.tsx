'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Search, Bell, MessageSquare, User, Settings, LogOut, Sparkles, Brain, Zap, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import LocationDropdown from "@/components/LocationDropdown";

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Jobs', href: '/jobs', badge: 12 },
  { name: 'Companies', href: '/companies' },
  { name: 'Dashboard', href: '/dashboard' },
];

export default function Header() {
  const { data: session, status } = useSession();
  const [notifCount, setNotifCount] = useState(3);
  const [messages, setMessages] = useState(5);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [currentLocation, setCurrentLocation] = useState("Delhi");

  // Handle location change
  const handleLocationChange = (newLocation: string) => {
    console.log('Location changed to:', newLocation);
    setCurrentLocation(newLocation);
    // You can also store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('userLocation', newLocation);
    }
  };

  // Load saved location from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        setCurrentLocation(savedLocation);
      }
    }
  }, []);

  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className="sticky top-0 z-[100] w-full bg-white/90 backdrop-blur border-b border-gray-200 font-sans">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 min-w-[100px]" aria-label="Home">
          <img
            src="/naukrimili-logo.png"
            alt="Naukrimili Logo"
            className="h-16 w-auto max-w-[180px] object-contain"
            style={{ maxHeight: 64 }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-logo.png';
            }}
          />
        </Link>
        {/* Desktop Menu */}
        <ul className="hidden md:flex items-center gap-6 ml-8">
          {navLinks.map((link) => (
            <li key={link.name} className="relative">
              <Link href={link.href} className={`text-gray-700 hover:text-blue-600 font-medium transition-colors px-2 py-1 rounded focus:outline-none focus-visible:ring-2 ring-blue-300 ${pathname === link.href ? 'underline underline-offset-4 text-blue-600' : ''}`}>{link.name}
                {link.badge && (
                  <span className="absolute -top-2 -right-3 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[22px] text-center">
                    {link.badge > 99 ? '99+' : link.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        {/* AI Search Bar */}
        <div className="hidden md:flex flex-1 items-center max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              placeholder="AI-powered search..."
              className="pl-10 pr-20 py-2 w-full rounded border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 text-xs flex items-center">
                <Brain className="w-3 h-3 mr-1" />AI
              </Badge>
            </div>
          </div>
        </div>
        {/* Right Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <LocationDropdown currentLocation={currentLocation} onLocationChange={handleLocationChange} />
          {/* Messages */}
          <button className="relative p-2 rounded hover:bg-blue-50 focus:outline-none focus-visible:ring-2 ring-blue-300" aria-label="Messages">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            {messages > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[20px] text-center">
                {messages > 99 ? '99+' : messages}
              </span>
            )}
          </button>
          {/* Notification Bell */}
          <button className="relative p-2 rounded hover:bg-blue-50 focus:outline-none focus-visible:ring-2 ring-blue-300" aria-label="Notifications">
            <Bell className="h-5 w-5 text-blue-600" />
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[20px] text-center">
                {notifCount > 99 ? '99+' : notifCount}
              </span>
            )}
          </button>
          {/* Auth/Profile */}
          {status === "loading" ? (
            <div className="text-gray-500">Loading...</div>
          ) : !session ? (
            <>
              <Link href="/auth/login" className="text-blue-600 font-semibold px-3 py-1 rounded hover:bg-blue-50 transition">Login</Link>
              <Link href="/auth/register" className="text-white bg-blue-600 font-semibold px-3 py-1 rounded hover:bg-blue-700 transition">Register</Link>
            </>
          ) : (
            <div className="relative group">
              <button className="flex items-center gap-2 p-1 rounded hover:bg-blue-50 focus:outline-none focus-visible:ring-2 ring-blue-300">
                <img 
                  src={session.user?.image || "/placeholder-user.jpg"} 
                  alt={session.user?.name || "User avatar"} 
                  className="w-8 h-8 rounded-full border border-gray-300" 
                />
                <span className="hidden md:inline font-medium text-gray-700">
                  {session.user?.name?.split(' ')[0] || 'Me'}
                </span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                  <p className="text-sm text-gray-500 truncate">{session.user?.email}</p>
                </div>
                <Link href="/dashboard" className="block px-4 py-2 hover:bg-blue-50 flex items-center gap-2">
                  <User className="w-4 h-4" />Dashboard
                </Link>
                <Link href="/settings" className="block px-4 py-2 hover:bg-blue-50 flex items-center gap-2">
                  <Settings className="w-4 h-4" />Settings
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="block w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 border-t border-gray-100"
                >
                  <LogOut className="w-4 h-4" />Logout
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Mobile Hamburger */}
        <button className="md:hidden ml-2 p-2 rounded hover:bg-blue-50 focus:outline-none focus-visible:ring-2 ring-blue-300" aria-label="Open menu" onClick={() => setMobileMenu(!mobileMenu)}>
          <Menu className="h-6 w-6 text-blue-600" />
        </button>
      </nav>
      {/* Mobile Menu Drawer */}
      {mobileMenu && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-3 space-y-2">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href} className="block py-2 text-gray-700 font-medium">
              {link.name}
              {link.badge && (
                <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[22px] text-center">
                  {link.badge > 99 ? '99+' : link.badge}
                </span>
              )}
            </Link>
          ))}
          {/* Mobile Location Link */}
          <Link href="#" className="block py-2 text-gray-700 font-medium flex items-center gap-2">
            <span role="img" aria-label="Location">📍</span> Location
          </Link>
          <div className="flex flex-col gap-2 mt-2">
            {!session ? (
              <>
                <Link href="/auth/login" className="text-blue-600 font-semibold px-3 py-1 rounded hover:bg-blue-50 transition">Login</Link>
                <Link href="/auth/register" className="text-white bg-blue-600 font-semibold px-3 py-1 rounded hover:bg-blue-700 transition">Register</Link>
              </>
            ) : (
              <>
                <div className="px-3 py-2 border-b border-gray-100 mb-2">
                  <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                  <p className="text-sm text-gray-500 truncate">{session.user?.email}</p>
                </div>
                <Link href="/dashboard" className="block px-4 py-2 hover:bg-blue-50">Dashboard</Link>
                <Link href="/settings" className="block px-4 py-2 hover:bg-blue-50">Settings</Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600">Logout</button>
              </>
            )}
        </div>
      </div>
      )}
    </header>
  );
}
