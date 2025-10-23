#!/bin/bash
# Fix syntax error in coresignal-service.ts

cd /var/www/naukrimili

# Backup the file first
cp lib/jobs/coresignal-service.ts lib/jobs/coresignal-service.ts.backup

# Fix the syntax error on line 194
# Replace: 'apikey ${apiKey}`,
# With: 'Authorization': `Bearer ${apiKey}`,

sed -i "194s|'apikey \${apiKey}\`,|'Authorization': \`Bearer \${apiKey}\`,|" lib/jobs/coresignal-service.ts

echo "✅ Fixed syntax error in coresignal-service.ts"
echo "Backup saved as: lib/jobs/coresignal-service.ts.backup"

# Verify the fix
echo ""
echo "Line 194 now contains:"
sed -n '194p' lib/jobs/coresignal-service.ts




