# Simple Server Connection Commands

# 1. Connect to your server
ssh root@69.62.73.84

# 2. Once connected, run these commands:

# Create project directory
mkdir -p /root/jobportal
cd /root/jobportal

# Clone your repository
git clone https://github.com/Anamsayyed016/Naukrimili.git .

# Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install dependencies
pnpm install

# Build the project
pnpm build

# Create environment file
cp .env.production.example .env.local

# Start the application
node server.js
