#!/bin/bash

##############################################################################
# Gmail OAuth2 Setup Script for NaukriMili Job Portal
# 
# This script helps you set up Gmail OAuth2 credentials step by step
# 
# Usage:
#   chmod +x scripts/setup-gmail-oauth2.sh
#   ./scripts/setup-gmail-oauth2.sh
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo ""
    echo "══════════════════════════════════════════════════════════════════════"
    echo -e "${BLUE}$1${NC}"
    echo "══════════════════════════════════════════════════════════════════════"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo ""
    echo -e "${YELLOW}═══ STEP $1: $2 ═══${NC}"
    echo ""
}

# Main script
clear
print_header "Gmail OAuth2 Setup for NaukriMili Job Portal"

echo "This script will guide you through setting up Gmail OAuth2 for email notifications."
echo ""
echo "Prerequisites:"
echo "  1. Google Cloud Console account"
echo "  2. Gmail account (info@naukrimili.com or naukrimili@naukrimili.com)"
echo "  3. Access to Google Cloud project"
echo ""
read -p "Press ENTER to continue..."

# Step 1: Check if .env exists
print_step "1" "Checking Environment Configuration"

if [ -f ".env" ]; then
    print_success ".env file exists"
    
    # Check if Gmail variables already exist
    if grep -q "GMAIL_API_CLIENT_ID" .env; then
        print_warning "Gmail OAuth2 variables already exist in .env"
        read -p "Do you want to overwrite them? (y/N): " overwrite
        if [[ ! $overwrite =~ ^[Yy]$ ]]; then
            print_info "Keeping existing configuration"
            SKIP_ENV_UPDATE=true
        fi
    fi
else
    print_info ".env file not found, will create it"
    cp env.template .env 2>/dev/null || touch .env
    print_success "Created .env file"
fi

# Step 2: Google Cloud Console Setup
print_step "2" "Google Cloud Console Setup"

print_info "Opening Google Cloud Console guides..."
echo ""
echo "Please complete these steps in Google Cloud Console:"
echo ""
echo "A) Enable Gmail API"
echo "   URL: https://console.cloud.google.com/apis/library"
echo "   1. Search for 'Gmail API'"
echo "   2. Click 'Enable'"
echo ""
echo "B) Create OAuth2 Credentials"
echo "   URL: https://console.cloud.google.com/apis/credentials"
echo "   1. Click '+ CREATE CREDENTIALS'"
echo "   2. Select 'OAuth client ID'"
echo "   3. Application type: 'Web application'"
echo "   4. Name: 'NaukriMili Gmail Service'"
echo "   5. Authorized redirect URIs: Add this EXACT URI:"
echo "      https://developers.google.com/oauthplayground"
echo "   6. Click 'CREATE'"
echo "   7. Copy the Client ID and Client Secret"
echo ""
read -p "Have you completed these steps? (y/N): " completed_gcp

if [[ ! $completed_gcp =~ ^[Yy]$ ]]; then
    print_warning "Please complete the Google Cloud Console setup first"
    exit 1
fi

# Step 3: Collect OAuth2 Credentials
print_step "3" "Collecting OAuth2 Credentials"

print_info "Enter your OAuth2 credentials from Google Cloud Console:"
echo ""

read -p "Client ID: " CLIENT_ID
read -p "Client Secret: " CLIENT_SECRET

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    print_error "Client ID and Client Secret are required"
    exit 1
fi

print_success "Credentials collected"

# Step 4: Generate Refresh Token
print_step "4" "Generating Refresh Token"

echo "To generate a refresh token:"
echo ""
echo "1. Open OAuth2 Playground:"
echo "   URL: https://developers.google.com/oauthplayground"
echo ""
echo "2. Click the settings icon (⚙️) in the top right"
echo "   - Check: 'Use your own OAuth credentials'"
echo "   - OAuth Client ID: $CLIENT_ID"
echo "   - OAuth Client secret: $CLIENT_SECRET"
echo "   - Click 'Close'"
echo ""
echo "3. In 'Step 1 - Select & authorize APIs':"
echo "   - Scroll to 'Gmail API v1'"
echo "   - Select: https://www.googleapis.com/auth/gmail.send"
echo "   - Click 'Authorize APIs'"
echo ""
echo "4. Sign in with your Gmail account (info@naukrimili.com)"
echo ""
echo "5. In 'Step 2 - Exchange authorization code for tokens':"
echo "   - Click 'Exchange authorization code for tokens'"
echo "   - Copy the 'Refresh token' (starts with '1//')"
echo ""
read -p "Press ENTER when you have the refresh token..."

echo ""
read -p "Paste Refresh Token: " REFRESH_TOKEN

if [ -z "$REFRESH_TOKEN" ]; then
    print_error "Refresh token is required"
    exit 1
fi

print_success "Refresh token collected"

# Step 5: Email Configuration
print_step "5" "Email Configuration"

print_info "Configure sender information:"
echo ""

read -p "Sender Email (default: naukrimili@naukrimili.com): " SENDER_EMAIL
SENDER_EMAIL=${SENDER_EMAIL:-naukrimili@naukrimili.com}

read -p "Sender Name (default: NaukriMili): " SENDER_NAME
SENDER_NAME=${SENDER_NAME:-NaukriMili}

print_success "Email configuration set"

# Step 6: Update .env file
print_step "6" "Updating Environment File"

if [ "$SKIP_ENV_UPDATE" != "true" ]; then
    # Remove existing Gmail OAuth2 variables if they exist
    sed -i.bak '/^GMAIL_API_/d' .env 2>/dev/null || true
    sed -i.bak '/^GMAIL_SENDER/d' .env 2>/dev/null || true
    sed -i.bak '/^GMAIL_FROM_NAME/d' .env 2>/dev/null || true
    
    # Add Gmail OAuth2 configuration
    cat >> .env <<EOF

# Gmail OAuth2 API Configuration (Added by setup script)
GMAIL_API_CLIENT_ID=$CLIENT_ID
GMAIL_API_CLIENT_SECRET=$CLIENT_SECRET
GMAIL_API_REFRESH_TOKEN=$REFRESH_TOKEN
GMAIL_SENDER=$SENDER_NAME <$SENDER_EMAIL>
GMAIL_FROM_NAME=$SENDER_NAME
EOF
    
    print_success "Environment file updated"
else
    print_info "Skipped environment file update (user choice)"
fi

# Step 7: Verify Configuration
print_step "7" "Verifying Configuration"

print_info "Running diagnostic tests..."
echo ""

if command -v node &> /dev/null; then
    if [ -f "scripts/diagnose-gmail-oauth2.js" ]; then
        node scripts/diagnose-gmail-oauth2.js
    else
        print_warning "Diagnostic script not found, skipping automated tests"
    fi
else
    print_warning "Node.js not found, skipping automated tests"
fi

# Step 8: Final Instructions
print_step "8" "Setup Complete!"

print_success "Gmail OAuth2 has been configured!"
echo ""
echo "Next steps:"
echo ""
echo "1. Review your .env file:"
echo "   cat .env | grep GMAIL"
echo ""
echo "2. Test the configuration:"
echo "   node scripts/diagnose-gmail-oauth2.js --send-email"
echo ""
echo "3. Start your application:"
echo "   pm2 start ecosystem.config.cjs --env production"
echo "   # OR"
echo "   npm run dev"
echo ""
echo "4. Monitor logs:"
echo "   pm2 logs naukrimili"
echo ""
echo "5. Test welcome email by signing up with a new Google account"
echo ""
print_success "Setup complete! 🎉"
echo ""

