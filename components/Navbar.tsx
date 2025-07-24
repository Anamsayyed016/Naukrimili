"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Menu, X, BriefcaseIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavbarProps {
  brandName?: string;
}

const Navbar = ({ brandName = 'NaukriMili' }: NavbarProps) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const NavLinks = () => (
    <>
      <Link 
        href="/jobs" 
        className={cn(
          "nav-link group flex items-center",
          "hover:text-primary transition-colors duration-200"
        )} 
        onClick={closeMenu}
      >
        <BriefcaseIcon className="w-4 h-4 mr-2 group-hover:text-primary" />
        Find Jobs
      </Link>
      {user?.role === 'company' && (
        <Link 
          href="/jobs/post" 
          className="nav-link" 
          onClick={closeMenu}
        >
          Post a Job
        </Link>
      )}
      {user?.role === 'jobseeker' && (
        <Link 
          href="/applications" 
          className="nav-link" 
          onClick={closeMenu}
        >
          My Applications
        </Link>
      )}
    </>
  );

  const AuthButtons = () => (
    <>
      {user ? (
        <>
          <Link href="/profile" className="nav-link" onClick={closeMenu}>
            Profile
          </Link>
          <Button
            variant="ghost"
            onClick={() => {
              logout();
              closeMenu();
            }}
          >
            Logout
          </Button>
        </>
      ) : (
        <>
          <Link href="/auth/login" onClick={closeMenu}>
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/auth/signup" onClick={closeMenu}>
            <Button>Sign Up</Button>
          </Link>
        </>
      )}
    </>
  );

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex flex-col justify-center" 
              onClick={closeMenu}
            >
              <span className="text-2xl font-bold text-primary tracking-tight">
                {brandName}
              </span>
              <span className="text-sm text-gray-600 font-medium -mt-1">
                Find Your Dream Job
              </span>
            </Link>
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              <NavLinks />
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <AuthButtons />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center p-2 rounded-md",
                "text-gray-400 hover:text-gray-500 hover:bg-gray-100",
                "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary",
                "transition-colors duration-200"
              )}
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu with Animation */}
      <div 
        className={cn(
          "md:hidden transition-all duration-300 ease-in-out",
          "origin-top",
          isMenuOpen 
            ? "opacity-100 scale-y-100" 
            : "opacity-0 scale-y-95 pointer-events-none"
        )}
      >
        <div className="pt-2 pb-3 space-y-1 px-4">
          <NavLinks />
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200 px-4">
          <div className="space-y-1">
            <AuthButtons />
          </div>
        </div>
      </div>

      {/* Backdrop Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 md:hidden"
          aria-hidden="true"
          onClick={closeMenu}
        />
      )}
    </nav>
  );
};

export default Navbar;
