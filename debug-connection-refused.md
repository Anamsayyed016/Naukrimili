# Debug ERR_CONNECTION_REFUSED - aftionix.in

## Issue: ERR_CONNECTION_REFUSED
The website is now reachable (progress!), but getting connection refused error.

## Possible Causes:
1. **Port 80 not accessible** - Firewall blocking port 80
2. **Nginx not listening on external interface** - Only listening on localhost
3. **PM2 process crashed** - Application not running
4. **Port binding issue** - Service not bound to correct interface

## Step 1: Check Server Status

### Check PM2 Status:
```bash
pm2 status
pm2 logs jobportal --lines 10
```

### Check if port 3000 is listening:
```bash
netstat -tlnp | grep :3000
ss -tlnp | grep :3000
```

### Check if port 80 is listening:
```bash
netstat -tlnp | grep :80
ss -tlnp | grep :80
```

## Step 2: Check Nginx Configuration

### Check nginx status:
```bash
systemctl status nginx
```

### Check nginx configuration:
```bash
nginx -t
cat /etc/nginx/sites-available/aftionix.in
```

### Check nginx logs:
```bash
tail -20 /var/log/nginx/error.log
tail -20 /var/log/nginx/access.log
```

## Step 3: Check Firewall Settings

### Check if ports are open:
```bash
ufw status
iptables -L
```

### Open required ports:
```bash
ufw allow 80
ufw allow 443
ufw reload
```

## Step 4: Test Local Connectivity

### Test local application:
```bash
curl -v http://localhost:3000/api/health
```

### Test nginx locally:
```bash
curl -v http://localhost/api/health
```

### Test from external IP:
```bash
curl -v http://69.62.73.84/api/health
```

## Step 5: Fix Common Issues

### If nginx is not listening on external interface:
```bash
# Check nginx config
cat /etc/nginx/nginx.conf | grep listen

# Make sure nginx is listening on all interfaces
# Should show: listen 80;
# Not: listen 127.0.0.1:80;
```

### If PM2 process is not running:
```bash
pm2 restart jobportal
pm2 status
```

### If port 80 is not accessible:
```bash
# Check what's listening on port 80
lsof -i :80

# Restart nginx
systemctl restart nginx
```

## Step 6: Quick Fix Commands

```bash
# 1. Check everything
pm2 status
netstat -tlnp | grep :80
netstat -tlnp | grep :3000

# 2. Restart services
pm2 restart jobportal
systemctl restart nginx

# 3. Check firewall
ufw status
ufw allow 80

# 4. Test connectivity
curl http://localhost:3000/api/health
curl http://localhost/api/health
curl http://69.62.73.84/api/health
```

## Expected Results:
- ✅ PM2 should show jobportal as "online"
- ✅ Port 80 should be listening on 0.0.0.0:80
- ✅ Port 3000 should be listening on :::3000
- ✅ curl commands should return HTTP 200 OK
- ✅ Website should load in browser

## If Still Not Working:
1. **Check server logs** for specific errors
2. **Verify firewall rules** are correct
3. **Check if nginx is binding to correct interface**
4. **Restart all services** in correct order

