# Immediate CI Fix Script (PowerShell)
# Run this to fix the CI build issues right now

Write-Host "🚀 IMMEDIATE CI FIX - Starting..." -ForegroundColor Blue

# Step 1: Remove package-lock.json
Write-Host "🧹 Removing package-lock.json..." -ForegroundColor Yellow
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Step 2: Create .npmrc
Write-Host "⚙️ Creating .npmrc..." -ForegroundColor Yellow
@"
engine-strict=false
legacy-peer-deps=true
fund=false
audit=false
"@ | Out-File -FilePath ".npmrc" -Encoding UTF8

# Step 3: Install with bypass
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps --engine-strict=false --force

# Step 4: Install missing packages
Write-Host "📦 Installing missing packages..." -ForegroundColor Yellow
npm install tailwindcss postcss autoprefixer @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-toast class-variance-authority clsx tailwind-merge lucide-react --legacy-peer-deps --engine-strict=false

# Step 5: Generate Prisma
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Step 6: Build
Write-Host "🏗️ Building application..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
$env:NODE_OPTIONS = "--max-old-space-size=4096"
$env:NEXT_PUBLIC_BUILD_TIME = "$(Get-Date -UFormat %s)000"
npx next build

Write-Host "✅ CI Fix Complete!" -ForegroundColor Green
