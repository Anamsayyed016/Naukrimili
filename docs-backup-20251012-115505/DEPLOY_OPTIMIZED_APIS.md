# 🚀 Deploy Optimized Job APIs - Step by Step

**Quick Deployment Guide for Your Optimized Job Portal**

---

## ✅ **WHAT WAS OPTIMIZED**

1. ✅ All 3 APIs activated (Adzuna, JSearch, Jooble)
2. ✅ Parallel API calls for speed (1-3 seconds response)
3. ✅ Smart duplicate removal
4. ✅ Proper apply URLs (external vs employer jobs)
5. ✅ Background caching (non-blocking)

---

## 📋 **PRE-DEPLOYMENT CHECKLIST**

Before deploying, confirm these environment variables are set on server:

```bash
# SSH into server
ssh root@69.62.73.84

# Check environment variables
cd /var/www/naukrimili
cat .env | grep -E "ADZUNA|RAPIDAPI|JOOBLE"

# Should see:
ADZUNA_APP_ID=bdd02427
ADZUNA_APP_KEY=abf03277d13e4cb39b24bf236ad29299
RAPIDAPI_KEY=3c767d3998msha8933e5d0c4a9b1p187000jsnd04d13d1e9bc
JOOBLE_API_KEY=d4d0ab09-32f9-4c37-be17-59629043ca4a
```

✅ If you see these, you're good to go!

---

## 🚀 **DEPLOYMENT STEPS**

### **Step 1: Commit Your Changes (Local)**
```bash
# In your local project directory (E:\myprojects\jobportal)
git add .
git commit -m "feat: optimize job APIs - parallel calls, smart dedup, apply URLs"
git push origin main
```

**Wait for response, then proceed to Step 2.**

---

### **Step 2: Pull Latest Code (Server)**
```bash
# SSH into server (if not already)
ssh root@69.62.73.84

# Navigate to project
cd /var/www/naukrimili

# Pull latest code
git pull origin main
```

**Expected output:**
```
Updating abc1234..def5678
Fast-forward
 app/api/jobs/route.ts | 150 +++++++++++++++++---
 1 file changed, 120 insertions(+), 30 deletions(-)
```

---

### **Step 3: Rebuild Application**
```bash
# Still on server
npm run build
```

**Expected output:**
```
✓ Compiled successfully in 45s
✓ Collecting page data
✓ Generating static pages (214/214)
✓ Finalizing page optimization
```

**⏱️ This takes 45-60 seconds. Wait for completion.**

---

### **Step 4: Restart PM2**
```bash
# Restart the application
pm2 restart jobportal-nextjs

# Check status
pm2 status
```

**Expected output:**
```
│ id │ name              │ status │ cpu │ memory   │
├────┼───────────────────┼────────┼─────┼──────────┤
│ 0  │ jobportal-nextjs  │ online │ 0%  │ 150 MB   │
```

✅ Status should be "online"

---

### **Step 5: Test API Response**
```bash
# Test job search API
curl "http://localhost:3000/api/jobs?query=developer&location=Mumbai"

# Should return JSON with jobs
```

**Expected response:**
```json
{
  "success": true,
  "jobs": [...],
  "total": 45,
  "page": 1,
  "hasNextPage": true
}
```

---

### **Step 6: Check PM2 Logs**
```bash
# View real-time logs
pm2 logs jobportal-nextjs --lines 50

# Look for these indicators:
```

**Good indicators:**
```
✅ "🚀 Fetching jobs from Adzuna, JSearch, Jooble"
✅ "✅ Adzuna: 20 jobs"
✅ "✅ JSearch: 15 jobs"
✅ "✅ Jooble: 18 jobs"
✅ "⚡ API calls completed in 1800ms"
✅ "🔄 Removed 8 duplicates"
✅ "✅ Total: 45 jobs"
```

**Bad indicators (if you see these):**
```
❌ "⚠️ Adzuna failed: API key invalid"
❌ "⚠️ JSearch failed: timeout"
❌ "❌ Dynamic job fetch failed"
```

---

### **Step 7: Test on Live Website**
```bash
# Open browser and test:
1. Go to: https://naukrimili.com/jobs
2. Search for: "Software Engineer"
3. Location: "Mumbai"
4. Click "Search Jobs"
5. Wait 1-3 seconds
6. Should see jobs from multiple sources
```

**Expected behavior:**
- ✅ Jobs appear in 1-3 seconds
- ✅ Mix of external and employer jobs
- ✅ No duplicates
- ✅ "Apply Now" buttons work
- ✅ Filters work correctly

---

## 🧪 **TESTING GUIDE**

### **Test 1: API Jobs Working**
```
Search: "Python Developer"
Location: "Bangalore"
Expected: 20-60 jobs from Adzuna, JSearch, Jooble
```

### **Test 2: Employer Jobs Working**
```
1. Login as employer
2. Post a new job
3. Search for that job
4. Should appear with internal apply URL (/jobs/[id]/apply)
```

### **Test 3: Apply URLs Correct**
```
External Job:
- Click "Apply" → Opens external website

Employer Job:
- Click "Apply" → Opens internal form
```

### **Test 4: No Duplicates**
```
Search: "Manager"
Location: "Delhi"
Check: No duplicate job titles/companies
```

### **Test 5: Filters Work**
```
Test each filter:
- Job Type (Full-time, Part-time)
- Experience Level (Entry, Mid, Senior)
- Remote Only
- Salary Range
All should filter correctly
```

---

## 🔧 **TROUBLESHOOTING**

### **Problem: No External Jobs Appearing**

**Check API keys:**
```bash
cd /var/www/naukrimili
cat .env | grep -E "ADZUNA|RAPIDAPI|JOOBLE"
```

**Fix:** If missing, add them:
```bash
nano .env
# Add:
ADZUNA_APP_ID=bdd02427
ADZUNA_APP_KEY=abf03277d13e4cb39b24bf236ad29299
RAPIDAPI_KEY=3c767d3998msha8933e5d0c4a9b1p187000jsnd04d13d1e9bc
JOOBLE_API_KEY=d4d0ab09-32f9-4c37-be17-59629043ca4a

# Save and restart
pm2 restart jobportal-nextjs
```

---

### **Problem: Slow Response Time (>5 seconds)**

**Check logs:**
```bash
pm2 logs jobportal-nextjs | grep "API calls completed"
```

**If you see high times (>5000ms):**
1. Check server internet speed
2. Check API rate limits
3. Restart PM2: `pm2 restart jobportal-nextjs`

---

### **Problem: "Apply Now" Not Working**

**For external jobs:**
- Should open new tab
- Check browser console for errors

**For employer jobs:**
- Should navigate to `/jobs/[id]/apply`
- Check if job ID is valid

---

### **Problem: Too Many Duplicates**

**Check logs:**
```bash
pm2 logs jobportal-nextjs | grep "Removed.*duplicates"
```

**Should see:**
```
🔄 Removed 5-15 duplicates
```

**If seeing 0 duplicates but jobs look duplicate:**
- Rebuild: `npm run build && pm2 restart jobportal-nextjs`

---

## 📊 **MONITORING**

### **Check API Usage:**
```bash
# Count external jobs in database
sudo -u postgres psql -d jobportal -c "SELECT source, COUNT(*) FROM jobs WHERE source IN ('adzuna', 'jsearch', 'jooble') GROUP BY source;"
```

### **Check Response Times:**
```bash
# Real-time monitoring
pm2 logs jobportal-nextjs | grep "⚡"
```

### **Check Error Rate:**
```bash
# Count errors
pm2 logs jobportal-nextjs | grep "❌" | tail -20
```

---

## ✅ **SUCCESS INDICATORS**

Your deployment is successful if:

1. ✅ PM2 status shows "online"
2. ✅ Logs show all 3 APIs being called
3. ✅ Response time is 1-3 seconds
4. ✅ Jobs appear on website
5. ✅ No duplicate jobs
6. ✅ Apply buttons work correctly
7. ✅ Filters work with external jobs
8. ✅ No console errors

---

## 🎉 **POST-DEPLOYMENT**

### **What to Monitor:**
1. **API Rate Limits** - Check monthly usage
2. **Response Times** - Should stay 1-3 seconds
3. **Error Rates** - Should be <5%
4. **User Feedback** - Check if users find jobs easily

### **Monthly Maintenance:**
```bash
# Clean up expired jobs (older than 7 days)
sudo -u postgres psql -d jobportal -c "DELETE FROM jobs WHERE expiry_date < NOW() AND source IN ('adzuna', 'jsearch', 'jooble');"
```

---

## 📞 **NEED HELP?**

### **Common Commands:**
```bash
# View logs
pm2 logs jobportal-nextjs

# Restart application
pm2 restart jobportal-nextjs

# Check status
pm2 status

# Rebuild
npm run build

# Check environment variables
cat .env | grep API
```

### **Quick Test:**
```bash
# Test API endpoint
curl "http://localhost:3000/api/jobs?query=developer"

# Should return jobs in JSON
```

---

## 📝 **ROLLBACK (If Needed)**

If something goes wrong:

```bash
# SSH into server
ssh root@69.62.73.84
cd /var/www/naukrimili

# Rollback to previous version
git log --oneline -5  # Find previous commit
git checkout <previous-commit-hash>

# Rebuild
npm run build
pm2 restart jobportal-nextjs
```

---

## 🎯 **FINAL CHECKLIST**

Before marking deployment as complete:

- [ ] Code pushed to GitHub
- [ ] Server pulled latest code
- [ ] Build completed successfully
- [ ] PM2 restarted and online
- [ ] API keys verified in .env
- [ ] Test search returns jobs
- [ ] Logs show all 3 APIs working
- [ ] Response time is 1-3 seconds
- [ ] No duplicates in results
- [ ] Apply buttons work correctly
- [ ] Filters work with external jobs
- [ ] No errors in logs
- [ ] Website accessible at naukrimili.com

---

**Once all checkboxes are ticked, your optimized job APIs are live!** 🚀

---

**Created:** October 11, 2025  
**Version:** v1.0  
**Status:** Ready to Deploy

