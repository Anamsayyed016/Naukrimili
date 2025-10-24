#!/bin/bash

# ULTIMATE CI FIX - Addresses all possible CI build issues
echo "🚀 ULTIMATE CI FIX - Comprehensive solution for all CI issues..."

set -e

# Step 1: Complete nuclear cleanup
echo "🧹 Nuclear cleanup..."
rm -rf node_modules package-lock.json .next .npm .tsbuildinfo
npm cache clean --force

# Step 2: Create comprehensive .npmrc
echo "⚙️ Creating comprehensive .npmrc..."
cat > .npmrc << 'EOF'
engine-strict=false
legacy-peer-deps=true
fund=false
audit=false
auto-install-peers=true
prefer-offline=false
cache-max=0
registry=https://registry.npmjs.org/
EOF

# Step 3: Install dependencies with maximum compatibility
echo "📦 Installing dependencies with maximum compatibility..."
npm install --legacy-peer-deps --engine-strict=false --force --no-optional --prefer-offline=false

# Step 4: Install ALL missing packages explicitly
echo "📦 Installing ALL missing packages..."
npm install --legacy-peer-deps --engine-strict=false \
  tailwindcss@latest \
  postcss@latest \
  autoprefixer@latest \
  @radix-ui/react-slot@latest \
  @radix-ui/react-dialog@latest \
  @radix-ui/react-dropdown-menu@latest \
  @radix-ui/react-toast@latest \
  class-variance-authority@latest \
  clsx@latest \
  tailwind-merge@latest \
  lucide-react@latest

# Step 5: Install as dev dependencies
echo "📦 Installing as dev dependencies..."
npm install --save-dev --legacy-peer-deps --engine-strict=false \
  tailwindcss@latest \
  postcss@latest \
  autoprefixer@latest \
  @radix-ui/react-slot@latest \
  @radix-ui/react-dialog@latest \
  @radix-ui/react-dropdown-menu@latest \
  @radix-ui/react-toast@latest \
  class-variance-authority@latest \
  clsx@latest \
  tailwind-merge@latest \
  lucide-react@latest

# Step 6: Verify critical packages with detailed checks
echo "✅ Verifying package installations..."
if [ -d "node_modules/tailwindcss" ]; then
  echo "✅ tailwindcss found"
  ls -la node_modules/tailwindcss/package.json
else
  echo "❌ Installing tailwindcss manually..."
  npm install tailwindcss@latest --legacy-peer-deps --engine-strict=false --force
fi

if [ -d "node_modules/lucide-react" ]; then
  echo "✅ lucide-react found"
  ls -la node_modules/lucide-react/package.json
else
  echo "❌ Installing lucide-react manually..."
  npm install lucide-react@latest --legacy-peer-deps --engine-strict=false --force
fi

# Step 7: Create missing directories
echo "📁 Creating missing directories..."
mkdir -p .next
mkdir -p components/ui
mkdir -p lib
mkdir -p components/auth
mkdir -p components
mkdir -p app

# Step 8: Verify and create critical files
echo "✅ Verifying and creating critical files..."

# Verify lib/safe-array-utils.ts
if [ -f "lib/safe-array-utils.ts" ]; then
  echo "✅ lib/safe-array-utils.ts exists"
else
  echo "❌ Creating lib/safe-array-utils.ts..."
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

export function safeLength(value: unknown): number {
  return safeArrayLength(value);
}

export function hasItems(value: unknown): boolean {
  return safeArrayLength(value) > 0;
}

export function safeArrayFirst<T>(value: unknown): T | undefined {
  const arr = safeArray<T>(value);
  return arr.length > 0 ? arr[0] : undefined;
}

export function safeArrayLast<T>(value: unknown): T | undefined {
  const arr = safeArray<T>(value);
  return arr.length > 0 ? arr[arr.length - 1] : undefined;
}
EOF
fi

# Verify components/SEOJobLink.tsx
if [ -f "components/SEOJobLink.tsx" ]; then
  echo "✅ components/SEOJobLink.tsx exists"
else
  echo "❌ Creating components/SEOJobLink.tsx..."
  mkdir -p components
  cat > components/SEOJobLink.tsx << 'EOF'
import Link from 'next/link';

interface SEOJobLinkProps {
  href?: string;
  job?: any;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export default function SEOJobLink({ href, job, children, className, title }: SEOJobLinkProps) {
  const linkHref = href || (job ? `/jobs/${job.id}` : '#');
  
  return (
    <Link 
      href={linkHref} 
      className={className}
      title={title}
    >
      {children}
    </Link>
  );
}

export const useSEOJobUrl = (job: any) => {
  return `/jobs/${job.id}`;
};

export const getJobUrl = (job: any) => {
  return `/jobs/${job.id}`;
};
EOF
fi

# Verify components/auth/OAuthButtons.tsx
if [ -f "components/auth/OAuthButtons.tsx" ]; then
  echo "✅ components/auth/OAuthButtons.tsx exists"
else
  echo "❌ Creating components/auth/OAuthButtons.tsx..."
  mkdir -p components/auth
  cat > components/auth/OAuthButtons.tsx << 'EOF'
'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface OAuthButtonsProps {
  callbackUrl?: string;
  className?: string;
}

export default function OAuthButtons({ callbackUrl, className }: OAuthButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { 
        callbackUrl: callbackUrl || '/roles/choose',
        redirect: true 
      });
    } catch (error) {
      console.error('Google sign-in error:', error);
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

export { OAuthButtons };
EOF
fi

# Verify components/ui/button.tsx
if [ -f "components/ui/button.tsx" ]; then
  echo "✅ components/ui/button.tsx exists"
else
  echo "❌ Creating components/ui/button.tsx..."
  mkdir -p components/ui
  cat > components/ui/button.tsx << 'EOF'
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
EOF
fi

# Verify lib/utils.ts
if [ -f "lib/utils.ts" ]; then
  echo "✅ lib/utils.ts exists"
else
  echo "❌ Creating lib/utils.ts..."
  mkdir -p lib
  cat > lib/utils.ts << 'EOF'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF
fi

# Step 9: Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Step 10: Verify file structure with detailed listing
echo "📋 Verifying file structure..."
echo "=== File Structure Verification ==="
ls -la lib/safe-array-utils.ts || echo "❌ Missing lib/safe-array-utils.ts"
ls -la components/SEOJobLink.tsx || echo "❌ Missing components/SEOJobLink.tsx"
ls -la components/auth/OAuthButtons.tsx || echo "❌ Missing components/auth/OAuthButtons.tsx"
ls -la components/ui/button.tsx || echo "❌ Missing components/ui/button.tsx"
ls -la lib/utils.ts || echo "❌ Missing lib/utils.ts"

# Step 11: Test module resolution
echo "🔍 Testing module resolution..."
node -e "
try {
  require('./lib/safe-array-utils.ts');
  console.log('✅ lib/safe-array-utils.ts can be required');
} catch (e) {
  console.log('❌ lib/safe-array-utils.ts cannot be required:', e.message);
}
"

# Step 12: Build the application with multiple fallback strategies
echo "🔨 Building application with fallback strategies..."

export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_PUBLIC_BUILD_TIME=$(date +%s)000

# Strategy 1: Standard build
echo "🔨 Attempting standard build..."
if npm run build; then
  echo "✅ Standard build successful!"
  exit 0
fi

echo "❌ Standard build failed, trying alternative strategies..."

# Strategy 2: Direct next build
echo "🔨 Attempting direct next build..."
if npx next build; then
  echo "✅ Direct next build successful!"
  exit 0
fi

echo "❌ Direct next build failed, trying with different module resolution..."

# Strategy 3: Build with different module resolution
echo "🔨 Attempting build with different module resolution..."
export NODE_OPTIONS="--max-old-space-size=4096 --loader ts-node/esm"
if npx next build; then
  echo "✅ Build with different module resolution successful!"
  exit 0
fi

echo "❌ All build strategies failed"
exit 1