#!/bin/bash

echo "🚀 Starting automated deployment with PostgreSQL setup..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

cd /var/www/jobportal

# Pull latest code
echo "📥 Pulling latest code..."
git fetch --all
git reset --hard origin/main

# 🔴 AUTOMATIC: Setup PostgreSQL if not exists
if ! systemctl is-active --quiet postgresql; then
    echo "🔴 Setting up PostgreSQL..."
    apt update
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    
    # Create database and user
    sudo -u postgres createdb jobportal || true
    sudo -u postgres createuser jobportal_user || true
    sudo -u postgres psql -c "ALTER USER jobportal_user WITH PASSWORD 'secure_password_123';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE jobportal TO jobportal_user;"
    
    echo "✅ PostgreSQL setup complete!"
else
    echo "✅ PostgreSQL already running"
fi

# 🔴 AUTOMATIC: Create production environment
echo "🔴 Creating production environment..."
cat > .env.local << 'EOF'
NODE_ENV=production
DATABASE_URL="postgresql://jobportal_user:secure_password_123@localhost:5432/jobportal"
NEXT_PUBLIC_BASE_URL=https://aftionix.in
NEXTAUTH_SECRET="your-secret-key-here"
EOF

echo "✅ Production environment configured!"
echo "🔴 Mock data will be automatically disabled!"
echo "🚀 PostgreSQL will be automatically used!"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Build application
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Restart service
    systemctl restart jobportal
    echo "✅ Service restarted!"
    
    # Check service status
    systemctl status jobportal --no-pager
    
    echo "🎉 Deployment complete!"
    echo "🔴 Mock data: DISABLED"
    echo "🚀 PostgreSQL: ACTIVE"
    echo "🌐 Website: https://aftionix.in"
    
    # Show current mode
    echo ""
    echo "📊 Current Database Mode:"
    curl -s http://localhost:3000/api/health | jq '.mode, .database, .message' 2>/dev/null || echo "Health check not available yet"
    
else
    echo "❌ Build failed!"
    exit 1
fi
