#!/bin/bash

# Reset Database Script
# WARNING: This will delete all data!

echo "⚠️  WARNING: This will delete all data in the jobportal database!"
echo "Are you sure you want to continue? (y/N)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Resetting database..."
    
    # Drop and recreate database
    psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS jobportal;"
    psql -h localhost -U postgres -c "CREATE DATABASE jobportal;"
    
    # Push the schema
    npx prisma db push --force-reset
    
    echo "✅ Database reset complete!"
else
    echo "Database reset cancelled."
fi
