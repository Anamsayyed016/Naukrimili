#!/bin/bash

echo "🔧 OAUTH DEPLOYMENT SCRIPT"
echo "========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Step 1: Check if .env exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_status "Please create .env file with your OAuth credentials:"
    echo ""
    echo "NEXTAUTH_URL=https://naukrimili.com"
    echo "NEXTAUTH_SECRET=your-nextauth-secret"
    echo "GOOGLE_CLIENT_ID=your-google-client-id"
    echo "GOOGLE_CLIENT_SECRET=your-google-client-secret"
    echo "GITHUB_ID=your-github-client-id"
    echo "GITHUB_SECRET=your-github-client-secret"
    echo "DATABASE_URL=your-database-url"
    echo "JWT_SECRET=your-jwt-secret"
    echo ""
    exit 1
fi

print_success ".env file found"

# Step 2: Update .gitignore to ignore .env
print_status "Updating .gitignore..."
if ! grep -q "^\.env$" .gitignore; then
    echo ".env" >> .gitignore
    print_success ".env added to .gitignore"
else
    print_warning ".env already in .gitignore"
fi

# Step 3: Install dependencies
print_status "Installing dependencies..."
npm install

# Step 4: Build the application
print_status "Building the application..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Step 5: Restart PM2
print_status "Restarting PM2 with new environment..."
pm2 restart all --update-env

# Step 6: Test OAuth endpoints
print_status "Testing OAuth endpoints..."
sleep 5

echo "Testing providers endpoint..."
PROVIDERS_RESPONSE=$(curl -s "https://naukrimili.com/api/auth/providers")
if echo "$PROVIDERS_RESPONSE" | grep -q "google"; then
    print_success "Google provider is available"
else
    print_error "Google provider not found"
fi

echo "Testing Google signin endpoint..."
GOOGLE_RESPONSE=$(curl -I "https://naukrimili.com/api/auth/signin/google" 2>/dev/null)
if echo "$GOOGLE_RESPONSE" | grep -q "302\|301"; then
    print_success "Google signin endpoint is redirecting properly"
elif echo "$GOOGLE_RESPONSE" | grep -q "200"; then
    print_success "Google signin endpoint is responding"
else
    print_warning "Google signin endpoint response: $(echo "$GOOGLE_RESPONSE" | head -1)"
fi

# Step 7: Show final status
print_status "Final status check..."
pm2 status

echo ""
echo "🎉 OAUTH DEPLOYMENT COMPLETED!"
echo "=============================="
echo "✅ Application built successfully"
echo "✅ PM2 restarted with new environment"
echo "✅ OAuth endpoints tested"
echo ""
echo "🔍 Test the OAuth functionality:"
echo "1. Visit: https://naukrimili.com/auth/signin"
echo "2. Click 'Continue with Google'"
echo "3. Check browser console for any errors"
echo ""
echo "📊 Monitor logs: pm2 logs naukrimili"
echo "🔄 Restart if needed: pm2 restart naukrimili"
echo ""
echo "🚀 OAuth should now work on the production server!"
