#!/bin/bash

# DATABASE_URL Validation Script
# This script validates that DATABASE_URL has the correct format for PostgreSQL

echo "🔍 Validating DATABASE_URL..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set"
  echo ""
  echo "📋 How to fix:"
  echo "1. Set DATABASE_URL environment variable"
  echo "2. Format: postgresql://username:password@host:port/database"
  echo "3. Example: postgresql://user:pass@localhost:5432/naukrimili"
  exit 1
fi

# Trim whitespace and remove quotes
DATABASE_URL=$(echo "$DATABASE_URL" | xargs | sed "s/^['\"]//; s/['\"]$//")

# Check if empty after trimming
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is empty after trimming"
  exit 1
fi

# Check protocol
DB_PROTOCOL=$(echo "$DATABASE_URL" | cut -d':' -f1)
if [ "$DB_PROTOCOL" != "postgresql" ] && [ "$DB_PROTOCOL" != "postgres" ]; then
  echo "❌ ERROR: DATABASE_URL must start with 'postgresql://' or 'postgres://'"
  echo "📋 Current protocol: '$DB_PROTOCOL'"
  echo "📋 First 50 characters: ${DATABASE_URL:0:50}"
  exit 1
fi

# Check for ://
if [[ ! "$DATABASE_URL" =~ :// ]]; then
  echo "❌ ERROR: DATABASE_URL missing '://' after protocol"
  echo "📋 Current format: ${DATABASE_URL:0:50}"
  exit 1
fi

# Validate URL structure
if [[ ! "$DATABASE_URL" =~ ^postgres(ql)?://[^@]+@[^/]+/[^[:space:]]+ ]]; then
  echo "❌ ERROR: DATABASE_URL has invalid format"
  echo "📋 Current value (first 50 chars): ${DATABASE_URL:0:50}"
  echo ""
  echo "📋 Expected format: postgresql://username:password@host:port/database"
  exit 1
fi

echo "✅ DATABASE_URL format is valid!"
echo "📋 Protocol: $DB_PROTOCOL"
echo "📋 Length: ${#DATABASE_URL} characters"
echo "📋 First 30 chars (hidden password): $(echo "$DATABASE_URL" | sed 's/:[^:@]*@/:****@/')"

exit 0

