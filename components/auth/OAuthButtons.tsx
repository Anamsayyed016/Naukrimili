'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthDisabled } from '@/lib/auth-bypass';

interface OAuthButtonsProps {
  callbackUrl?: string;
  className?: string;
}

export default function OAuthButtons({ callbackUrl, className }: OAuthButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    // Check if auth is disabled or if we should bypass OAuth due to configuration issues
    if (isAuthDisabled() || process.env.NEXT_PUBLIC_BYPASS_OAUTH === 'true') {
      console.log('🚀 OAuth bypassed - redirecting to role selection');
      router.push('/auth/bypass');
      return;
    }
    
    try {
      await signIn('google', { 
        callbackUrl: callbackUrl || '/roles/choose',
        redirect: true 
      });
    } catch (error) {
      console.error('Google sign-in error:', error);
      console.log('🚀 OAuth error detected - redirecting to bypass page');
      // If OAuth fails, redirect to bypass page instead of showing error
      router.push('/auth/bypass');
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <Button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full"
        variant="outline"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing in...
          </>
        ) : (
          'Continue with Google'
        )}
      </Button>
    </div>
  );
}

// Named export for compatibility
export { OAuthButtons };