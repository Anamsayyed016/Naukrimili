# DNS Setup for aftionix.in

## Update your DNS records:

**A Record:**
- Type: A
- Name: @
- Content: 69.62.73.84
- TTL: 300

**CNAME Record:**
- Type: CNAME
- Name: www
- Content: aftionix.in
- TTL: 300

## Your VPS Details:
- IP: 69.62.73.84
- OS: AlmaLinux 9 with cPanel
- Location: India - Mumbai

## Quick Commands:
```bash
# Test DNS
nslookup aftionix.in
nslookup www.aftionix.in

# Test connection
curl -I http://69.62.73.84
```