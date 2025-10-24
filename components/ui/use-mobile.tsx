"use client";
import * as React from "react";

// Standard responsive breakpoints
export const BREAKPOINTS = {
  xs: 480,    // Extra small phones
  sm: 640,    // Small phones
  md: 768,    // Tablets
  lg: 1024,   // Small laptops
  xl: 1280,   // Large laptops
  '2xl': 1536 // Desktop monitors
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// Device type detection
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useResponsive() {
  const [isClient, setIsClient] = React.useState<boolean>(false);
  const [currentBreakpoint, setCurrentBreakpoint] = React.useState<Breakpoint>('lg');
  const [deviceType, setDeviceType] = React.useState<DeviceType>('desktop');

  React.useEffect(() => {
    setIsClient(true);
    
    function updateResponsive() {
      if (typeof window === 'undefined') return;
      
      const width = window.innerWidth;
      
      // Determine breakpoint
      if (width < BREAKPOINTS.xs) setCurrentBreakpoint('xs');
      else if (width < BREAKPOINTS.sm) setCurrentBreakpoint('sm');
      else if (width < BREAKPOINTS.md) setCurrentBreakpoint('md');
      else if (width < BREAKPOINTS.lg) setCurrentBreakpoint('lg');
      else if (width < BREAKPOINTS.xl) setCurrentBreakpoint('xl');
      else setCurrentBreakpoint('2xl');
      
      // Determine device type
      if (width < BREAKPOINTS.md) setDeviceType('mobile');
      else if (width < BREAKPOINTS.lg) setDeviceType('tablet');
      else setDeviceType('desktop');
    }
    
    updateResponsive();
    window.addEventListener("resize", updateResponsive);
    return () => window.removeEventListener("resize", updateResponsive);
  }, []);

  // Individual breakpoint checks
  const isXs = currentBreakpoint === 'xs';
  const isSm = currentBreakpoint === 'sm';
  const isMd = currentBreakpoint === 'md';
  const isLg = currentBreakpoint === 'lg';
  const isXl = currentBreakpoint === 'xl';
  const is2xl = currentBreakpoint === '2xl';

  // Device type checks
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isDesktop = deviceType === 'desktop';

  // Legacy compatibility
  const useIsMobile = () => isMobile;

  return {
    // Breakpoint state
    currentBreakpoint,
    deviceType,
    
    // Individual breakpoints
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    
    // Device types
    isMobile,
    isTablet,
    isDesktop,
    
    // Legacy compatibility
    useIsMobile,
    
    // Utility functions
    isClient,
    BREAKPOINTS
  };
}

// Legacy export for backward compatibility
export function useIsMobile() {
  const { isMobile } = useResponsive();
  return isMobile;
}

export default useResponsive;
