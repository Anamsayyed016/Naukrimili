# 🚀 Server Migration Documentation - READ THIS FIRST!

## 📚 What's Been Created for You

I've scanned your entire codebase and created **4 comprehensive documents** to help you migrate to your new Hostinger server. Here's what each file contains:

---

## 📄 Document Guide

### 1. **NEW_SERVER_MIGRATION_CHECKLIST.md** 
📖 **THE COMPLETE REFERENCE GUIDE**

**What it contains:**
- ✅ Complete list of ALL environment variables
- ✅ All API keys with descriptions
- ✅ Database configuration
- ✅ GitHub secrets setup
- ✅ PM2 configuration
- ✅ Verification commands
- ✅ Security notes

**When to use:** 
- Reference guide for understanding what each key does
- Complete checklist for migration tasks
- Troubleshooting reference

---

### 2. **QUICK_ENV_SETUP.txt**
⚡ **COPY-PASTE READY FILE**

**What it contains:**
- ✅ Ready-to-copy .env file content
- ✅ All active API keys pre-filled
- ✅ Quick setup commands
- ✅ Verification one-liners

**When to use:**
- When creating .env file on new server
- Quick reference for active API keys
- Copy-paste into terminal for quick setup

---

### 3. **STEP_BY_STEP_MIGRATION_GUIDE.md**
👣 **FOLLOW-ALONG TUTORIAL**

**What it contains:**
- ✅ 9 step-by-step parts
- ✅ Every command you need to run
- ✅ Checkpoints after each step
- ✅ Troubleshooting section
- ✅ Time estimates for each part

**When to use:**
- Your main migration guide
- Follow it sequentially from Part 1 to Part 9
- Perfect for first-time server setup

**Total Time:** 30-45 minutes

---

### 4. **API_KEYS_REFERENCE.json**
🔑 **STRUCTURED DATA FORMAT**

**What it contains:**
- ✅ All keys in JSON format
- ✅ Categorized by type
- ✅ Setup URLs for each service
- ✅ Machine-readable format

**When to use:**
- Programmatic access to configuration
- Integration with scripts
- Quick lookup of specific keys

---

## 🎯 Quick Start: How to Use These Files

### For First-Time Migration (Recommended Path):

1. **START HERE:** Read `STEP_BY_STEP_MIGRATION_GUIDE.md`
   - Follow it from Part 1 to Part 9
   - Don't skip steps!

2. **REFERENCE:** Keep `QUICK_ENV_SETUP.txt` open
   - Copy-paste .env content when needed (Part 4)
   - Use quick commands as needed

3. **VERIFY:** Use `NEW_SERVER_MIGRATION_CHECKLIST.md`
   - Check off completed items
   - Verify all keys are set
   - Run verification commands

4. **LOOKUP:** Use `API_KEYS_REFERENCE.json`
   - When you need specific key details
   - For programmatic access

---

## 🔑 Your Active API Keys Summary

### ✅ Currently Working (Copy to New Server):

| Service | Type | Status |
|---------|------|--------|
| **Adzuna** | Job Search API | ✅ Active |
| **RapidAPI/JSearch** | Job Search API | ✅ Active |
| **Jooble** | Job Search API | ✅ Active |

### 📋 Database:
- **Connection:** `postgresql://postgres:job123@localhost:5432/jobportal`
- **Note:** You can keep the same password or change it

### 🔐 Authentication:
- **NextAuth Secret:** Already set (keep same for session continuity)
- **JWT Secret:** Already set (keep same)

### ⚠️ Need to Obtain (Optional):
- Google OAuth (for Google login)
- OpenAI API (for AI features)
- Gmail SMTP (for email notifications)

---

## 🚦 Migration Process Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MIGRATION FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. PREPARE NEW SERVER                                      │
│     └─ Install Node.js, PostgreSQL, PM2                     │
│                                                              │
│  2. SETUP SSH KEYS                                          │
│     └─ Generate keys, add to server & GitHub                │
│                                                              │
│  3. UPDATE GITHUB SECRETS                                   │
│     └─ HOST, SSH_USER, SSH_KEY, SSH_PORT                   │
│                                                              │
│  4. CREATE .ENV FILE                                        │
│     └─ Copy from QUICK_ENV_SETUP.txt                        │
│                                                              │
│  5. DEPLOY VIA GITHUB ACTIONS                               │
│     └─ Push to main or run workflow manually                │
│                                                              │
│  6. VERIFY APPLICATION                                      │
│     └─ Check PM2, test endpoints, view logs                 │
│                                                              │
│  7. UPDATE DNS                                              │
│     └─ Point domain to new server IP                        │
│                                                              │
│  8. SETUP SSL                                               │
│     └─ Install Nginx + Let's Encrypt certificate            │
│                                                              │
│  9. FINAL TESTING                                           │
│     └─ Test all features, monitor logs                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏱️ Time Breakdown

| Phase | Duration | Difficulty |
|-------|----------|------------|
| Server Setup | 15 min | Easy |
| SSH Configuration | 10 min | Medium |
| GitHub Secrets | 5 min | Easy |
| Environment Setup | 5 min | Easy |
| Deployment | 10-15 min | Easy |
| DNS & SSL | 10-60 min | Medium |
| Testing | 10 min | Easy |
| **TOTAL** | **30-60 min** | **Medium** |

*DNS propagation can take up to 60 minutes*

---

## 🎯 What You Need Before Starting

### Access Requirements:
- [ ] New Hostinger VPS access (root/SSH)
- [ ] GitHub repository admin access
- [ ] Domain DNS management access
- [ ] Current API keys (documented in these files)

### Tools Needed:
- [ ] SSH client (Terminal, PowerShell, or PuTTY)
- [ ] Text editor (for editing files)
- [ ] Web browser (for GitHub & DNS)

---

## 🔍 Key Information at a Glance

### Current Setup:
```
Server IP:    69.62.73.84
Domain:       https://naukrimili.com
Database:     PostgreSQL (jobportal)
App Manager:  PM2
Framework:    Next.js 15
```

### New Setup Needed:
```
Server IP:    YOUR_NEW_SERVER_IP
Domain:       YOUR_DOMAIN (update in .env)
Database:     PostgreSQL (create new)
App Manager:  PM2 (install)
Framework:    Same (deployed via GitHub Actions)
```

---

## ✅ Pre-Migration Checklist

Before you start, make sure you have:

- [ ] New server provisioned and accessible
- [ ] Root/SSH access credentials
- [ ] GitHub account access
- [ ] DNS management access
- [ ] All documents downloaded/available
- [ ] 30-60 minutes of uninterrupted time

---

## 🆘 If You Get Stuck

### Common Issues & Solutions:

**Issue: SSH connection refused**
```bash
# Check if SSH is running
sudo systemctl status ssh

# Check firewall
sudo ufw status
sudo ufw allow 22
```

**Issue: PM2 not found**
```bash
# Install PM2
sudo npm install -g pm2

# Or use with npx
npx pm2 status
```

**Issue: Database connection error**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify database exists
sudo -u postgres psql -l | grep jobportal
```

**Issue: Port 3000 not accessible**
```bash
# Check if app is running
pm2 status

# Check firewall
sudo ufw allow 3000
```

### Need More Help?

1. Check the **Troubleshooting** section in `STEP_BY_STEP_MIGRATION_GUIDE.md`
2. Review **verification commands** in `NEW_SERVER_MIGRATION_CHECKLIST.md`
3. Check application logs: `pm2 logs jobportal`

---

## 📞 Important Links

### Your Resources:
- **GitHub Repo:** https://github.com/YOUR_USERNAME/YOUR_REPO
- **Current Site:** https://naukrimili.com
- **GitHub Actions:** https://github.com/YOUR_USERNAME/YOUR_REPO/actions
- **GitHub Secrets:** https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions

### API Documentation:
- **Adzuna:** https://developer.adzuna.com/
- **RapidAPI:** https://rapidapi.com/
- **Jooble:** https://jooble.org/api/about
- **Google Cloud:** https://console.cloud.google.com/

---

## 🎉 After Migration

Once migration is complete:

1. ✅ Test all features thoroughly
2. ✅ Monitor logs for 24 hours
3. ✅ Update Google OAuth (if using) with new domain
4. ✅ Setup automated database backups
5. ✅ Document any changes made
6. ✅ Decommission old server (after confirming everything works)

---

## 📊 What's Been Scanned

This documentation was created by scanning:

- ✅ **160+ API route files** in `app/api/`
- ✅ **100+ library files** in `lib/`
- ✅ **90+ React components** in `components/`
- ✅ **30+ TypeScript type definitions** in `types/`
- ✅ **Prisma schema** with 22 database models
- ✅ **GitHub Actions workflow** for CI/CD
- ✅ **Environment configuration** files
- ✅ **PM2 ecosystem** configuration
- ✅ **NextAuth configuration**
- ✅ **All service integrations**

---

## 🔒 Security Reminders

Before migrating:

1. **Never commit .env files to Git** ⚠️
2. **Generate new SSH keys** for new server
3. **Use strong passwords** for database (16+ characters)
4. **Enable firewall** on new server
5. **Setup HTTPS** with SSL certificate
6. **Keep secrets in GitHub Secrets** for CI/CD

---

## 🚀 Ready to Start?

**Recommended path:**

1. Open `STEP_BY_STEP_MIGRATION_GUIDE.md`
2. Start from **Part 1: Prepare Your New Server**
3. Follow sequentially through all 9 parts
4. Use other documents as reference
5. Check off items as you complete them

**Estimated Time:** 30-60 minutes  
**Difficulty Level:** Medium  
**Success Rate:** High (if you follow the guide)

---

## 📝 Summary

You now have **everything you need** for a successful migration:

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **STEP_BY_STEP_MIGRATION_GUIDE.md** | Follow-along tutorial | Your main guide |
| **QUICK_ENV_SETUP.txt** | Copy-paste reference | Creating .env |
| **NEW_SERVER_MIGRATION_CHECKLIST.md** | Complete reference | Verification |
| **API_KEYS_REFERENCE.json** | Structured data | Lookup/Scripts |

---

**Good luck with your migration!** 🚀

If you follow the step-by-step guide carefully, your migration should be smooth and successful.

---

*Generated: ${new Date().toLocaleDateString()}*  
*For: Job Portal - Hostinger Server Migration*

