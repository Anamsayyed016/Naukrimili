#!/bin/bash
# Quick Start Script for Job Portal Backend Development

set -e

echo "🚀 Job Portal Backend - Quick Start"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "main.py" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
required_version="3.11"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 3.11+ required (found $python_version)"
    exit 1
fi

echo "✅ Python version: $python_version"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️ Creating environment configuration..."
    cp .env.example .env
    echo "📝 Please edit .env file with your database credentials"
fi

# Check if Redis is running
echo "🔍 Checking Redis..."
if command -v redis-cli >/dev/null 2>&1; then
    if redis-cli ping >/dev/null 2>&1; then
        echo "✅ Redis is running"
    else
        echo "⚠️ Redis is not running. Starting Redis..."
        if command -v redis-server >/dev/null 2>&1; then
            redis-server --daemonize yes
            sleep 2
            if redis-cli ping >/dev/null 2>&1; then
                echo "✅ Redis started successfully"
            else
                echo "❌ Failed to start Redis"
            fi
        else
            echo "❌ Redis not installed. Please install Redis first."
            echo "   Ubuntu/Debian: sudo apt install redis-server"
            echo "   macOS: brew install redis"
        fi
    fi
else
    echo "❌ Redis not found. Please install Redis first."
fi

# Check if MySQL is available (optional)
echo "🔍 Checking MySQL..."
if command -v mysql >/dev/null 2>&1; then
    echo "✅ MySQL found"
    echo "💡 Make sure to configure your database credentials in .env"
else
    echo "⚠️ MySQL not found. You can use MongoDB instead or install MySQL."
fi

# Start the development server
echo ""
echo "🚀 Starting FastAPI development server..."
echo "📝 API will be available at: http://localhost:8000"
echo "📚 Documentation available at: http://localhost:8000/docs"
echo "🔍 Health check: http://localhost:8000/health"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo ""

# Start with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
