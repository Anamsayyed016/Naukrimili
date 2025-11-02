#!/bin/bash

# Database Backup Script
# Run: bash scripts/backup-database.sh

BACKUP_DIR="./backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/naukrimili_backup_$DATE.sql"

echo "🔒 Database Backup Starting..."
echo "================================"
echo ""

# Create backup directory
mkdir -p $BACKUP_DIR

# Get database connection details from .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Extract database details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_URL="${DATABASE_URL}"

if [ -z "$DB_URL" ]; then
    echo "❌ DATABASE_URL not found in .env"
    exit 1
fi

echo "✅ Database URL found"
echo "📁 Backup location: $BACKUP_FILE"
echo ""

# Backup database
echo "🔄 Creating backup..."
pg_dump "$DB_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully!"
    echo ""
    echo "📊 Backup size: $(du -h $BACKUP_FILE | cut -f1)"
    echo "📁 Location: $BACKUP_FILE"
    echo ""
    
    # Keep only last 10 backups
    echo "🧹 Cleaning old backups (keeping last 10)..."
    cd $BACKUP_DIR
    ls -t naukrimili_backup_*.sql | tail -n +11 | xargs -r rm
    echo "✅ Cleanup complete"
    echo ""
    echo "📋 Available backups:"
    ls -lh naukrimili_backup_*.sql 2>/dev/null || echo "No backups found"
else
    echo "❌ Backup failed!"
    exit 1
fi

echo ""
echo "🎉 Backup process complete!"

