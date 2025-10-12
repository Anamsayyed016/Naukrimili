# 🚀 Server Deployment Commands - Quick Reference

## 📋 **Execute These Commands on Your Server**

### **Step 1: Navigate to Project**
```bash
cd /var/www/naukrimili
```

### **Step 2: Pull Latest Changes**
```bash
git stash
git pull origin main
git stash pop
```

### **Step 3: Clean and Rebuild**
```bash
rm -rf .next
npm run build
```

### **Step 4: Restart PM2**
```bash
pm2 restart naukrimili
```

### **Step 5: Verify**
```bash
pm2 status
pm2 logs naukrimili --lines 20
```

---

## ⚠️ **If Git Pull Has Conflicts**

```bash
# Option 1: Accept all incoming changes
git reset --hard origin/main

# Option 2: Review conflicts
git status
# Then edit conflicted files and:
git add .
git commit -m "Resolve merge conflicts"
```

---

## 🔍 **Verification Steps**

### **1. Check Build Output**
Your build should show CSS is being generated:
```
Route (app)                Size    First Load JS
┌ ○ /                     10 kB   162 kB
```

### **2. Check CSS File Exists**
```bash
ls -lh .next/static/css/app/
```
Should see files like `layout-abc123.css` with substantial size (50KB+)

### **3. Test in Browser**
Open: `https://naukrimili.com`
- Navigation should have blue gradient
- Buttons should be styled
- Cards should have shadows
- Text should be properly colored

---

## 🐛 **If CSS Still Not Working**

### **Nuclear Option: Complete Rebuild**
```bash
cd /var/www/naukrimili
pm2 stop naukrimili
rm -rf .next node_modules/.cache
npm cache clean --force
npm install
npm run build
pm2 restart naukrimili
```

### **Check Node Version**
```bash
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 8.0.0
```

### **Check Disk Space**
```bash
df -h
```

---

## 📊 **What Changed**

- ✅ **postcss.config.cjs** - Simplified to v4 plugin only
- ✅ **app/globals.css** - Migrated from `@tailwind` to `@import "tailwindcss"`
- ✅ **tailwind.config.ts** - New minimal v4 config
- ✅ **tailwind.config.cjs.v3-backup** - Old config backed up

---

## 🎯 **Expected Result**

After deployment:
- All Tailwind utility classes work
- Components are fully styled
- Responsive design functions
- Dark mode supported
- No more "unstyled" pages

---

## 📞 **Need Help?**

Check the full documentation in: `TAILWIND_V4_FIX_COMPLETE.md`

