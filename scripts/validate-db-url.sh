#!/bin/bash
# Validate DATABASE_URL format (allows localhost when Postgres runs on the same VPS)

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set!"
  exit 1
fi

if ! echo "$DATABASE_URL" | grep -qE "^postgresql://"; then
  echo "❌ DATABASE_URL must start with postgresql://"
  exit 1
fi

# Warn on deprecated remote hosts (leftover from old deployments)
if echo "$DATABASE_URL" | grep -qE "srv1054971\.hstgr\.cloud|34\.44\.45\.172"; then
  echo "❌ DATABASE_URL still points to a deprecated host."
  echo "   Use localhost when PostgreSQL runs on the same server:"
  echo "   postgresql://jobportal_user:PASSWORD@localhost:5432/naukrimili"
  exit 1
fi

REDACTED=$(echo "$DATABASE_URL" | sed 's/:.*@/:***@/')
HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')

echo "✅ DATABASE_URL validated"
echo "   Host: $HOST"
echo "   URL: $REDACTED"
