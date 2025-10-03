#!/bin/bash

# FINAL CI FIX - Addresses the remaining build issues
echo "🚀 FINAL CI FIX - Addressing remaining build issues..."

set -e

# Step 1: Complete cleanup
echo "🧹 Complete cleanup..."
rm -rf node_modules package-lock.json .next .npm .tsbuildinfo
npm cache clean --force

# Step 2: Create .npmrc with proper settings
echo "⚙️ Creating .npmrc..."
cat > .npmrc << 'EOF'
engine-strict=false
legacy-peer-deps=true
fund=false
audit=false
auto-install-peers=true
prefer-offline=false
EOF

# Step 3: Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --engine-strict=false --force

# Step 4: Install ALL required packages with explicit versions
echo "📦 Installing ALL required packages..."
npm install --legacy-peer-deps --engine-strict=false \
  tailwindcss@3.4.18 \
  postcss@8.4.47 \
  autoprefixer@10.4.20 \
  @radix-ui/react-slot@1.2.3 \
  @radix-ui/react-dialog@1.1.15 \
  @radix-ui/react-dropdown-menu@2.1.16 \
  @radix-ui/react-toast@1.2.15 \
  @radix-ui/react-card@1.0.0 \
  @radix-ui/react-badge@1.0.0 \
  class-variance-authority@0.7.1 \
  clsx@2.1.1 \
  tailwind-merge@2.6.0 \
  lucide-react@0.525.0

# Step 5: Install as dev dependencies
echo "📦 Installing as dev dependencies..."
npm install --save-dev --legacy-peer-deps --engine-strict=false \
  tailwindcss@3.4.18 \
  postcss@8.4.47 \
  autoprefixer@10.4.20 \
  @radix-ui/react-slot@1.2.3 \
  @radix-ui/react-dialog@1.1.15 \
  @radix-ui/react-dropdown-menu@2.1.16 \
  @radix-ui/react-toast@1.2.15 \
  @radix-ui/react-card@1.0.0 \
  @radix-ui/react-badge@1.0.0 \
  class-variance-authority@0.7.1 \
  clsx@2.1.1 \
  tailwind-merge@2.6.0 \
  lucide-react@0.525.0

# Step 6: Create missing directories
echo "📁 Creating missing directories..."
mkdir -p .next
mkdir -p components/ui
mkdir -p lib
mkdir -p components/auth
mkdir -p components
mkdir -p app

# Step 7: Create missing UI components
echo "✅ Creating missing UI components..."

# Create card.tsx
if [ ! -f "components/ui/card.tsx" ]; then
  echo "❌ Creating components/ui/card.tsx..."
  mkdir -p components/ui
  cat > components/ui/card.tsx << 'EOF'
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
EOF
else
  echo "✅ components/ui/card.tsx exists"
fi

# Create badge.tsx
if [ ! -f "components/ui/badge.tsx" ]; then
  echo "❌ Creating components/ui/badge.tsx..."
  mkdir -p components/ui
  cat > components/ui/badge.tsx << 'EOF'
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
EOF
else
  echo "✅ components/ui/badge.tsx exists"
fi

# Step 8: Verify all critical files exist
echo "✅ Verifying all critical files..."

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

# Step 9: Verify package installations
echo "✅ Verifying package installations..."
if [ -d "node_modules/tailwindcss" ]; then
  echo "✅ tailwindcss found"
else
  echo "❌ Installing tailwindcss manually..."
  npm install tailwindcss@3.4.18 --legacy-peer-deps --engine-strict=false --force
fi

if [ -d "node_modules/lucide-react" ]; then
  echo "✅ lucide-react found"
else
  echo "❌ Installing lucide-react manually..."
  npm install lucide-react@0.525.0 --legacy-peer-deps --engine-strict=false --force
fi

# Step 10: Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Step 11: Create tailwind.config.js if missing
if [ ! -f "tailwind.config.js" ]; then
  echo "❌ Creating tailwind.config.js..."
  cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
EOF
fi

# Step 12: Create postcss.config.js if missing
if [ ! -f "postcss.config.js" ]; then
  echo "❌ Creating postcss.config.js..."
  cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
fi

# Step 13: Build the application
echo "🔨 Building application..."
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_PUBLIC_BUILD_TIME=$(date +%s)000

# Try building
if npm run build; then
  echo "✅ Build successful!"
else
  echo "❌ Build failed, trying alternative approach..."
  
  # Try with direct next build
  if npx next build; then
    echo "✅ Direct next build successful!"
  else
    echo "❌ All build attempts failed"
    exit 1
  fi
fi

echo "✅ FINAL CI FIX COMPLETED!"
