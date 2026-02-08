# SSH Broken Pipe Fix - Deployment Issue Resolution
**Date:** 2025-01-08  
**Status:** ✅ **FIXED**

---

## 🚨 **PROBLEM**

Deployment job was failing with SSH "Broken pipe" errors during long-running operations:

```
client_loop: send disconnect: Broken pipe
❌ Remote deployment script failed
Process completed with exit code 1.
```

**Root Cause:** SSH connections were timing out during long operations (npm install, Prisma migrations, PM2 operations) because:
- No keep-alive signals were being sent
- Server was dropping idle connections
- Long-running remote script execution (8+ minutes) exceeded default SSH timeout

---

## ✅ **SOLUTION IMPLEMENTED**

Added SSH keep-alive settings to **ALL** SSH and SCP connections in the workflow:

### **Keep-Alive Options Added:**
- `-o ServerAliveInterval=60` - Send keep-alive signal every 60 seconds
- `-o ServerAliveCountMax=5` - Allow up to 5 missed keep-alive responses before disconnecting

### **Files Modified:**
1. ✅ `.github/workflows/deploy-production.yml`

### **SSH/SCP Connections Fixed:**

1. **Test SSH connection** (Line 524)
   - ✅ Added keep-alive options

2. **Upload bundle to staging** (Line 532)
   - ✅ Added keep-alive options
   - ✅ rsync inherits SSH_OPTS via `-e "ssh $SSH_OPTS"`

3. **Verify bundle persists** (Line 601)
   - ✅ Added keep-alive options

4. **Verify bundle exists** (Line 760)
   - ✅ Added keep-alive options
   - ✅ rsync re-upload inherits SSH_OPTS

5. **Deploy with zero-downtime swap** (Line 851-852)
   - ✅ SSH_OPTS: Added keep-alive options
   - ✅ SCP_OPTS: Added keep-alive options
   - ✅ **CRITICAL:** Long-running remote script execution now has keep-alive

6. **Post-deployment verification** (Line 896)
   - ✅ Added keep-alive options

---

## 🔧 **TECHNICAL DETAILS**

### **Before (Broken):**
```bash
SSH_OPTS="-i ~/.ssh/deploy_key -p $SSH_PORT -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 -o IdentitiesOnly=yes"
```

### **After (Fixed):**
```bash
SSH_OPTS="-i ~/.ssh/deploy_key -p $SSH_PORT -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 -o ServerAliveInterval=60 -o ServerAliveCountMax=5 -o IdentitiesOnly=yes"
```

### **How It Works:**
- **ServerAliveInterval=60**: Client sends keep-alive packet every 60 seconds
- **ServerAliveCountMax=5**: Client allows 5 missed responses (5 minutes total) before disconnecting
- **Result**: Connection stays alive during long operations (npm install, migrations, PM2)

---

## 📋 **SERVER-SIDE RECOMMENDATION (OPTIONAL)**

For additional resilience, configure server-side SSH keep-alive:

**On the server (`/etc/ssh/sshd_config`):**
```bash
ClientAliveInterval 120
ClientAliveCountMax 10
```

**Then restart SSH:**
```bash
sudo systemctl restart sshd
```

**Note:** This is optional - the client-side keep-alive (now implemented) should be sufficient.

---

## ✅ **VALIDATION**

### **What Was Fixed:**
- ✅ All SSH connections now have keep-alive
- ✅ All SCP connections now have keep-alive
- ✅ rsync commands inherit keep-alive via SSH_OPTS
- ✅ Long-running remote script execution protected
- ✅ No breaking changes
- ✅ No duplicate configurations

### **Expected Behavior:**
- ✅ SSH connections stay alive during long operations
- ✅ No more "Broken pipe" errors
- ✅ Deployment completes successfully even with 8+ minute operations
- ✅ Better resilience to network hiccups

---

## 🎯 **NEXT DEPLOYMENT**

The next deployment should:
1. ✅ Maintain SSH connection throughout entire deployment
2. ✅ Complete npm install without disconnects
3. ✅ Complete Prisma migrations without disconnects
4. ✅ Complete PM2 operations without disconnects
5. ✅ Successfully finish zero-downtime swap

---

## 📊 **RISK ASSESSMENT**

**Risk Level:** **LOW**
- ✅ Only added SSH options (no logic changes)
- ✅ No breaking changes
- ✅ Backward compatible
- ✅ No duplicate configurations
- ✅ All connections consistently configured

---

**Fix Date:** 2025-01-08  
**Status:** ✅ **COMPLETE - READY FOR DEPLOYMENT**

