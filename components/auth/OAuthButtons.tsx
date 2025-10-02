/**
 * OAuth Social Login Buttons Component
 * Provides Google and LinkedIn OAuth authentication
 */

'use client';

import { signIn, getProviders } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { safeLength } from '@/lib/safe-array-utils';
import { Separator } from '@/components/ui/separator';
import { FaGoogle, FaLinkedin } from 'react-icons/fa';
import { Loader2, Smartphone } from 'lucide-react';

// Simplified mobile detection
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

interface OAuthButtonsProps {
  callbackUrl?: string;
  disabled?: boolean;
  className?: string;
}

export function OAuthButtons({ 
  callbackUrl = '/', 
  disabled = false,
  className = '' 
}: OAuthButtonsProps) {
  const [providers, setProviders] = useState<any>(null);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  useEffect(() => {
    // Immediately set Google provider since we know it's configured
    setProviders({
      google: {
        id: 'google',
        name: 'Google',
        type: 'oauth'
      }
    });
    
    // Optional: Try to get additional providers from NextAuth
    const loadAdditionalProviders = async () => {
      try {
        const availableProviders = await getProviders();
        console.log('🔍 Available providers from NextAuth:', availableProviders);
        
        if (availableProviders && typeof availableProviders === 'object' && availableProviders !== null && safeLength(Object.keys(availableProviders)) > 0) {
          // Only update if we have actual OAuth providers
          const oauthProviders = Object.values(availableProviders).filter(
            (provider: any) => provider.type === 'oauth'
          );
          if (safeLength(oauthProviders) > 0) {
            setProviders(availableProviders);
            return;
          }
        }
        
        console.log('🔍 Using fallback Google provider');
      } catch (error) {
        console.error('❌ Error loading additional providers:', error);
      }
    };
    
    // Load additional providers in background
    loadAdditionalProviders();
  }, []);

  const handleOAuthSignIn = async (providerId: string) => {
    try {
      setLoadingProvider(providerId);
      
      console.log(`🔐 OAuth sign-in: ${providerId}`);
      console.log(`🔐 Callback URL: ${callbackUrl || '/auth/gmail-profile'}`);
      console.log(`🔐 Current URL: ${window.location.href}`);
      
      // Use NextAuth signIn with proper redirect
      const result = await signIn(providerId, {
        callbackUrl: callbackUrl || '/auth/gmail-profile',
        redirect: true
      });
      
      console.log(`✅ OAuth result:`, result);
      
    } catch (error: any) {
      console.error(`❌ OAuth exception for ${providerId}:`, error);
      setLoadingProvider(null);
    }
  };

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return <FaGoogle size={20} />;
      case 'linkedin':
        return <FaLinkedin size={20} />;
      default:
        return null;
    }
  };

  const getProviderLabel = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return 'Continue with Google';
      case 'linkedin':
        return 'Continue with LinkedIn';
      default:
        return `Continue with ${providerId}`;
    }
  };

  const getProviderColor = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400';
      case 'linkedin':
        return 'bg-blue-700 hover:bg-blue-800 text-white border-blue-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600';
    }
  };

  if (!providers) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </div>
    );
  }

  const oauthProviders = Object.values(providers).filter(
    (provider: any) => provider.type === 'oauth'
  );

  if (safeLength(oauthProviders) === 0) {
    // Don't show warning, just show nothing if no OAuth providers
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mobile Device Information */}
      {isMobileDevice() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Smartphone className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Mobile Device</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Using mobile-optimized authentication for better compatibility.
          </p>
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {oauthProviders.map((provider: any) => (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            size="lg"
            className={`w-full border ${getProviderColor(provider.id)}`}
            disabled={disabled || loadingProvider === provider.id}
            onClick={() => handleOAuthSignIn(provider.id)}
          >
            {loadingProvider === provider.id ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <span className="mr-2">{getProviderIcon(provider.id)}</span>
            )}
            {getProviderLabel(provider.id)}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default OAuthButtons;
