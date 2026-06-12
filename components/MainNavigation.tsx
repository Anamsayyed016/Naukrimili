'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Inter } from 'next/font/google';
import {
  User,
  LogOut,
  Menu,
  X,
  BriefcaseIcon,
  BuildingIcon,
  FileTextIcon,
  BarChartIcon,
  Home,
  ChevronDown,
  Heart,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import UnifiedUserProfile from './UnifiedUserProfile';
import { ComprehensiveNotificationBell } from './ComprehensiveNotificationBell';
import { MessageBell } from './MessageBell';
import { useResponsive } from '@/components/ui/use-mobile';
import WorkspaceSwitcher from './navigation/WorkspaceSwitcher';

const navFont = Inter({
  subsets: ['latin'],
  weight: ['500', '600'],
  display: 'swap',
});

/** Shared nav surface — clean white with subtle SaaS-style depth on scroll */
function navShellClass(scrolled: boolean) {
  return cn(
    'fixed top-0 left-0 right-0 w-full transition-[box-shadow,border-color] duration-300 ease-out',
    'bg-white border-b',
    scrolled
      ? 'border-slate-200/50 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.1)]'
      : 'border-slate-200/30 shadow-[0_1px_1px_rgba(15,23,42,0.02)]'
  );
}

const navLinkBase =
  'group relative flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium tracking-[-0.01em] text-slate-700 transition-all duration-200 ease-out hover:text-slate-900 sm:px-3.5 sm:text-[13.5px]';

const navLinkActive = 'font-semibold text-slate-900';

const ctaClass = cn(
  'inline-flex items-center justify-center rounded-lg px-4 py-2 text-[13px] font-semibold tracking-[-0.01em] text-white sm:text-sm',
  'bg-slate-900',
  'shadow-[0_1px_2px_rgba(15,23,42,0.12),0_4px_12px_-4px_rgba(15,23,42,0.2)]',
  'transition-[transform,box-shadow,background-color] duration-200 ease-out',
  'hover:bg-slate-800 hover:shadow-[0_4px_16px_-4px_rgba(15,23,42,0.25)]',
  'active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 focus-visible:ring-offset-2'
);

const NAUKRIMILI_LOGO_SRC =
  'https://res.cloudinary.com/drot7xb9m/image/upload/q_auto,f_auto,w_480/v1780573698/nmlogo_jhkny4.jpg';

interface MainNavigationProps {
  brandName?: string;
}

type NavLinkItem = { title: string; href: string; icon: LucideIcon };

function isNavActive(pathname: string, href: string) {
  return pathname === href || (href !== '/' && pathname.startsWith(href));
}

function DesktopNavLink({
  link,
  isActive,
  layoutId,
}: {
  link: NavLinkItem;
  isActive: boolean;
  layoutId: string;
}) {
  const Icon = link.icon;
  const isResumeBuilder = link.href.includes('resume-builder');

  return (
    <Link
      href={link.href}
      className={cn(
        navLinkBase,
        isActive && navLinkActive,
        isResumeBuilder && !isActive && 'text-teal-800/90 hover:text-teal-900',
        isResumeBuilder && isActive && 'text-teal-900'
      )}
    >
      <span
        className={cn(
          'pointer-events-none absolute inset-0 z-0 rounded-lg opacity-0 transition-all duration-200 ease-out group-hover:opacity-100',
          isActive ? 'bg-slate-100/90 opacity-100' : 'bg-slate-50/80'
        )}
        aria-hidden
      />
      <Icon
        className={cn(
          'relative z-10 h-[15px] w-[15px] shrink-0 text-slate-500 transition-colors duration-200 ease-out group-hover:text-slate-700',
          isActive && 'text-slate-900',
          isResumeBuilder && !isActive && 'text-teal-600/90',
          isResumeBuilder && isActive && 'text-teal-700'
        )}
        aria-hidden
      />
      <span className="relative z-10 leading-none">{link.title}</span>
      {isActive && (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-x-2.5 -bottom-px z-10 h-[2px] rounded-full bg-slate-900/90"
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        />
      )}
    </Link>
  );
}

function MobileNavLink({
  link,
  isActive,
  onNavigate,
}: {
  link: NavLinkItem;
  isActive: boolean;
  onNavigate: () => void;
}) {
  const Icon = link.icon;

  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className={cn(
        'flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] font-medium tracking-[-0.01em] text-slate-800 transition-all duration-200 ease-out touch-target',
        'hover:bg-slate-50 hover:text-slate-900',
        isActive && 'border border-slate-200/80 bg-slate-50 font-semibold text-slate-900 shadow-[inset_3px_0_0_0_rgb(15,23,42)]'
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-slate-900' : 'text-slate-500')} aria-hidden />
      {link.title}
    </Link>
  );
}

/**
 * MainNavigation — fixed header (see body padding-top in globals.css).
 */
export default function MainNavigation(_props: MainNavigationProps) {
  const pathname = usePathname();
  const { isMobile, isDesktop } = useResponsive();
  const prefersReducedMotion = useReducedMotion();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session, status } = useSession();

  const user = session?.user as
    | {
        firstName?: string;
        lastName?: string;
        name?: string | null;
        email?: string | null;
        role?: string;
        image?: string | null;
      }
    | undefined;
  const isAuthenticated = status === 'authenticated' && !!user;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isMobile && isMenuOpen) setIsMenuOpen(false);
    if (isMobile && isDropdownOpen) setIsDropdownOpen(false);
  }, [isMobile, isMenuOpen, isDropdownOpen]);

  const closeMenu = () => setIsMenuOpen(false);
  const closeDropdown = () => setIsDropdownOpen(false);

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/', redirect: true });
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  const navLinks: NavLinkItem[] = [
    { title: 'Home', href: '/', icon: Home },
    { title: 'Jobs', href: '/jobs', icon: BriefcaseIcon },
    { title: 'Companies', href: '/companies', icon: BuildingIcon },
    { title: 'Resume Builder', href: '/resume-builder/start', icon: FileTextIcon },
  ];

  const getRoleSpecificLinks = () => {
    if (!isMounted || !isAuthenticated || !user?.role) return [];

    if (user.role === 'employer') {
      return [
        { title: 'Dashboard', href: '/employer/dashboard', icon: BarChartIcon, description: 'View analytics and insights' },
        { title: 'Post Job', href: '/employer/jobs/create', icon: BriefcaseIcon, description: 'Create new job posting' },
        { title: 'Manage Jobs', href: '/employer/jobs', icon: FileTextIcon, description: 'View and edit job postings' },
        { title: 'Applications', href: '/employer/applications', icon: Users, description: 'Review job applications' },
        { title: 'Company Profile', href: '/employer/company/profile', icon: BuildingIcon, description: 'Update company info' },
      ];
    }
    if (user.role === 'jobseeker') {
      return [
        { title: 'Dashboard', href: '/dashboard/jobseeker', icon: BarChartIcon, description: 'View your activity' },
        { title: 'My Resumes', href: '/dashboard/jobseeker/resumes', icon: FileTextIcon, description: 'Manage your resumes' },
        { title: 'Applications', href: '/dashboard/jobseeker/applications', icon: BriefcaseIcon, description: 'Track your applications' },
      ];
    }
    return [];
  };

  const roleSpecificLinks = getRoleSpecificLinks();
  const shellStyle = { zIndex: 10000, position: 'fixed' as const, backfaceVisibility: 'hidden' as const };
  const showMobileChrome =
    isMounted && (isMobile || (!isDesktop && typeof window !== 'undefined' && window.innerWidth < 768));

  const logoBlock = (
    <Link
      href="/"
      className="group flex shrink-0 items-center self-center bg-transparent transition-opacity duration-200 hover:opacity-95 max-md:mr-2 max-md:min-w-0 max-md:pr-1 max-md:shadow-none md:mr-2 lg:mr-3"
      aria-label="NaukriMili home"
    >
      {/* Below md: mobile brand anchor; md/lg: subtle desktop presence boost */}
      <div className="relative flex h-[3.25rem] w-auto min-w-[148px] max-w-[200px] items-center bg-transparent max-md:!h-16 max-md:!min-w-[176px] max-md:!max-w-[248px] max-md:shadow-none max-md:ring-0 sm:h-14 sm:min-w-[168px] sm:max-w-[236px] md:h-[4.125rem] md:!min-w-0 md:max-w-[280px] lg:h-[4.5rem] lg:min-w-[216px] lg:max-w-[320px]">
        <Image
          src={NAUKRIMILI_LOGO_SRC}
          alt="NaukriMili - Job Portal"
          className="block h-full w-auto max-h-full object-contain object-left bg-transparent transition-opacity duration-200 group-hover:opacity-90 max-md:mix-blend-multiply"
          width={480}
          height={128}
          sizes="(max-width: 767px) 248px, (max-width: 1023px) 236px, 320px"
          priority
        />
      </div>
    </Link>
  );

  if (!isMounted) {
    return (
      <nav className={cn(navFont.className, navShellClass(false))} style={shellStyle}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between sm:h-20 lg:h-[5.25rem]">
            {logoBlock}
            <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={cn(navFont.className, navShellClass(scrolled))} style={shellStyle}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 max-md:gap-2 sm:h-20 lg:h-[5.25rem]">
          {logoBlock}

          {/* Desktop nav */}
          <div className="hidden items-center gap-0.5 md:flex lg:gap-1">
            {navLinks.map((link) => (
              <DesktopNavLink
                key={link.title}
                link={link}
                isActive={isNavActive(pathname, link.href)}
                layoutId="navbar-active-indicator"
              />
            ))}

            {isAuthenticated && user?.role === 'jobseeker' && (
              <WorkspaceSwitcher variant="desktop" className="ml-1 lg:ml-2" />
            )}

            {isAuthenticated && user?.role && roleSpecificLinks.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      navLinkBase,
                      'h-auto border-0 bg-transparent text-slate-700 shadow-none hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    <span>{user.role === 'employer' ? 'For Employers' : 'For Job Seekers'}</span>
                    <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={10}
                  className="w-72 rounded-xl border border-slate-200/60 bg-white p-1 shadow-[0_8px_30px_-8px_rgba(15,23,42,0.12)]"
                >
                  {roleSpecificLinks.map((link) => (
                    <DropdownMenuItem key={link.title} asChild>
                      <Link
                        href={link.href}
                        className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 transition-colors duration-200 hover:bg-slate-50"
                      >
                        <link.icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-900">{link.title}</div>
                          <div className="mt-0.5 text-xs text-slate-500">{link.description}</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-1 md:flex md:gap-2 xl:gap-3">
            <ComprehensiveNotificationBell />
            <MessageBell />
            {isAuthenticated && user ? (
              <UnifiedUserProfile variant="desktop" />
            ) : (
              <Link href="/auth/signin" className={ctaClass}>
                Get Started
              </Link>
            )}
          </div>

          {/* Mobile chrome — secondary actions scaled down below md so logo leads hierarchy */}
          {showMobileChrome && (
            <div
              className={cn(
                'flex shrink-0 items-center gap-1 sm:gap-1.5',
                'max-md:gap-0.5',
                'max-md:[&_button]:min-h-9 max-md:[&_button]:min-w-9 max-md:[&_button]:p-1.5',
                'max-md:[&_button_svg]:!h-4 max-md:[&_button_svg]:!w-4',
                'max-md:[&_[data-user-profile]_button]:min-h-9 max-md:[&_[data-user-profile]_button]:min-w-9',
                'max-md:[&_[data-user-profile]_button]:px-1',
                'max-md:[&_[data-user-profile]_button_.rounded-full]:!h-7',
                'max-md:[&_[data-user-profile]_button_.rounded-full]:!w-7',
                'max-md:[&_[data-user-profile]_button_span]:!text-xs'
              )}
            >
              {!isAuthenticated && (
                <Link href="/auth/signin" className={cn(ctaClass, 'px-3 py-2 text-xs sm:text-sm')}>
                  Get Started
                </Link>
              )}
              {isAuthenticated && user && (
                <>
                  <div>
                    <ComprehensiveNotificationBell />
                  </div>
                  <div>
                    <MessageBell />
                  </div>
                  <div data-user-profile>
                    <UnifiedUserProfile variant="mobile" />
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={cn(
                  'flex items-center justify-center rounded-lg border border-transparent text-slate-600',
                  'h-8 w-8 max-md:min-h-9 max-md:min-w-9 sm:h-10 sm:w-10',
                  'transition-colors duration-200 hover:border-slate-200/80 hover:bg-slate-50 hover:text-slate-900',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:ring-offset-2'
                )}
                aria-label="Toggle mobile menu"
                aria-expanded={isMenuOpen}
              >
                <motion.div
                  animate={{ rotate: isMenuOpen ? 90 : 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                >
                  {isMenuOpen ? (
                    <X className="h-3.5 w-3.5 max-md:h-4 max-md:w-4 sm:h-[18px] sm:w-[18px]" />
                  ) : (
                    <Menu className="h-3.5 w-3.5 max-md:h-4 max-md:w-4 sm:h-[18px] sm:w-[18px]" />
                  )}
                </motion.div>
              </button>
            </div>
          )}
        </div>

        <AnimatePresence initial={false}>
          {showMobileChrome && isMenuOpen && (
            <motion.div
              key="mobile-menu"
              initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-slate-200/50 bg-white py-4 sm:py-5"
            >
              <div className="space-y-1">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.title}
                    initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: prefersReducedMotion ? 0 : i * 0.04, duration: 0.2 }}
                  >
                    <MobileNavLink
                      link={link}
                      isActive={isNavActive(pathname, link.href)}
                      onNavigate={closeMenu}
                    />
                  </motion.div>
                ))}

                {isAuthenticated && user?.role === 'jobseeker' && (
                  <div className="mt-3 border-t border-slate-200/80 px-2 pt-4">
                    <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Workspace
                    </p>
                    <div onClick={closeMenu}>
                      <WorkspaceSwitcher variant="mobile" />
                    </div>
                  </div>
                )}

                {isAuthenticated && user?.role && roleSpecificLinks.length > 0 && (
                  <div className="mt-3 space-y-1 border-t border-slate-200/80 px-2 pt-4">
                    <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {user.role === 'employer' ? 'For Employers' : 'For Job Seekers'}
                    </p>
                    {roleSpecificLinks.map((link) => (
                      <Link
                        key={link.title}
                        href={link.href}
                        onClick={closeMenu}
                        className="flex min-h-[48px] items-start gap-3 rounded-xl px-4 py-3 text-slate-700 transition-colors duration-200 hover:bg-slate-50 touch-target"
                      >
                        <link.icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-900">{link.title}</div>
                          <div className="mt-0.5 text-xs text-slate-500">{link.description}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {isAuthenticated && user ? (
                  <div className="mt-4 space-y-2 border-t border-slate-200/80 px-2 pt-4">
                    <Link
                      href="/profile"
                      onClick={closeMenu}
                      className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-slate-200/80 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 touch-target"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                    {user.role === 'jobseeker' && (
                      <Link
                        href="/dashboard/jobseeker"
                        onClick={closeMenu}
                        className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-slate-200/80 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 touch-target"
                      >
                        <BarChartIcon className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    )}
                    {user.role === 'employer' && (
                      <Link
                        href="/dashboard/company"
                        onClick={closeMenu}
                        className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-slate-200/80 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 touch-target"
                      >
                        <BarChartIcon className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link
                        href="/dashboard/admin"
                        onClick={closeMenu}
                        className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-slate-200/80 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 touch-target"
                      >
                        <BarChartIcon className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        closeMenu();
                        handleLogout();
                      }}
                      className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 touch-target"
                    >
                      <LogOut className="mr-2 h-5 w-5 shrink-0" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 border-t border-slate-200/80 px-2 pt-4">
                    <Link
                      href={
                        process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true' || process.env.AUTH_DISABLED === 'true'
                          ? '/auth/bypass'
                          : '/auth/signin'
                      }
                      onClick={closeMenu}
                      className={cn(ctaClass, 'flex min-h-[48px] w-full touch-target')}
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
