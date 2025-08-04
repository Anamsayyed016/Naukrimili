#!/bin/bash

# 🚀 NaukriMili Job Portal - Hostinger KVM Deployment Script
# Run this script on your Hostinger server

echo "🚀 Starting NaukriMili Job Portal Deployment..."
echo "================================================"

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

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root"
    exit 1
fi

# Set variables
PROJECT_DIR="/home/root/public_html"
GITHUB_REPO="git@github.com:Anamsayyed016/Naukrimili.git"
APP_NAME="naukrimili"

print_status "Setting up deployment environment..."

# Create project directory if it doesn't exist
if [ ! -d "$PROJECT_DIR" ]; then
    print_status "Creating project directory..."
    mkdir -p "$PROJECT_DIR"
fi

# Navigate to project directory
cd "$PROJECT_DIR"

print_status "Current directory: $(pwd)"

# Backup existing files if they exist
if [ -f "package.json" ]; then
    print_warning "Existing project found. Creating backup..."
    BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -r * "$BACKUP_DIR/" 2>/dev/null || true
    print_success "Backup created in $BACKUP_DIR"
fi

# Clean existing files (except backup)
print_status "Cleaning existing files..."
rm -rf .next node_modules package-lock.json 2>/dev/null || true

# Clone GitHub repository
print_status "Cloning GitHub repository..."
if git clone "$GITHUB_REPO" . 2>/dev/null; then
    print_success "Repository cloned successfully"
else
    print_warning "SSH clone failed, trying HTTPS..."
    git clone "https://github.com/Anamsayyed016/Naukrimili.git" .
    if [ $? -ne 0 ]; then
        print_error "Failed to clone repository"
        exit 1
    fi
fi

# Check if Node.js is installed
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    print_status "You can install Node.js using:"
    echo "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "sudo apt-get install -y nodejs"
    exit 1
fi

print_success "Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

print_success "npm version: $(npm --version)"

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

print_success "Dependencies installed successfully"

# Build the application
print_status "Building application for production..."
npm run hostinger-build

if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi

print_success "Application built successfully"

# Check if .next directory exists
if [ ! -d ".next" ]; then
    print_error "Build failed - .next directory not found"
    exit 1
fi

# Install PM2 globally
print_status "Installing PM2 process manager..."
npm install -g pm2

if [ $? -ne 0 ]; then
    print_error "Failed to install PM2"
    exit 1
fi

print_success "PM2 installed successfully"

# Stop existing PM2 processes
print_status "Stopping existing PM2 processes..."
pm2 delete "$APP_NAME" 2>/dev/null || true

# Start the application with PM2
print_status "Starting application with PM2..."
pm2 start server.js --name "$APP_NAME"

if [ $? -ne 0 ]; then
    print_error "Failed to start application with PM2"
    exit 1
fi

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

# Set PM2 to start on boot
print_status "Setting PM2 to start on boot..."
pm2 startup

# Check application status
print_status "Checking application status..."
pm2 status

# Create environment file template
print_status "Creating environment file template..."
cat > .env.local.template << 'EOF'
# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key-here

# Database (MongoDB Atlas recommended)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/naukrimili

# Authentication
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Services (Optional)
OPENAI_API_KEY=your-openai-api-key

# Job APIs (Optional)
ADZUNA_APP_ID=your-adzuna-app-id
ADZUNA_API_KEY=your-adzuna-api-key
REED_API_KEY=your-reed-api-key

# AWS S3 (Optional for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name

# Hostinger Specific
PORT=3000
HOST=0.0.0.0
EOF

print_success "Environment template created: .env.local.template"

# Create deployment script
print_status "Creating auto-deployment script..."
cat > deploy.sh << 'EOF'
#!/bin/bash
echo "🔄 Starting auto-deployment..."

cd /home/root/public_html/

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build application
npm run hostinger-build

# Restart application
pm2 restart naukrimili

echo "✅ Deployment completed!"
EOF

chmod +x deploy.sh
print_success "Auto-deployment script created: deploy.sh"

# Check if application is running
print_status "Checking if application is running..."
sleep 3
pm2 status

# Check if port 3000 is listening
print_status "Checking if port 3000 is listening..."
if netstat -tlnp | grep :3000 > /dev/null; then
    print_success "Application is running on port 3000"
else
    print_warning "Application might not be running on port 3000"
fi

# Display system information
print_status "System information:"
echo "CPU cores: $(nproc)"
echo "Memory: $(free -h | grep Mem | awk '{print $2}')"
echo "Disk space: $(df -h / | tail -1 | awk '{print $4}') available"

# Final instructions
echo ""
echo "🎉 DEPLOYMENT COMPLETED!"
echo "========================"
echo ""
echo "📋 Next Steps:"
echo "1. Create .env.local file with your environment variables:"
echo "   nano .env.local"
echo ""
echo "2. Copy from template and update with your values:"
echo "   cp .env.local.template .env.local"
echo ""
echo "3. Restart the application:"
echo "   pm2 restart naukrimili"
echo ""
echo "4. Test your website:"
echo "   Visit your domain: https://yourdomain.com"
echo "   Test API: https://yourdomain.com/api/health"
echo ""
echo "5. For future updates, run:"
echo "   ./deploy.sh"
echo ""
echo "📊 Useful Commands:"
echo "   pm2 status          - Check application status"
echo "   pm2 logs naukrimili - View application logs"
echo "   pm2 restart naukrimili - Restart application"
echo "   htop               - Monitor system resources"
echo ""

print_success "NaukriMili Job Portal deployment completed successfully!" 