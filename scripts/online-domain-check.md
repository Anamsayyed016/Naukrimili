# Online Domain Check Tools for aftionix.in

## Quick Domain Status Check

Use these online tools to check if your domain `aftionix.in` is activated:

### 1. DNS Checker
- **Whatsmydns.net**: https://www.whatsmydns.net/#A/aftionix.in
- **DNS Checker**: https://dnschecker.org/all-dns-records-of-domain.php?query=aftionix.in
- **MXToolbox**: https://mxtoolbox.com/DNSLookup.aspx

### 2. Website Accessibility
- **Down For Everyone Or Just Me**: https://downforeveryoneorjustme.com/aftionix.in
- **Is It Down**: https://www.isitdownrightnow.com/aftionix.in.html

### 3. SSL Certificate Check
- **SSL Labs**: https://www.ssllabs.com/ssltest/analyze.html?d=aftionix.in
- **SSL Checker**: https://www.sslshopper.com/ssl-checker.html

### 4. Performance & Speed
- **GTmetrix**: https://gtmetrix.com/
- **PageSpeed Insights**: https://pagespeed.web.dev/

## Expected Results

### ✅ If Domain is Working:
- **A Record**: Should point to `69.62.73.84`
- **HTTP Response**: Should return status 200
- **Content**: Should show your job portal application
- **Response Time**: Should be under 2 seconds

### ❌ If Domain is Not Working:
- **DNS Error**: "Domain not found" or wrong IP
- **Connection Error**: "Connection refused" or timeout
- **Wrong Content**: Shows different website or error page

## Manual Check Commands

### Windows Command Prompt:
```cmd
nslookup aftionix.in
ping aftionix.in
curl http://aftionix.in
```

### PowerShell:
```powershell
Resolve-DnsName aftionix.in
Test-NetConnection aftionix.in -Port 80
Invoke-WebRequest http://aftionix.in
```

## Troubleshooting Steps

1. **Check DNS Settings in GoDaddy**:
   - Verify A record points to `69.62.73.84`
   - Remove any conflicting A records
   - Set TTL to 3600 (1 hour)

2. **Check VPS Status**:
   - Verify Hostinger VPS is running
   - Check if port 80/3000 is open
   - Confirm your app is running

3. **Wait for DNS Propagation**:
   - DNS changes can take 24-48 hours
   - Use different DNS servers to test
   - Clear your local DNS cache

## Quick Test URLs

Test these URLs to verify your domain:

- `http://aftionix.in` - Main domain (HTTP)
- `https://aftionix.in` - Main domain (HTTPS)
- `http://www.aftionix.in` - WWW subdomain
- `http://69.62.73.84` - Direct VPS IP
- `http://69.62.73.84:3000` - Direct app port

## Success Indicators

🎉 **Your domain is working if:**
- ✅ DNS resolves to `69.62.73.84`
- ✅ Website loads with status 200
- ✅ Shows your job portal content
- ✅ Response time < 2 seconds
- ✅ No SSL errors (if HTTPS enabled)

## Next Steps After Domain is Working

1. **Set up SSL Certificate** (Let's Encrypt)
2. **Configure HTTPS redirects**
3. **Set up monitoring** (UptimeRobot)
4. **Optimize performance** (CDN, caching)
5. **Set up backups** and monitoring
