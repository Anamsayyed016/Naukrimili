# OAuth Users Cleanup - Ready for Server! ✅

## 🎯 Main Command for Your Server

### **Copy & Paste This Command:**
```bash
node scripts/clear-oauth-users-simple.js
```

## 📋 Complete Server Commands

### **For Your PostgreSQL Server:**
```bash
# 1. SSH into your server
ssh user@your-server.com

# 2. Navigate to project directory
cd /var/www/jobportal

# 3. Pull latest changes
git pull origin main

# 4. Clean OAuth users only
node scripts/clear-oauth-users-simple.js

# 5. Restart your application
pm2 restart jobportal
```

## 🔍 What This Does

### **Removes Only OAuth Users:**
- ✅ Users who logged in with Google OAuth
- ✅ Users with `password = NULL` and OAuth accounts
- ✅ All their related data (jobs, applications, resumes, notifications)

### **Preserves:**
- ✅ Users with email/password login
- ✅ System configurations
- ✅ Non-user data

## 📁 Files Created

### **Working Scripts:**
- ✅ `scripts/clear-oauth-users-simple.js` - **Main script (tested & working)**
- ✅ `scripts/clear-oauth-users.sql` - Direct SQL commands
- ✅ `scripts/clear-oauth-users.js` - Alternative version

### **Documentation:**
- ✅ `OAUTH_USERS_CLEANUP_COMMANDS.md` - Complete command reference

## 🧪 Tested & Verified

The script has been tested locally and works correctly:
- ✅ No syntax errors
- ✅ Proper database connection
- ✅ Safe OAuth user identification
- ✅ Clean deletion process

## 🛡️ Safety Features

### **Preview Before Deletion:**
- Shows exactly which OAuth users will be deleted
- Displays user email and account count
- 5-second delay before deletion (time to cancel with Ctrl+C)

### **Smart Identification:**
- Only targets users with `password = NULL`
- Only targets users with OAuth accounts
- Preserves credential-based users

## 🚀 Quick Reference

| Command | Purpose |
|---------|---------|
| `node scripts/clear-oauth-users-simple.js` | **Main OAuth cleanup** |
| `psql -U user -d db -f scripts/clear-oauth-users.sql` | Direct SQL |
| `pm2 restart jobportal` | Restart app |

## 🔧 Environment Setup

Make sure your server has:
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
```

## 📊 Expected Output

When you run the script, you'll see:
```
🗑️  Starting OAuth users cleanup...
📊 Found X OAuth users to remove:
1. John Doe (john@example.com) - 1 OAuth account(s)
2. Jane Smith (jane@example.com) - 1 OAuth account(s)

⚠️  WARNING: This will delete the above OAuth users and all their data!
Press Ctrl+C to cancel, or wait 5 seconds to continue...

🗑️  Proceeding with OAuth users deletion...
✅ Deleted OAuth user: John Doe (john@example.com)
✅ Deleted OAuth user: Jane Smith (jane@example.com)

🎉 Successfully deleted OAuth users and their data!
✨ OAuth users cleanup completed!
```

## 🎉 Ready to Deploy!

Your OAuth users cleanup is ready! Just run the main command on your server:

```bash
node scripts/clear-oauth-users-simple.js
```

This will clean only OAuth users from your PostgreSQL database, leaving credential-based users intact! 🚀

---

**Status**: ✅ COMPLETE - OAuth cleanup ready for server deployment
