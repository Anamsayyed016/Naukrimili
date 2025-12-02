#!/bin/bash

################################################################################
# FIX WWW SSL CERTIFICATE - Comprehensive Solution
# Problem: www.naukrimili.com shows SSL error but naukrimili.com works
# Root Cause: SSL certificate doesn't include www subdomain
# Solution: Regenerate certificate with both domains
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

################################################################################
# STEP 1: Diagnose Current SSL Certificate
################################################################################

log "=== STEP 1: Diagnosing Current SSL Certificate ==="

info "Checking current SSL certificate details..."

if [ -f "/etc/letsencrypt/live/naukrimili.com/fullchain.pem" ]; then
    log "✅ SSL certificate found at: /etc/letsencrypt/live/naukrimili.com/"
    
    # Check certificate domains
    info "Current certificate covers the following domains:"
    echo ""
    sudo openssl x509 -in /etc/letsencrypt/live/naukrimili.com/fullchain.pem -text -noout | grep -A 1 "Subject Alternative Name" || true
    echo ""
    
    # Check expiry date
    info "Certificate expiry date:"
    sudo openssl x509 -in /etc/letsencrypt/live/naukrimili.com/fullchain.pem -noout -enddate
    echo ""
else
    error "SSL certificate not found at expected location!"
    error "Expected: /etc/letsencrypt/live/naukrimili.com/fullchain.pem"
    exit 1
fi

################################################################################
# STEP 2: Check Certbot Installation
################################################################################

log "=== STEP 2: Checking Certbot Installation ==="

if ! command -v certbot &> /dev/null; then
    warning "Certbot not found. Installing certbot and python3-certbot-nginx..."
    
    # Update package list
    sudo apt update
    
    # Install certbot
    sudo apt install -y certbot python3-certbot-nginx
    
    log "✅ Certbot installed successfully"
else
    log "✅ Certbot is already installed"
    certbot --version
fi

################################################################################
# STEP 3: Check Nginx Configuration
################################################################################

log "=== STEP 3: Checking Nginx Configuration ==="

# Test nginx configuration
info "Testing Nginx configuration..."
if sudo nginx -t 2>&1 | grep -q "syntax is ok"; then
    log "✅ Nginx configuration is valid"
else
    error "Nginx configuration has errors!"
    sudo nginx -t
    exit 1
fi

# Check if both domains are in server_name
info "Checking server_name configuration..."
if sudo grep -r "server_name.*www\.naukrimili\.com.*naukrimili\.com" /etc/nginx/ || sudo grep -r "server_name.*naukrimili\.com.*www\.naukrimili\.com" /etc/nginx/; then
    log "✅ Both domains are configured in Nginx"
else
    warning "Nginx might not have both domains configured correctly"
fi

################################################################################
# STEP 4: Backup Current Configuration
################################################################################

log "=== STEP 4: Creating Backup ==="

BACKUP_DIR="/root/ssl-backup-$(date +%Y%m%d-%H%M%S)"
sudo mkdir -p "$BACKUP_DIR"

# Backup nginx config
if [ -d "/etc/nginx/sites-enabled" ]; then
    sudo cp -r /etc/nginx/sites-enabled "$BACKUP_DIR/"
    log "✅ Nginx config backed up to: $BACKUP_DIR"
fi

# Backup current certificate info
if [ -d "/etc/letsencrypt/live/naukrimili.com" ]; then
    sudo ls -la /etc/letsencrypt/live/naukrimili.com/ > "$BACKUP_DIR/cert-listing.txt"
    sudo openssl x509 -in /etc/letsencrypt/live/naukrimili.com/fullchain.pem -text -noout > "$BACKUP_DIR/cert-details.txt"
    log "✅ Certificate info backed up"
fi

################################################################################
# STEP 5: Regenerate SSL Certificate with BOTH Domains
################################################################################

log "=== STEP 5: Regenerating SSL Certificate ==="

warning "⚠️  IMPORTANT: This will regenerate your SSL certificate to include BOTH:"
warning "   - naukrimili.com"
warning "   - www.naukrimili.com"
echo ""

read -p "Do you want to proceed? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    error "Operation cancelled by user"
    exit 1
fi

info "Stopping Nginx temporarily..."
sudo systemctl stop nginx

log "Regenerating SSL certificate with certbot..."
echo ""

# CRITICAL: Generate certificate for BOTH domains
sudo certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email admin@naukrimili.com \
    --domains naukrimili.com,www.naukrimili.com \
    --expand \
    --force-renewal \
    2>&1 | tee "$BACKUP_DIR/certbot-output.log"

CERTBOT_EXIT_CODE=${PIPESTATUS[0]}

if [ $CERTBOT_EXIT_CODE -eq 0 ]; then
    log "✅ SSL certificate generated successfully!"
else
    error "❌ Certificate generation failed with exit code: $CERTBOT_EXIT_CODE"
    error "Check log: $BACKUP_DIR/certbot-output.log"
    info "Starting Nginx again..."
    sudo systemctl start nginx
    exit 1
fi

################################################################################
# STEP 6: Verify New Certificate
################################################################################

log "=== STEP 6: Verifying New Certificate ==="

info "New certificate covers the following domains:"
echo ""
sudo openssl x509 -in /etc/letsencrypt/live/naukrimili.com/fullchain.pem -text -noout | grep -A 1 "Subject Alternative Name"
echo ""

# Check if www is included
if sudo openssl x509 -in /etc/letsencrypt/live/naukrimili.com/fullchain.pem -text -noout | grep -q "www.naukrimili.com"; then
    log "✅ Certificate now includes www.naukrimili.com"
else
    error "❌ Certificate still doesn't include www.naukrimili.com"
    error "Please check the certbot output log"
    exit 1
fi

################################################################################
# STEP 7: Restart Nginx
################################################################################

log "=== STEP 7: Restarting Nginx ==="

info "Starting Nginx with new certificate..."
sudo systemctl start nginx

# Verify nginx is running
sleep 2
if sudo systemctl is-active --quiet nginx; then
    log "✅ Nginx is running successfully"
else
    error "❌ Nginx failed to start"
    sudo journalctl -u nginx -n 50 --no-pager
    exit 1
fi

################################################################################
# STEP 8: Setup Auto-Renewal
################################################################################

log "=== STEP 8: Setting Up Auto-Renewal ==="

# Check if certbot renewal is already scheduled
if sudo crontab -l 2>/dev/null | grep -q "certbot renew"; then
    log "✅ Certbot auto-renewal is already configured"
else
    info "Adding certbot auto-renewal to crontab..."
    (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | sudo crontab -
    log "✅ Auto-renewal scheduled (runs daily at noon)"
fi

# Test renewal process
info "Testing certificate renewal process..."
sudo certbot renew --dry-run 2>&1 | tail -n 20

################################################################################
# STEP 9: Final Verification
################################################################################

log "=== STEP 9: Final Verification ==="

info "Testing SSL certificate via openssl..."
echo ""

# Test naukrimili.com
echo "Testing naukrimili.com:"
timeout 5 openssl s_client -connect naukrimili.com:443 -servername naukrimili.com < /dev/null 2>/dev/null | grep -E "subject=|issuer=|Verify return code" || warning "Could not verify naukrimili.com"
echo ""

# Test www.naukrimili.com
echo "Testing www.naukrimili.com:"
timeout 5 openssl s_client -connect www.naukrimili.com:443 -servername www.naukrimili.com < /dev/null 2>/dev/null | grep -E "subject=|issuer=|Verify return code" || warning "Could not verify www.naukrimili.com"
echo ""

################################################################################
# STEP 10: Summary Report
################################################################################

log "=== STEP 10: Summary Report ==="

cat << EOF

${GREEN}╔════════════════════════════════════════════════════════════════╗
║                     FIX COMPLETED SUCCESSFULLY                  ║
╚════════════════════════════════════════════════════════════════╝${NC}

${BLUE}✅ What was fixed:${NC}
   • SSL certificate regenerated for BOTH domains
   • naukrimili.com ✓
   • www.naukrimili.com ✓

${BLUE}📁 Backup location:${NC}
   $BACKUP_DIR

${BLUE}🔐 Certificate details:${NC}
   • Location: /etc/letsencrypt/live/naukrimili.com/
   • Valid for: naukrimili.com + www.naukrimili.com
   • Auto-renewal: Enabled (daily check)

${BLUE}🧪 Test your website:${NC}
   1. Clear browser cache (Ctrl+Shift+Delete)
   2. Visit: https://www.naukrimili.com
   3. Visit: https://naukrimili.com
   4. Both should work without SSL errors

${BLUE}🔍 SSL Test Online:${NC}
   • https://www.ssllabs.com/ssltest/analyze.html?d=www.naukrimili.com
   • https://www.ssllabs.com/ssltest/analyze.html?d=naukrimili.com

${BLUE}📊 Certificate Verification:${NC}
   • Check certificate: sudo certbot certificates
   • View nginx status: sudo systemctl status nginx
   • Check nginx logs: sudo tail -f /var/log/nginx/error.log

${YELLOW}⚠️  IMPORTANT NOTES:${NC}
   1. DNS propagation may take 5-10 minutes
   2. Clear browser cache before testing
   3. Certificate auto-renews every 60 days
   4. Both www and non-www will now work with HTTPS

${GREEN}═══════════════════════════════════════════════════════════════${NC}

EOF

################################################################################
# Additional Diagnostics
################################################################################

log "=== Additional Diagnostics ==="

info "Certificate expiry check:"
sudo certbot certificates

echo ""
info "Nginx status:"
sudo systemctl status nginx --no-pager | head -n 10

echo ""
log "🎉 WWW SSL Certificate fix completed successfully!"
log "🌐 Your website should now be accessible on both:"
log "   • https://naukrimili.com"
log "   • https://www.naukrimili.com"

echo ""
warning "⏰ Please wait 5-10 minutes for DNS propagation"
warning "🧹 Clear your browser cache (Ctrl+Shift+Delete) before testing"

exit 0

