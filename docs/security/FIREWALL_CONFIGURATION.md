# 🔒 Firewall Configuration - From Your Current Server

> **Source:** Network access rules from your current Hostinger server  
> **Purpose:** Apply same security configuration to new server

---

## 📋 Current Server Firewall Rules

Your current server has these network access rules configured:

| Rule | Action | Protocol | Port | Source | Purpose |
|------|--------|----------|------|--------|---------|
| 1 | Accept | TCP | 22 | Any | SSH access |
| 2 | Accept | TCP | 80 | Any | HTTP traffic |
| 3 | Accept | TCP | 443 | Any | HTTPS traffic |
| 4 | Accept | TCP | 3000 | Any | Next.js application |
| 5 | Accept | TCP | 5432 | Any | PostgreSQL database |
| 6 | Accept | TCP | 2087 | Any | Control panel access |
| 7 | Accept | TCP | 3001 | Any | Additional services |
| 8 | Accept | TCP | Any | Any | Allow all TCP |
| 9 | Drop | Any | Any | Any | Default deny rule |

---

## 🛠️ Setup Commands for New Server

### Method 1: Using UFW (Recommended)

```bash
# Install UFW (Uncomplicated Firewall)
sudo apt update
sudo apt install ufw -y

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow essential ports (matching your current server)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Next.js app
sudo ufw allow 5432/tcp  # PostgreSQL

# Allow optional ports (if you need them)
sudo ufw allow 2087/tcp  # Control panel
sudo ufw allow 3001/tcp  # Additional services

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### Method 2: Using iptables (Alternative)

```bash
# Clear existing rules
sudo iptables -F
sudo iptables -X
sudo iptables -t nat -F
sudo iptables -t nat -X
sudo iptables -t mangle -F
sudo iptables -t mangle -X

# Set default policies
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT

# Allow loopback
sudo iptables -A INPUT -i lo -j ACCEPT

# Allow established connections
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow SSH (IMPORTANT - don't lock yourself out!)
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow HTTP/HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow application ports
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5432 -j ACCEPT

# Allow optional ports
sudo iptables -A INPUT -p tcp --dport 2087 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT

# Save rules
sudo apt install iptables-persistent -y
sudo iptables-save > /etc/iptables/rules.v4
sudo iptables-save > /etc/iptables/rules.v6
```

---

## 🔍 Port Explanations

| Port | Service | Required | Notes |
|------|---------|----------|-------|
| **22** | SSH | ✅ Yes | Essential for server access |
| **80** | HTTP | ✅ Yes | Web traffic (redirects to HTTPS) |
| **443** | HTTPS | ✅ Yes | Secure web traffic |
| **3000** | Next.js | ✅ Yes | Your application port |
| **5432** | PostgreSQL | ✅ Yes | Database access |
| **2087** | Control Panel | ⚠️ Optional | Only if using control panel |
| **3001** | Additional | ⚠️ Optional | For additional services |

---

## ✅ Verification Commands

After setting up firewall, verify it's working:

```bash
# Check UFW status
sudo ufw status verbose

# Check if ports are listening
sudo netstat -tulpn | grep -E ':(22|80|443|3000|5432|2087|3001)\s'

# Test SSH (from another terminal)
ssh user@your_server_ip

# Test web access
curl -I http://your_server_ip
curl -I https://your_server_ip

# Check PostgreSQL connection
sudo -u postgres psql -h localhost -p 5432 -c "SELECT version();"
```

---

## 🚨 Important Security Notes

### ⚠️ Before Enabling Firewall:

1. **SSH Access**: Make sure SSH (port 22) is allowed BEFORE enabling firewall
2. **Test Connection**: Verify you can still SSH after enabling
3. **Backup Access**: Keep another way to access server (console, etc.)

### 🔐 Best Practices:

1. **Principle of Least Privilege**: Only open ports you actually need
2. **Regular Updates**: Keep firewall rules updated
3. **Monitor Logs**: Check `/var/log/ufw.log` for blocked attempts
4. **Fail2ban**: Consider installing fail2ban for additional protection

```bash
# Install fail2ban (optional but recommended)
sudo apt install fail2ban -y

# Configure fail2ban for SSH
sudo nano /etc/fail2ban/jail.local
```

Add this configuration:
```ini
[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s
maxretry = 3
bantime = 3600
```

---

## 🆘 Troubleshooting

### Issue: Can't SSH after enabling firewall

```bash
# If you have console access, disable UFW temporarily
sudo ufw disable

# Or allow SSH specifically
sudo ufw allow 22/tcp

# Re-enable
sudo ufw enable
```

### Issue: Application not accessible

```bash
# Check if port is open
sudo ufw status | grep 3000

# If not, add it
sudo ufw allow 3000/tcp

# Check if app is listening
sudo netstat -tulpn | grep 3000
```

### Issue: Database connection refused

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check if port 5432 is open
sudo ufw status | grep 5432

# If not, add it
sudo ufw allow 5432/tcp
```

---

## 📝 Firewall Management Commands

### UFW Commands:

```bash
# Check status
sudo ufw status verbose

# Add rule
sudo ufw allow 8080/tcp

# Remove rule
sudo ufw delete allow 8080/tcp

# Reset firewall
sudo ufw --force reset

# Disable firewall
sudo ufw disable

# Enable firewall
sudo ufw enable

# View logs
sudo tail -f /var/log/ufw.log
```

### iptables Commands:

```bash
# List rules
sudo iptables -L -n -v

# Add rule
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT

# Remove rule
sudo iptables -D INPUT -p tcp --dport 8080 -j ACCEPT

# Save rules
sudo iptables-save > /etc/iptables/rules.v4

# Restore rules
sudo iptables-restore < /etc/iptables/rules.v4
```

---

## 🔄 Migration Checklist

Use this when setting up your new server:

- [ ] **Before migration**: Document current firewall rules ✅
- [ ] **On new server**: Install UFW or iptables
- [ ] **Configure rules**: Apply same port access as current server
- [ ] **Test SSH**: Verify SSH access works
- [ ] **Test application**: Verify app is accessible on port 3000
- [ ] **Test database**: Verify PostgreSQL is accessible
- [ ] **Enable firewall**: Turn on firewall protection
- [ ] **Verify logs**: Check for any blocked connections
- [ ] **Document changes**: Note any differences from old server

---

**Configuration saved for migration**  
**Date:** ${new Date().toLocaleDateString()}  
**Source:** Current Hostinger server network rules

This firewall configuration matches your current server setup and will maintain the same security posture on your new server.
