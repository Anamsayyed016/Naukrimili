# PM2 Process Cleanup - Remove Duplicate

## Current Status
```
✅ Build successful - No errors
✅ naukrimili running (id: 1)
❌ ecosystem-minimal running (id: 0) - needs removal
```

## Commands to Run on Server

### Step 1: Stop and Delete ecosystem-minimal
```bash
# Stop the old process
pm2 stop ecosystem-minimal

# Delete it from PM2
pm2 delete ecosystem-minimal

# Verify only naukrimili is running
pm2 list
```

### Step 2: Save PM2 Configuration
```bash
# Save the current PM2 process list
pm2 save

# Setup PM2 to start on server reboot
pm2 startup
```

### Step 3: Verify Everything
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs naukrimili --lines 50

# Check if site is accessible
curl -I http://localhost:3000
```

## Expected Result After Cleanup

```bash
pm2 list

┌────┬──────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┐
│ id │ name         │ mode    │ pid     │ status   │ uptime │ ↺    │ mem       │
├────┼──────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┤
│ 1  │ naukrimili   │ fork    │ 173136  │ online   │ 5m     │ 1    │ 241.8mb   │
└────┴──────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┘
```

## Quick One-Liner
```bash
pm2 stop ecosystem-minimal && pm2 delete ecosystem-minimal && pm2 save && pm2 list
```

---

## Build Success Summary ✅

Your production build completed perfectly:
- ✅ No CSS errors
- ✅ No build warnings
- ✅ All 214 pages generated
- ✅ 160+ API routes compiled
- ✅ Optimized production build
- ✅ PM2 running successfully

**CSS fixes are now live in production!** 🎉

