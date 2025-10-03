#!/bin/bash

# Complete Dependency Fix Script
# Installs all missing dependencies and fixes build issues

echo "🔧 COMPLETE DEPENDENCY FIX"
echo "=========================="

cd /var/www/jobportal

# Stop PM2
echo "Stopping PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Complete clean
echo "Cleaning everything..."
rm -rf .next
rm -rf node_modules
rm -rf package-lock.json
rm -rf .npm
npm cache clean --force

# Install core dependencies first
echo "Installing core dependencies..."
npm install --legacy-peer-deps --engine-strict=false --force

# Install missing Tailwind CSS and PostCSS
echo "Installing Tailwind CSS and PostCSS..."
npm install tailwindcss postcss autoprefixer --save-dev --legacy-peer-deps --engine-strict=false

# Install missing UI components
echo "Installing UI components..."
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-toast --legacy-peer-deps --engine-strict=false

# Install missing utility libraries
echo "Installing utility libraries..."
npm install class-variance-authority clsx tailwind-merge lucide-react --legacy-peer-deps --engine-strict=false

# Install testing libraries
echo "Installing testing libraries..."
npm install @testing-library/react @testing-library/jest-dom @testing-library/dom jest ts-jest --save-dev --legacy-peer-deps --engine-strict=false

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Create missing files if they don't exist
echo "Creating missing utility files..."

# Create safe-array-utils if missing
if [ ! -f "lib/safe-array-utils.ts" ]; then
    mkdir -p lib
    cat > lib/safe-array-utils.ts << 'EOF'
// Safe array utilities
export function safeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
}

export function safeArrayLength(value: unknown): number {
  return safeArray(value).length;
}
EOF
fi

# Create OAuthButtons if missing
if [ ! -f "components/auth/OAuthButtons.tsx" ]; then
    mkdir -p components/auth
    cat > components/auth/OAuthButtons.tsx << 'EOF'
'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

interface OAuthButtonsProps {
  callbackUrl?: string;
}

export default function OAuthButtons({ callbackUrl }: OAuthButtonsProps) {
  return (
    <div className="space-y-2">
      <Button
        onClick={() => signIn('google', { callbackUrl: callbackUrl || '/roles/choose' })}
        className="w-full"
        variant="outline"
      >
        Continue with Google
      </Button>
    </div>
  );
}
EOF
fi

# Create SEOJobLink if missing
if [ ! -f "components/SEOJobLink.tsx" ]; then
    cat > components/SEOJobLink.tsx << 'EOF'
import Link from 'next/link';

interface SEOJobLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function SEOJobLink({ href, children, className }: SEOJobLinkProps) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
EOF
fi

# Create UnifiedJobSearch if missing
if [ ! -f "components/UnifiedJobSearch.tsx" ]; then
    cat > components/UnifiedJobSearch.tsx << 'EOF'
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function UnifiedJobSearch() {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = () => {
    if (searchTerm.trim()) {
      window.location.href = `/jobs?q=${encodeURIComponent(searchTerm)}`;
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Search jobs..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
      />
      <Button onClick={handleSearch}>Search</Button>
    </div>
  );
}
EOF
fi

# Create Input component if missing
if [ ! -f "components/ui/input.tsx" ]; then
    mkdir -p components/ui
    cat > components/ui/input.tsx << 'EOF'
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
EOF
fi

# Create utils if missing
if [ ! -f "lib/utils.ts" ]; then
    cat > lib/utils.ts << 'EOF'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF
fi

# Build with production settings
echo "Building application..."
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1

npm run build

# Check if build was successful
if [ -f ".next/server/middleware-manifest.json" ] && [ -f ".next/required-server-files.json" ]; then
    echo "✅ Build successful - all required files present"
    echo "Files in .next/server/:"
    ls -la .next/server/ | head -10
else
    echo "❌ Build failed - missing critical files"
    echo "Checking what files exist in .next directory:"
    ls -la .next/ 2>/dev/null || echo "No .next directory found"
    exit 1
fi

# Start with PM2
echo "Starting application with PM2..."
pm2 start ecosystem.config.cjs

# Wait and check status
echo "Waiting for application to start..."
sleep 15

pm2 status

# Test application
echo "Testing application..."
if curl -f http://localhost:3000/health >/dev/null 2>&1; then
    echo "✅ Application is responding on port 3000"
else
    echo "⚠️ Application not responding on port 3000"
    echo "Checking PM2 logs:"
    pm2 logs jobportal --lines 15
fi

# Restart Nginx
echo "Restarting Nginx..."
systemctl restart nginx

echo "✅ Complete dependency fix completed!"
echo "Check your application at: https://aftionix.in"
