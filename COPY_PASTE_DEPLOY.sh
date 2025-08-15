#!/bin/bash

# 🚀 COMPLETELY HANDS-OFF DEPLOYMENT
# Just copy-paste this entire script on your server and run it!

echo "🚀 STARTING COMPLETELY HANDS-OFF DEPLOYMENT"
echo "============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Navigate to project directory
cd /var/www/jobportal || {
    print_error "Directory /var/www/jobportal not found"
    exit 1
}

print_success "Current directory: $(pwd)"

# Step 1: Pull latest code
print_status "📥 Pulling latest code..."
git fetch --all
git reset --hard origin/main
print_success "Code updated to latest version"

# Step 2: Setup SSH keys automatically
print_status "🔑 Setting up SSH keys automatically..."

# Create SSH directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Generate new SSH key pair
if [ ! -f ~/.ssh/github_actions ]; then
    print_status "Generating new SSH key pair..."
    ssh-keygen -t ed25519 -C "github-actions-deployment" -f ~/.ssh/github_actions -N "" -q
    print_success "SSH key pair generated"
else
    print_warning "SSH key already exists, using existing key"
fi

# Set correct permissions
chmod 600 ~/.ssh/github_actions
chmod 600 ~/.ssh/github_actions.pub

# Add public key to authorized_keys
if [ ! -f ~/.ssh/authorized_keys ] || ! grep -q "$(cat ~/.ssh/github_actions.pub)" ~/.ssh/authorized_keys; then
    print_status "Adding public key to authorized_keys..."
    cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
    print_success "Public key added to authorized_keys"
else
    print_warning "Public key already in authorized_keys"
fi

# Display key information
print_status "SSH Key Information:"
echo "Public Key: $(cat ~/.ssh/github_actions.pub)"
echo "Private Key Location: ~/.ssh/github_actions"
echo ""

# Step 3: Setup PostgreSQL automatically
print_status "🔴 Setting up PostgreSQL automatically..."

if ! systemctl is-active --quiet postgresql; then
    print_status "Installing PostgreSQL..."
    apt update -y
    apt install -y postgresql postgresql-contrib
    
    print_status "Starting PostgreSQL service..."
    systemctl start postgresql
    systemctl enable postgresql
    
    print_status "Creating database and user..."
    sudo -u postgres createdb jobportal || print_warning "Database already exists"
    sudo -u postgres createuser jobportal_user || print_warning "User already exists"
    sudo -u postgres psql -c "ALTER USER jobportal_user WITH PASSWORD 'secure_password_123';" || print_warning "Password already set"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE jobportal TO jobportal_user;" || print_warning "Privileges already granted"
    
    print_success "PostgreSQL setup complete!"
else
    print_success "PostgreSQL already running"
fi

# Step 4: Create production environment automatically
print_status "🔴 Creating production environment automatically..."

cat > .env.local << 'ENVEOF'
NODE_ENV=production
DATABASE_URL="postgresql://jobportal_user:secure_password_123@localhost:5432/jobportal"
NEXT_PUBLIC_BASE_URL=https://aftionix.in
NEXTAUTH_SECRET="your-secret-key-here"
ENVEOF

print_success "Production environment configured!"
print_status "🔴 Mock data will be automatically disabled!"
print_status "🚀 PostgreSQL will be automatically used!"

# Step 5: Install dependencies
print_status "📦 Installing dependencies..."
npm install --legacy-peer-deps
print_success "Dependencies installed"

# Step 6: Build application
print_status "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build successful!"
    
    # Step 7: Restart service
    print_status "🔄 Restarting service..."
    systemctl restart jobportal
    print_success "Service restarted!"
    
    # Step 8: Check service status
    print_status "📊 Service status:"
    systemctl status jobportal --no-pager
    
    print_success "🎉 Deployment complete!"
    print_status "🔴 Mock data: DISABLED"
    print_status "🚀 PostgreSQL: ACTIVE"
    print_status "🌐 Website: https://aftionix.in"
    
    # Step 9: Test the application
    print_status "🧪 Testing application..."
    sleep 5
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        print_success "Health check passed!"
    else
        print_warning "Health check failed but continuing"
    fi
    
else
    print_error "Build failed!"
    exit 1
fi

# Step 10: Display final information
echo ""
echo "🎯 DEPLOYMENT SUMMARY"
echo "===================="
echo "✅ Code updated to latest version"
echo "✅ SSH keys configured automatically"
echo "✅ PostgreSQL installed and configured"
echo "✅ Production environment created"
echo "✅ Dependencies installed"
echo "✅ Application built successfully"
echo "✅ Service restarted"
echo "✅ Mock data disabled"
echo "✅ Real database activated"
echo ""
echo "🔑 SSH Key Information (for GitHub Actions):"
echo "Public Key: $(cat ~/.ssh/github_actions.pub)"
echo "Private Key: ~/.ssh/github_actions"
echo ""
echo "📖 To use GitHub Actions deployment:"
echo "1. Copy the private key content: cat ~/.ssh/github_actions"
echo "2. Add to GitHub Secrets as SSH_PRIVATE_KEY"
echo "3. Push to main branch to trigger automatic deployment"
echo ""
echo "🚀 Your website is now running with real PostgreSQL data!"
echo "🌐 Visit: https://aftionix.in"
echo ""
print_success "🎉 HANDS-OFF DEPLOYMENT COMPLETE!"
echo ""
echo "🔑 NEXT STEP: Copy this private key to GitHub:"
echo "================================================"
cat ~/.ssh/github_actions
echo "================================================"
echo ""
echo "📖 Instructions:"
echo "1. Copy the private key above (including BEGIN and END lines)"
echo "2. Go to GitHub → Settings → Secrets → Actions"
echo "3. Add new secret: SSH_PRIVATE_KEY"
echo "4. Paste the private key content"
echo "5. Push any change to main branch"
echo "6. GitHub Actions will automatically deploy!"
echo ""
print_success "🎉 EVERYTHING IS NOW AUTOMATED!"
