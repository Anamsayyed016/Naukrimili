#!/bin/bash

# Ultimate Server Fix - Fast and Complete
# Fixes all build issues and missing dependencies

echo "🚀 ULTIMATE SERVER FIX - FAST MODE"
echo "==================================="

cd /var/www/jobportal

# Stop PM2
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Complete clean
rm -rf .next node_modules package-lock.json .npm
npm cache clean --force

# Install with all flags
npm install --legacy-peer-deps --engine-strict=false --force

# Install missing packages
npm install tailwindcss postcss autoprefixer @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-toast class-variance-authority clsx tailwind-merge lucide-react --legacy-peer-deps --engine-strict=false

# Generate Prisma
npx prisma generate

# Create missing files
mkdir -p lib components/ui components/auth

# Create safe-array-utils
cat > lib/safe-array-utils.ts << 'EOF'
export function safeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value;
  return [];
}
export function safeArrayLength(value: unknown): number {
  return safeArray(value).length;
}
EOF

# Create OAuthButtons
cat > components/auth/OAuthButtons.tsx << 'EOF'
'use client';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
export default function OAuthButtons({ callbackUrl }: { callbackUrl?: string }) {
  return (
    <Button onClick={() => signIn('google', { callbackUrl: callbackUrl || '/roles/choose' })} className="w-full" variant="outline">
      Continue with Google
    </Button>
  );
}
EOF

# Create SEOJobLink
cat > components/SEOJobLink.tsx << 'EOF'
import Link from 'next/link';
export default function SEOJobLink({ href, children, className }: any) {
  return <Link href={href} className={className}>{children}</Link>;
}
EOF

# Create UnifiedJobSearch
cat > components/UnifiedJobSearch.tsx << 'EOF'
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export default function UnifiedJobSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearch = () => {
    if (searchTerm.trim()) window.location.href = `/jobs?q=${encodeURIComponent(searchTerm)}`;
  };
  return (
    <div className="flex gap-2">
      <Input placeholder="Search jobs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} />
      <Button onClick={handleSearch}>Search</Button>
    </div>
  );
}
EOF

# Create Input component
cat > components/ui/input.tsx << 'EOF'
import * as React from "react";
import { cn } from "@/lib/utils";
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return <input type={type} className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)} ref={ref} {...props} />;
});
Input.displayName = "Input";
export { Input };
EOF

# Create utils
cat > lib/utils.ts << 'EOF'
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
EOF

# Build
NODE_ENV=production NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Check build
if [ -f ".next/server/middleware-manifest.json" ]; then
  echo "✅ Build successful"
  pm2 start ecosystem.config.cjs
  sleep 10
  pm2 status
  systemctl restart nginx
  echo "✅ Server fixed! Check https://aftionix.in"
else
  echo "❌ Build failed"
  exit 1
fi