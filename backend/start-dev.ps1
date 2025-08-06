# PowerShell Quick Start Script for Job Portal Backend Development

Write-Host "🚀 Job Portal Backend - Quick Start" -ForegroundColor Blue
Write-Host "==================================" -ForegroundColor Blue

# Check if we're in the right directory
if (-not (Test-Path "main.py")) {
    Write-Host "❌ Please run this script from the backend directory" -ForegroundColor Red
    exit 1
}

# Check Python version
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python (\d+\.\d+)") {
        $version = [version]$matches[1]
        $requiredVersion = [version]"3.11"
        
        if ($version -lt $requiredVersion) {
            Write-Host "❌ Python 3.11+ required (found $($version.ToString()))" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Python version: $($version.ToString())" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Python not found. Please install Python 3.11+" -ForegroundColor Red
    exit 1
}

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Yellow
if ($IsWindows -or $env:OS -eq "Windows_NT") {
    & "venv\Scripts\Activate.ps1"
} else {
    # For PowerShell Core on Linux/Mac
    & "venv/bin/Activate.ps1"
}

# Install dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
python -m pip install --upgrade pip
pip install -r requirements.txt

# Create .env if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "⚙️ Creating environment configuration..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "📝 Please edit .env file with your database credentials" -ForegroundColor Cyan
}

# Check if Redis is running (Windows)
Write-Host "🔍 Checking Redis..." -ForegroundColor Yellow
try {
    $redisTest = redis-cli ping 2>$null
    if ($redisTest -eq "PONG") {
        Write-Host "✅ Redis is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Redis is not responding" -ForegroundColor Yellow
        Write-Host "💡 Please start Redis or install it:" -ForegroundColor Cyan
        Write-Host "   Windows: Download from https://github.com/microsoftarchive/redis/releases" -ForegroundColor Cyan
        Write-Host "   Or use Docker: docker run -d -p 6379:6379 redis:alpine" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Redis not found. Please install Redis first." -ForegroundColor Red
    Write-Host "💡 Install Redis:" -ForegroundColor Cyan
    Write-Host "   Docker: docker run -d -p 6379:6379 redis:alpine" -ForegroundColor Cyan
    Write-Host "   Windows: https://github.com/microsoftarchive/redis/releases" -ForegroundColor Cyan
}

# Check if MySQL is available (optional)
Write-Host "🔍 Checking MySQL..." -ForegroundColor Yellow
try {
    $mysqlVersion = mysql --version 2>$null
    if ($mysqlVersion) {
        Write-Host "✅ MySQL found" -ForegroundColor Green
        Write-Host "💡 Make sure to configure your database credentials in .env" -ForegroundColor Cyan
    }
} catch {
    Write-Host "⚠️ MySQL not found. You can use MongoDB instead or install MySQL." -ForegroundColor Yellow
    Write-Host "💡 Install MySQL: https://dev.mysql.com/downloads/mysql/" -ForegroundColor Cyan
}

# Start the development server
Write-Host ""
Write-Host "🚀 Starting FastAPI development server..." -ForegroundColor Green
Write-Host "📝 API will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📚 Documentation available at: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "🔍 Health check: http://localhost:8000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "🛑 Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start with auto-reload
try {
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
} catch {
    Write-Host "❌ Failed to start server. Please check the error above." -ForegroundColor Red
    Write-Host "💡 Make sure all dependencies are installed and .env is configured." -ForegroundColor Cyan
}
