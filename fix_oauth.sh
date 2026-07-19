#!/bin/bash
# Fix OAuth configuration
sed -i 's/        \/\/ ✅ Enhanced OAuth security with PKCE enabled/        \/\/ ✅ Simplified OAuth configuration/g' lib/nextauth-config.ts
sed -i 's/        },/        profile(profile) {/g' lib/nextauth-config.ts
