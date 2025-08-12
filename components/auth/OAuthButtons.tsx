/**
 * OAuth Social Login Buttons Component
 * Provides Google and LinkedIn OAuth authentication
 */

'use client';

import { signIn, getProviders } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FaGoogle, FaLinkedin } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';

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
    const loadProviders = async () => {
      const availableProviders = await getProviders();
      setProviders(availableProviders);
    };
    
    loadProviders();
  }, []);

  const handleOAuthSignIn = async (providerId: string) => {
    try {
      setLoadingProvider(providerId);
      
      await signIn(providerId, {
        callbackUrl,
        redirect: true,
      });
    } catch (error) {
      console.error(`OAuth sign-in error for ${providerId}:`, error);
      setLoadingProvider(null);
    }
  };

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return <FaGoogle className="w-5 h-5" />;
      case 'linkedin':
        return <FaLinkedin className="w-5 h-5" />;
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
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'linkedin':
        return 'bg-blue-700 hover:bg-blue-800 text-white';
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white';
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

  if (oauthProviders.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
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
            className={`w-full ${getProviderColor(provider.id)}`}
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
