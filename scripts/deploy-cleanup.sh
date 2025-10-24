#!/bin/bash

# Server Deployment and Database Cleanup Script
# This script deploys the application and cleans the database

echo "🚀 Starting server deployment and database cleanup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if environment variables are set
if [ -z "$DATABASE_URL" ]; then
    print_warning "DATABASE_URL not set. Make sure your .env file is configured."
fi

print_status "Building application..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed!"
    exit 1
fi

print_status "Application built successfully!"

# Ask for confirmation before database cleanup
echo ""
print_warning "This will delete ALL data from the database!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    print_error "Database cleanup cancelled."
    exit 1
fi

print_status "Cleaning database..."
node scripts/server-reset-database.js

if [ $? -eq 0 ]; then
    print_status "Database cleaned successfully!"
else
    print_error "Database cleanup failed!"
    exit 1
fi

print_status "Starting production server..."
npm run start

print_status "Deployment completed successfully!"
