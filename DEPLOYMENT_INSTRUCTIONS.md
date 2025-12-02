# 🚀 Privacy Policy Update - Deployment Instructions

## ✅ All Changes Complete - Ready for Deployment

---

## 📋 What Was Done

### 1. **Codebase Scan** ✅
- Scanned entire codebase for duplicates
- Verified no conflicting implementations
- Checked all privacy policy references
- Confirmed database schema integrity

### 2. **Bug Fixes** ✅
- Fixed API route error handling (`app/api/content/[key]/route.ts`)
- Changed `_error` to `error` in catch block

### 3. **Code Updates** ✅
- **Removed mock data** from `app/privacy/page.tsx` (130+ lines)
- **Added API integration** to fetch from `/api/content/privacy`
- **Improved error handling** with proper user messages

### 4. **New Files Created** ✅
- `scripts/seed-static-content.js` - Database seeder
- `scripts/seed-static-content.ts` - TypeScript version (backup)
- `PRIVACY_POLICY_UPDATE_COMPLETE.md` - Full documentation
- `DEPLOYMENT_INSTRUCTIONS.md` - This file

### 5. **Package.json Updated** ✅
- Added command: `npm run db:seed:privacy`

---

## 🎯 Deployment Steps

### **IMPORTANT: Run on Production Server**

Since your database is on the production server (not localhost), follow these steps:

### Step 1: SSH into Production Server
```bash
ssh user@naukrimili.com
# or
ssh user@69.62.73.84
```

### Step 2: Navigate to Project Directory
```bash
cd /path/to/jobportal
# Usually: cd /var/www/jobportal or cd ~/jobportal
```

### Step 3: Pull Latest Changes
```bash
git pull origin main
```

### Step 4: Run the Privacy Policy Seeder
```bash
npm run db:seed:privacy
```

**Expected Output:**
```
🌱 Starting Static Content seeding...

📝 Creating new Privacy Policy...
✅ Privacy Policy created successfully!

✅ Verification: Privacy Policy exists in database
   ID: clxxx...
   Title: Privacy Policy
   Content Length: 5847 characters
   Active: true
   Last Updated: 2025-12-02T...

🎉 Static Content seeding completed successfully!

📌 Next steps:
   1. Privacy Policy is now available at: /api/content/privacy
   2. The frontend page will fetch from this API
   3. Test the page at: /privacy

✅ Seeding process completed
```

### Step 5: Restart the Application
```bash
pm2 restart jobportal
# or
pm2 reload jobportal
```

### Step 6: Verify Deployment
```bash
# Test API endpoint
curl https://naukrimili.com/api/content/privacy

# Should return JSON with privacy policy content
```

### Step 7: Test in Browser
```
https://naukrimili.com/privacy
```

**Verify:**
- ✅ Page loads without errors
- ✅ Content displays correctly
- ✅ "Last Updated: 12/02/2025" is visible
- ✅ Refund Policy section appears
- ✅ All formatting is correct
- ✅ No console errors

---

## 📊 Files Modified

| File | Status | Description |
|------|--------|-------------|
| `app/api/content/[key]/route.ts` | ✏️ Modified | Fixed error handling bug |
| `app/privacy/page.tsx` | ✏️ Modified | Removed mock data, added API fetch |
| `package.json` | ✏️ Modified | Added `db:seed:privacy` command |
| `scripts/seed-static-content.js` | ✨ New | Privacy policy seeder (JavaScript) |
| `scripts/seed-static-content.ts` | ✨ New | Privacy policy seeder (TypeScript) |
| `PRIVACY_POLICY_UPDATE_COMPLETE.md` | ✨ New | Complete documentation |
| `DEPLOYMENT_INSTRUCTIONS.md` | ✨ New | This deployment guide |

---

## 🔍 Verification Checklist

After deployment, verify:

- [ ] Database has privacy policy entry (key: 'privacy')
- [ ] API endpoint returns correct data: `/api/content/privacy`
- [ ] Privacy page loads: `https://naukrimili.com/privacy`
- [ ] Content displays with proper formatting
- [ ] "Last Updated: 12/02/2025" is visible
- [ ] Refund Policy section is present
- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] Page is responsive on mobile
- [ ] All links work correctly

---

## 🐛 Troubleshooting

### Issue: Database Connection Error
```
Can't reach database server at localhost:5432
```

**Solution:** Run the seeder on the production server where the database is running, not locally.

### Issue: API Returns 404
```json
{"error": "Content not found"}
```

**Solution:** 
1. Run the seeder: `npm run db:seed:privacy`
2. Check database: `npm run db:studio`
3. Verify 'privacy' key exists in StaticContent table

### Issue: Page Shows "Failed to load privacy policy"
**Solution:**
1. Check API endpoint: `curl https://naukrimili.com/api/content/privacy`
2. Check browser console for errors
3. Verify server is running: `pm2 status`
4. Check server logs: `pm2 logs jobportal`

### Issue: Content Not Updating
**Solution:**
1. Clear browser cache (Ctrl+Shift+R)
2. Restart server: `pm2 restart jobportal`
3. Re-run seeder: `npm run db:seed:privacy`

---

## 📝 Database Query (Manual Verification)

If you need to manually check the database:

```sql
-- Connect to database
psql -U your_user -d your_database

-- Check if privacy policy exists
SELECT id, key, title, LENGTH(content) as content_length, "isActive", "updatedAt" 
FROM "StaticContent" 
WHERE key = 'privacy';

-- View full content
SELECT content FROM "StaticContent" WHERE key = 'privacy';
```

---

## 🔄 To Update Privacy Policy in Future

1. Edit the content in `scripts/seed-static-content.js`
2. Run: `npm run db:seed:privacy`
3. Restart server: `pm2 restart jobportal`

The seeder will automatically **update** the existing entry (not create duplicate).

---

## 📞 Support

If you encounter any issues:

1. Check server logs: `pm2 logs jobportal`
2. Check database: `npm run db:studio`
3. Verify environment variables are set
4. Ensure database is accessible

---

## ✨ New Privacy Policy Features

### Added Refund & Cancellation Policy
- Clear refund rules for Resume Builder service
- Eligibility criteria for refunds
- Non-refundable situations listed
- User responsibilities outlined
- Contact information for support

### Content Sections:
1. Information We Collect
2. How We Use Your Information
3. Sharing of Information
4. Data Security
5. Cookies
6. Your Rights
7. Third-Party Links
8. Updates to This Policy
9. **Refund Policy (Resume Builder Service)** ⭐ NEW
10. Contact Us

---

## 🎉 Success!

Once deployed, your privacy policy will be:
- ✅ Stored in database (not hardcoded)
- ✅ Editable via seeder script
- ✅ Fetched via API
- ✅ Includes Refund Policy
- ✅ Professional and complete
- ✅ Easy to maintain

---

**Last Updated:** December 2, 2025
**Status:** ✅ Ready for Production Deployment

