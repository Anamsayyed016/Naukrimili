#!/bin/bash
# Validate DATABASE_URL and prevent localhost connections in production

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set!"
  exit 1
fi

# Check for localhost/127.0.0.1/::1 in production (case-insensitive)
if echo "$DATABASE_URL" | grep -qiE "(127\.0\.0\.1|localhost|::1)"; then
  echo "❌ ERROR: DATABASE_URL uses localhost (127.0.0.1, localhost, or ::1)"
  echo ""
  echo "Current DATABASE_URL (masked): $(echo "$DATABASE_URL" | sed 's/:.*@/:***@/g' | sed 's/\/\/[^:]*:/\/\/***:/g')"
  echo ""
  echo "⚠️  In production, you must use the actual database host."
  echo ""
  echo "Examples of correct DATABASE_URL:"
  echo "  postgresql://user:pass@db.example.com:5432/dbname"
  echo "  postgresql://user:pass@192.168.1.100:5432/dbname"
  echo "  postgresql://user:pass@production-db-host:5432/dbname"
  echo ""
  echo "💡 Fix: Update DATABASE_URL secret in GitHub Actions to use actual production host"
  echo "   Go to: https://github.com/YOUR_REPO/settings/secrets/actions"
  exit 1
fi

# Validate URL format
if ! echo "$DATABASE_URL" | grep -qE "^postgresql://"; then
  echo "❌ DATABASE_URL must start with postgresql://"
  exit 1
fi

# Extract and display host (redacted credentials)
REDACTED=$(echo "$DATABASE_URL" | sed 's/:.*@/:***@/')
HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')

echo "✅ DATABASE_URL validated"
echo "   Host: $HOST"
echo "   URL: $REDACTED"
