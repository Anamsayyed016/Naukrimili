# Google OAuth Setup Instructions

## Production Server Setup

To enable Google OAuth authentication on your production server, you need to set the following environment variables:

### Method 1: Environment Variables

```bash
# SSH into your server
ssh root@naukrimili.com

# Set environment variables
export GOOGLE_CLIENT_ID="your_google_client_id_here"
export GOOGLE_CLIENT_SECRET="your_google_client_secret_here"

# Add to .bashrc for persistence
echo 'export GOOGLE_CLIENT_ID="your_google_client_id_here"' >> ~/.bashrc
echo 'export GOOGLE_CLIENT_SECRET="your_google_client_secret_here"' >> ~/.bashrc

# Reload environment
source ~/.bashrc

# Restart PM2
pm2 restart jobportal
```

### Method 2: .env File

```bash
# Create .env file on server
cat > /var/www/jobportal/.env << EOF
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXTAUTH_URL=https://naukrimili.com
NEXTAUTH_SECRET=jobportal-secret-key-2024-naukrimili-production-deployment
DATABASE_URL=postgresql://jobportal_user:secure_password_2024@localhost:5432/jobportal
EOF

# Restart PM2
pm2 restart jobportal
```

### Verification

1. Check PM2 environment: `pm2 show jobportal`
2. Test Google OAuth: Visit https://naukrimili.com/auth/signin
3. Check logs: `pm2 logs jobportal`

### Google Cloud Console Setup

Ensure your Google OAuth app has these redirect URIs:
- https://naukrimili.com/api/auth/callback/google
- https://naukrimili.com/auth/callback/google
