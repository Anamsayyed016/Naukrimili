#!/bin/bash
# CI One-liner fix
rm -f package-lock.json && echo "engine-strict=false\nlegacy-peer-deps=true\nfund=false\naudit=false" > .npmrc && npm install --legacy-peer-deps --engine-strict=false --force && npm install tailwindcss postcss autoprefixer @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-toast class-variance-authority clsx tailwind-merge lucide-react --legacy-peer-deps --engine-strict=false && npx prisma generate && NODE_ENV=production NODE_OPTIONS="--max-old-space-size=4096" npm run build
