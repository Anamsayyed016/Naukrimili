import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsive } from './use-mobile';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  centered?: boolean;
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'xl',
  padding = 'md',
  centered = true
}: ResponsiveContainerProps) {
  const { isMobile, isTablet } = useResponsive();

  const containerClasses = cn(
    // Base container
    'w-full',
    
    // Max width based on device
    {
      'max-w-xs': maxWidth === 'xs',
      'max-w-sm': maxWidth === 'sm',
      'max-w-md': maxWidth === 'md',
      'max-w-lg': maxWidth === 'lg',
      'max-w-xl': maxWidth === 'xl',
      'max-w-2xl': maxWidth === '2xl',
      'max-w-full': maxWidth === 'full',
    },
    
    // Padding based on device
    {
      'px-2': padding === 'sm' || isMobile,
      'px-4': padding === 'md' && !isMobile,
      'px-6': padding === 'lg' && !isMobile,
      'px-8': padding === 'lg' && isTablet,
      'px-12': padding === 'lg' && !isMobile && !isTablet,
    },
    
    // Centering
    {
      'mx-auto': centered,
    },
    
    className
  );

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
}

// Responsive grid component
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

export function ResponsiveGrid({
  children,
  className,
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6 },
  gap = 'md'
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const gridClasses = cn(
    'grid',
    gapClasses[gap],
    {
      'grid-cols-1': true,
      'sm:grid-cols-2': cols.sm && cols.sm >= 2,
      'md:grid-cols-3': cols.md && cols.md >= 3,
      'lg:grid-cols-4': cols.lg && cols.lg >= 4,
      'xl:grid-cols-5': cols.xl && cols.xl >= 5,
      '2xl:grid-cols-6': cols['2xl'] && cols['2xl'] >= 6,
    },
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}

// Responsive text component
interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  size?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
  };
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

export function ResponsiveText({
  children,
  className,
  size = { xs: 'text-sm', sm: 'text-base', md: 'text-lg', lg: 'text-xl', xl: 'text-2xl', '2xl': 'text-3xl' },
  weight = 'normal'
}: ResponsiveTextProps) {
  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  const textClasses = cn(
    // Base size
    size.xs,
    // Responsive sizes
    'sm:text-base',
    'md:text-lg',
    'lg:text-xl',
    'xl:text-2xl',
    '2xl:text-3xl',
    // Weight
    weightClasses[weight],
    className
  );

  return (
    <div className={textClasses}>
      {children}
    </div>
  );
}

// Responsive spacing component
interface ResponsiveSpacingProps {
  children: React.ReactNode;
  className?: string;
  padding?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
  };
  margin?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
  };
}

export function ResponsiveSpacing({
  children,
  className,
  padding,
  margin
}: ResponsiveSpacingProps) {
  const spacingClasses = cn(
    // Padding
    padding?.xs && `p-${padding.xs}`,
    padding?.sm && `sm:p-${padding.sm}`,
    padding?.md && `md:p-${padding.md}`,
    padding?.lg && `lg:p-${padding.lg}`,
    padding?.xl && `xl:p-${padding.xl}`,
    padding?.['2xl'] && `2xl:p-${padding['2xl']}`,
    
    // Margin
    margin?.xs && `m-${margin.xs}`,
    margin?.sm && `sm:m-${margin.sm}`,
    margin?.md && `md:m-${margin.md}`,
    margin?.lg && `lg:m-${margin.lg}`,
    margin?.xl && `xl:m-${margin.xl}`,
    margin?.['2xl'] && `2xl:m-${margin['2xl']}`,
    
    className
  );

  return (
    <div className={spacingClasses}>
      {children}
    </div>
  );
}
