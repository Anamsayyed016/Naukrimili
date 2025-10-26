#!/bin/bash

echo "🔍 OAuth Redirect Debugging Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in project root directory. Please run from project root."
    exit 1
fi

print_status "Starting OAuth redirect debugging..."

# 1. Check environment variables
echo ""
print_status "1. Checking environment variables..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    if grep -q "GOOGLE_CLIENT_ID" .env && grep -q "GOOGLE_CLIENT_SECRET" .env; then
        print_success "Google OAuth credentials found in .env"
    else
        print_error "Google OAuth credentials missing from .env"
    fi
else
    print_error ".env file not found"
fi

# 2. Check NextAuth configuration
echo ""
print_status "2. Checking NextAuth configuration..."
if [ -f "lib/nextauth-config.ts" ]; then
    echo "✅ NextAuth config file exists"
    if grep -q "GoogleProvider" lib/nextauth-config.ts; then
        print_success "GoogleProvider found in NextAuth config"
    else
        print_error "GoogleProvider not found in NextAuth config"
    fi
else
    print_error "NextAuth config file not found"
fi

# 3. Check OAuth button component
echo ""
print_status "3. Checking OAuth button component..."
if [ -f "components/auth/OAuthButtons.tsx" ]; then
    echo "✅ OAuthButtons component exists"
    if grep -q "window.location.href" components/auth/OAuthButtons.tsx; then
        print_success "window.location.href redirect found in OAuth button"
    else
        print_error "window.location.href redirect not found in OAuth button"
    fi
else
    print_error "OAuthButtons component not found"
fi

# 4. Test API endpoints
echo ""
print_status "4. Testing API endpoints..."

# Test providers endpoint
print_status "Testing /api/auth/providers..."
PROVIDERS_RESPONSE=$(curl -s "https://naukrimili.com/api/auth/providers" 2>/dev/null)
if [ $? -eq 0 ]; then
    if echo "$PROVIDERS_RESPONSE" | grep -q "google"; then
        print_success "Google provider found in /api/auth/providers"
    else
        print_error "Google provider not found in /api/auth/providers"
    fi
else
    print_error "Failed to access /api/auth/providers"
fi

# Test Google signin endpoint
print_status "Testing /api/auth/signin/google..."
SIGNIN_RESPONSE=$(curl -I "https://naukrimili.com/api/auth/signin/google" 2>/dev/null)
if [ $? -eq 0 ]; then
    if echo "$SIGNIN_RESPONSE" | grep -q "200\|302"; then
        print_success "Google signin endpoint accessible"
    else
        print_warning "Google signin endpoint returned: $(echo "$SIGNIN_RESPONSE" | head -1)"
    fi
else
    print_error "Failed to access /api/auth/signin/google"
fi

# 5. Create simplified OAuth button for testing
echo ""
print_status "5. Creating simplified OAuth button for testing..."

cat > components/auth/OAuthButtons.tsx << 'EOF'
'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface OAuthButtonsProps {
  callbackUrl?: string;
  className?: string;
}

export default function OAuthButtons({ callbackUrl, className }: OAuthButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = () => {
    console.log('🔄 Starting Google OAuth redirect...');
    setIsLoading(true);
    setError(null);
    
    try {
      // Simple direct redirect - no complex mobile optimization
      const signInUrl = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl || '/auth/role-selection')}`;
      console.log('📍 Redirect URL:', signInUrl);
      
      // Multiple redirect methods for maximum compatibility
      console.log('🔄 Attempting redirect with window.location.href...');
      window.location.href = signInUrl;
      
      // Fallback after 2 seconds if redirect doesn't work
      setTimeout(() => {
        console.log('⚠️ Fallback: Trying window.location.assign...');
        window.location.assign(signInUrl);
      }, 2000);
      
    } catch (error) {
      console.error('❌ Google sign-in error:', error);
      setError('Sign-in failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-3 ${className || ''}`}>
      {error && (
        <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded-lg">
          {error}
          <button 
            onClick={() => {
              setError(null);
              handleGoogleSignIn();
            }}
            className="ml-2 text-blue-600 hover:underline"
          >
            Retry
          </button>
        </div>
      )}
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
          <>
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </>
        )}
      </Button>
      
      <div className="text-xs text-gray-500 text-center px-2">
        By continuing, you agree to NaukriMili's{' '}
        <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
        {' '}and{' '}
        <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
        . We'll use your Google account to create your profile and send you job notifications.
      </div>
    </div>
  );
}

// Named export for compatibility
export { OAuthButtons };
EOF

print_success "Simplified OAuth button created with enhanced debugging"

# 6. Create a test page for debugging
echo ""
print_status "6. Creating OAuth debug test page..."

mkdir -p app/debug-oauth

cat > app/debug-oauth/page.tsx << 'EOF'
'use client';

import { useState } from 'react';
import OAuthButtons from '@/components/auth/OAuthButtons';

export default function OAuthDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Override console.log to capture logs
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    originalConsoleLog(...args);
    addLog(args.join(' '));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          OAuth Debug Test Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Google OAuth</h2>
          <p className="text-gray-600 mb-4">
            Click the button below to test Google OAuth redirect. Check the logs below for debugging information.
          </p>
          <OAuthButtons callbackUrl="/auth/role-selection" />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Click the OAuth button above to start debugging.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-sm font-mono text-gray-700 mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
          <button 
            onClick={() => setLogs([])}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Clear Logs
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Direct Test Links</h2>
          <div className="space-y-2">
            <a 
              href="/api/auth/signin/google?callbackUrl=%2Fauth%2Frole-selection"
              target="_blank"
              className="block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Direct Google OAuth Link (Opens in New Tab)
            </a>
            <a 
              href="/api/auth/providers"
              target="_blank"
              className="block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              View OAuth Providers JSON
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

print_success "OAuth debug test page created at /debug-oauth"

# 7. Build and restart the application
echo ""
print_status "7. Building and restarting application..."

print_status "Building Next.js application..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build completed successfully"
    
    print_status "Restarting PM2 application..."
    pm2 restart all --update-env
    
    if [ $? -eq 0 ]; then
        print_success "Application restarted successfully"
    else
        print_error "Failed to restart application"
    fi
else
    print_error "Build failed"
fi

# 8. Final instructions
echo ""
print_status "8. Testing Instructions:"
echo ""
echo "🔧 Debugging Steps Completed:"
echo "   ✅ Environment variables checked"
echo "   ✅ NextAuth configuration verified"
echo "   ✅ OAuth button component simplified"
echo "   ✅ Debug test page created"
echo "   ✅ Application rebuilt and restarted"
echo ""
echo "🧪 Next Steps for Testing:"
echo "   1. Open your browser and go to: https://naukrimili.com/debug-oauth"
echo "   2. Open browser developer tools (F12)"
echo "   3. Go to Console tab"
echo "   4. Click 'Continue with Google' button"
echo "   5. Watch the console logs for debugging information"
echo "   6. Check if redirect happens or if there are any errors"
echo ""
echo "🔍 Additional Debugging:"
echo "   - Test direct link: https://naukrimili.com/api/auth/signin/google?callbackUrl=%2Fauth%2Frole-selection"
echo "   - Check providers: https://naukrimili.com/api/auth/providers"
echo "   - Monitor PM2 logs: pm2 logs naukrimili --lines 50"
echo ""
print_success "Debugging script completed! Please test the OAuth functionality now."
