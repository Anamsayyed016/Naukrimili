# Fix Database Connection Script
# This script sets up the database with proper credentials

Write-Host "🔧 Fixing Database Connection..." -ForegroundColor Blue

# Add PostgreSQL to PATH
$env:PATH += ";C:\Program Files\PostgreSQL\17\bin"

# Set password for postgres user
$env:PGPASSWORD = "job123"

Write-Host "📊 Creating database and user..." -ForegroundColor Yellow

try {
    # Create user (ignore if exists)
    psql -U postgres -c "CREATE USER jobportal_user WITH PASSWORD 'job123';" 2>$null
    Write-Host "✅ User created or already exists" -ForegroundColor Green
} catch {
    Write-Host "⚠️ User might already exist" -ForegroundColor Yellow
}

try {
    # Create database (ignore if exists)
    psql -U postgres -c "CREATE DATABASE jobportal OWNER jobportal_user;" 2>$null
    Write-Host "✅ Database created or already exists" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Database might already exist" -ForegroundColor Yellow
}

# Grant privileges
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE jobportal TO jobportal_user;"
psql -U postgres -d jobportal -c "GRANT ALL ON SCHEMA public TO jobportal_user;"
psql -U postgres -d jobportal -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO jobportal_user;"
psql -U postgres -d jobportal -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO jobportal_user;"

Write-Host "✅ Database permissions granted" -ForegroundColor Green

# Test connection
Write-Host "🧪 Testing database connection..." -ForegroundColor Yellow
$testResult = psql -U jobportal_user -d jobportal -c "SELECT version();" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database connection successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Database connection failed" -ForegroundColor Red
    Write-Host "Please check PostgreSQL service and credentials" -ForegroundColor Red
}

Write-Host "🎉 Database setup completed!" -ForegroundColor Green
Write-Host "You can now run: npm run dev" -ForegroundColor Cyan

