#!/bin/bash

# Database Restore Script
# Run: bash scripts/restore-database.sh [backup_file]

BACKUP_DIR="./backups/database"

echo "🔄 Database Restore"
echo "================================"
echo ""

# Get database connection details
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

DB_URL="${DATABASE_URL}"

if [ -z "$DB_URL" ]; then
    echo "❌ DATABASE_URL not found"
    exit 1
fi

# Check if backup file provided
if [ -z "$1" ]; then
    echo "📋 Available backups:"
    ls -lh $BACKUP_DIR/naukrimili_backup_*.sql 2>/dev/null
    echo ""
    echo "Usage: bash scripts/restore-database.sh <backup_file>"
    echo "Example: bash scripts/restore-database.sh backups/database/naukrimili_backup_20251102_180000.sql"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will replace current database with backup!"
echo "📁 Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

echo ""
echo "🔄 Restoring database..."
psql "$DB_URL" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully!"
    echo ""
    echo "🔄 Restarting application..."
    pm2 restart naukrimili
    echo "✅ Application restarted"
else
    echo "❌ Restore failed!"
    exit 1
fi

