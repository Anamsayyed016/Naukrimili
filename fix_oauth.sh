#!/bin/bash
# Fix OAuth section in login page

# Add OAuthButtons import back
sed -i '1i import OAuthButtons from '\''@/components/auth/OAuthButtons'\'';' app/auth/login/page.tsx

# Replace the OAuth section (lines 215-243)
sed -i '215,243c\
        {/* OAuth Buttons */}\
        <OAuthButtons callbackUrl={searchParams.get('\''callbackUrl'\'') || '\''/'\''} />\
' app/auth/login/page.tsx
