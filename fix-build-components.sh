
#!/bin/bash

echo "🔧 FIXING BUILD COMPONENT ISSUES - DEEP DEBUG"
echo "=============================================="

# Step 1: Clean everything
echo "🧹 Cleaning build cache and dependencies..."
rm -rf .next
rm -rf node_modules
rm -rf package-lock.json
rm -rf .npm
rm -rf .tsbuildinfo

# Step 2: Clear npm cache
echo "🗑️ Clearing npm cache..."
npm cache clean --force

# Step 3: Create .npmrc for better compatibility
echo "📝 Creating .npmrc configuration..."
cat > .npmrc << 'EOF'
engine-strict=false
legacy-peer-deps=true
fund=false
audit=false
auto-install-peers=true
EOF

# Step 4: Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --engine-strict=false --force

# Step 5: Install specific UI dependencies
echo "🎨 Installing UI component dependencies..."
npm install --legacy-peer-deps --engine-strict=false \
  @radix-ui/react-slot@1.2.3 \
  @radix-ui/react-dialog@1.1.15 \
  @radix-ui/react-dropdown-menu@2.1.16 \
  @radix-ui/react-toast@1.2.15 \
  @radix-ui/react-label@2.1.1 \
  @radix-ui/react-checkbox@1.1.2 \
  @radix-ui/react-progress@1.1.1 \
  @radix-ui/react-select@2.2.5 \
  class-variance-authority@0.7.1 \
  clsx@2.1.1 \
  tailwind-merge@2.6.0 \
  lucide-react@0.525.0

# Step 6: Install dev dependencies
echo "🛠️ Installing dev dependencies..."
npm install --save-dev --legacy-peer-deps --engine-strict=false \
  tailwindcss@3.4.18 \
  postcss@8.4.47 \
  autoprefixer@10.4.20

# Step 7: Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Step 8: Verify UI components exist
echo "🔍 Verifying UI components..."
if [ ! -f "components/ui/card.tsx" ]; then
  echo "❌ Missing card.tsx - creating..."
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
fi

# Step 9: Test build
echo "🔨 Testing build..."
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_PUBLIC_SKIP_GOOGLE_FONTS=true
export NEXT_TELEMETRY_DISABLED=1

npm run build

# Step 10: Check build result
if [ -d ".next" ]; then
  echo "✅ Build successful!"
  echo "📊 Build size:"
  du -sh .next
else
  echo "❌ Build failed!"
  exit 1
fi

echo "🎉 Component fix completed successfully!"
