#!/bin/bash

# Database Reset Without Superuser (if you own the database)
# WARNING: This will delete all data!

echo "⚠️  WARNING: This will delete all data in the jobportal database!"
echo "Are you sure you want to continue? (y/N)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Resetting database..."
    
    # Drop all tables (if you have permissions)
    psql -d jobportal -c "
    DROP TABLE IF EXISTS \"JobBookmark\" CASCADE;
    DROP TABLE IF EXISTS \"Application\" CASCADE;
    DROP TABLE IF EXISTS \"Message\" CASCADE;
    DROP TABLE IF EXISTS \"Settings\" CASCADE;
    DROP TABLE IF EXISTS \"Resume\" CASCADE;
    DROP TABLE IF EXISTS \"Account\" CASCADE;
    DROP TABLE IF EXISTS \"Session\" CASCADE;
    DROP TABLE IF EXISTS \"VerificationToken\" CASCADE;
    DROP TABLE IF EXISTS \"Company\" CASCADE;
    DROP TABLE IF EXISTS \"Category\" CASCADE;
    DROP TABLE IF EXISTS \"StaticContent\" CASCADE;
    DROP TABLE IF EXISTS \"User\" CASCADE;
    DROP TABLE IF EXISTS \"Job\" CASCADE;
    "
    
    # Push the schema
    npx prisma db push --force-reset
    
    echo "✅ Database reset complete!"
else
    echo "Database reset cancelled."
fi
