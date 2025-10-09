# Domain Setup Guide for naukrimili.com

## DNS Configuration for Your Job Portal

Based on your DNS control panel showing `naukrimili.com`, here's how to properly configure your domain for your job portal:

### 1. Current DNS Records (from your control panel)

Your current DNS setup shows:
- **CNAME Record**: `www` → `naukrimili.com` (TTL: 300)
- **CAA Record**: `@` → `O issue "pki goog"` (TTL: 14400)

### 2. Required DNS Records for Job Portal

#### A Record (Root Domain)
```
Type: A
Name: @
Content: [YOUR_SERVER_IP_ADDRESS]
TTL: 300
```

#### CNAME Record (WWW Subdomain)
```
Type: CNAME
Name: www
Content: naukrimili.com
TTL: 300
```

#### CAA Record (SSL Certificate)
```
Type: CAA
Name: @
Content: 0 issue "letsencrypt.org"
TTL: 14400
```

### 3. Additional Records for Job Portal Features

#### MX Record (Email)
```
Type: MX
Name: @
Priority: 10
Content: mail.naukrimili.com
TTL: 3600
```

#### TXT Record (Email Verification)
```
Type: TXT
Name: @
Content: "v=spf1 include:_spf.google.com ~all"
TTL: 3600
```

#### TXT Record (Google Search Console)
```
Type: TXT
Name: @
Content: "google-site-verification=[YOUR_VERIFICATION_CODE]"
TTL: 3600
```

### 4. Server Configuration

#### Web Server (Nginx/Apache)
- Point to your job portal application
- Enable HTTPS with Let's Encrypt
- Configure proper redirects

#### SSL Certificate
- Use Let's Encrypt for free SSL
- Auto-renewal every 90 days
- Force HTTPS redirects

### 5. Environment Variables

Update your `.env.production` file:
```bash
NEXTAUTH_URL="https://naukrimili.com"
NEXT_PUBLIC_BASE_URL="https://naukrimili.com"
NEXT_PUBLIC_DOMAIN="naukrimili.com"
```

### 6. Next.js Configuration

Your `next.config.mjs` is already configured for:
- Domain: naukrimili.com
- HTTPS support
- Security headers
- Image optimization

### 7. Deployment Checklist

- [ ] Update DNS records
- [ ] Configure web server
- [ ] Install SSL certificate
- [ ] Set environment variables
- [ ] Deploy application
- [ ] Test all features
- [ ] Monitor performance

### 8. Testing Your Setup

```bash
# Test DNS resolution
nslookup naukrimili.com
nslookup www.naukrimili.com

# Test HTTPS
curl -I https://naukrimili.com

# Test API endpoints
curl https://naukrimili.com/api/health
```

### 9. Common Issues & Solutions

#### Issue: Domain not resolving
**Solution**: Check A record points to correct IP

#### Issue: HTTPS not working
**Solution**: Verify SSL certificate installation

#### Issue: WWW redirect not working
**Solution**: Check CNAME record configuration

### 10. Performance Optimization

- Enable CDN (Cloudflare recommended)
- Configure caching headers
- Optimize images
- Enable compression

### 11. Security Considerations

- Enable HTTPS everywhere
- Configure security headers
- Set up rate limiting
- Monitor for threats

### 12. Monitoring & Maintenance

- Set up uptime monitoring
- Configure error logging
- Monitor performance metrics
- Regular SSL renewal checks

## Next Steps

1. Update your DNS records as shown above
2. Configure your web server
3. Install SSL certificate
4. Deploy your job portal
5. Test all functionality
6. Monitor performance

## Support

If you encounter issues:
1. Check DNS propagation (can take up to 48 hours)
2. Verify server configuration
3. Check SSL certificate status
4. Review application logs
