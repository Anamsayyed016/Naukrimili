# Browser Connectivity Fix - aftionix.in

## Issue: ERR_CONNECTION_TIMED_OUT from Browser
The server is working perfectly (confirmed by curl), but your browser can't reach it.

## Possible Causes:
1. **DNS Propagation** - Domain not fully propagated to your location
2. **Firewall/ISP Blocking** - Your ISP or firewall blocking the connection
3. **CDN/Cache Issues** - Old cached responses
4. **Network Routing** - Network routing issues to the server

## Step 1: Test from Different Locations

### Test from Your Local Machine:
```bash
# Test if domain resolves from your machine
nslookup aftionix.in
ping aftionix.in

# Test with different tools
curl -I http://aftionix.in
wget --spider http://aftionix.in
```

### Test from Online Tools:
- Visit: https://www.whatsmydns.net/#A/aftionix.in
- Visit: https://dnschecker.org/all-dns-records.php?host=aftionix.in
- Visit: https://www.isitdownrightnow.com/aftionix.in.html

## Step 2: Clear Browser Cache and DNS

### Clear Browser Cache:
1. **Chrome**: Ctrl+Shift+Delete → Clear browsing data
2. **Firefox**: Ctrl+Shift+Delete → Clear data
3. **Edge**: Ctrl+Shift+Delete → Clear data

### Clear DNS Cache:
```bash
# Windows
ipconfig /flushdns

# Or restart your router/modem
```

## Step 3: Try Different Access Methods

### Try with www:
- http://www.aftionix.in

### Try with different browsers:
- Chrome
- Firefox
- Edge
- Safari

### Try incognito/private mode:
- Ctrl+Shift+N (Chrome)
- Ctrl+Shift+P (Firefox)

## Step 4: Check if it's a Regional Issue

### Test from mobile data:
- Disconnect from WiFi
- Use mobile data
- Try accessing the website

### Test from different network:
- Try from a different location/network
- Ask someone else to test the website

## Step 5: Server-Side Fixes

### Add www redirect:
```bash
# Add www redirect to nginx config
cat >> /etc/nginx/sites-available/aftionix.in << 'EOF'

# Redirect www to non-www
server {
    listen 80;
    server_name www.aftionix.in;
    return 301 http://aftionix.in$request_uri;
}
EOF

# Reload nginx
nginx -t && systemctl reload nginx
```

### Check server firewall:
```bash
# Check if port 80 is open
netstat -tlnp | grep :80

# Check firewall rules
ufw status
iptables -L
```

## Step 6: Alternative Access Methods

### Try direct IP access:
- http://69.62.73.84 (should work if server is accessible)

### Try with different port:
- http://aftionix.in:3000 (if nginx allows it)

## Step 7: DNS Troubleshooting

### Check DNS propagation:
```bash
# Check from different DNS servers
nslookup aftionix.in 8.8.8.8
nslookup aftionix.in 1.1.1.1
nslookup aftionix.in 208.67.222.222
```

### Try different DNS:
- Change your DNS to 8.8.8.8 and 8.8.4.4
- Or try 1.1.1.1 and 1.0.0.1

## Quick Fix Commands (Run on Server):

```bash
# 1. Add www redirect
cat >> /etc/nginx/sites-available/aftionix.in << 'EOF'

server {
    listen 80;
    server_name www.aftionix.in;
    return 301 http://aftionix.in$request_uri;
}
EOF

# 2. Reload nginx
nginx -t && systemctl reload nginx

# 3. Check if everything is working
pm2 status
curl http://aftionix.in/api/health
curl http://www.aftionix.in/api/health
```

## Expected Results:
- ✅ Domain should resolve to 69.62.73.84
- ✅ Website should load in browser
- ✅ Both aftionix.in and www.aftionix.in should work
- ✅ API endpoints should be accessible

## If Still Not Working:
1. **Wait 24-48 hours** for DNS propagation
2. **Try from different location/network**
3. **Contact your ISP** if it's a regional blocking issue
4. **Use VPN** to test from different location

