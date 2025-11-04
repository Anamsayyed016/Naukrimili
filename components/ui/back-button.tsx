"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  fallbackUrl?: string;
  label?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
}

export function BackButton({ 
  fallbackUrl = '/', 
  label = 'Back',
  className,
  variant = 'outline',
  size = 'default',
  showIcon = true
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 2) {
      router.back();
    } else {
      // Fallback to specific URL if no history
      router.push(fallbackUrl);
    }
  };

  return (
    <Button
      onClick={handleBack}
      variant={variant}
      size={size}
      className={cn("flex items-center gap-2", className)}
    >
      {showIcon && <ArrowLeft className="h-4 w-4" />}
      {label}
    </Button>
  );
}

