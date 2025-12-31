# 🔴 Switch to Live/Production Razorpay Keys

## Current Issue

Your payment gateway is showing **"Test Mode"** because it's using **TEST keys** (`rzp_test_...`). To process real payments, you need to switch to **LIVE keys** (`rzp_live_...`).

---

## ✅ Step 1: Get Your Live Keys from Razorpay

1. **Log in to Razorpay Dashboard**: https://dashboard.razorpay.com/
2. **Go to Settings** → **API Keys** (top right)
3. **Switch to "Live Keys" section** (not Test Keys)
4. **Copy your Live Key ID** (starts with `rzp_live_xxxxxxxxxxxxx`)
5. **Copy your Live Key Secret** (long string, keep it secret!)

⚠️ **IMPORTANT**: 
- Live keys process **REAL MONEY**
- Keep them secure and never commit to GitHub
- Test keys are for development only

---

## ✅ Step 2: Set Environment Variables on Your Server

### Option A: Set in Server Environment (Recommended)

**On your production server**, set these environment variables:

```bash
export RAZORPAY_KEY_ID=rzp_live_YOUR_ACTUAL_LIVE_KEY_ID
export RAZORPAY_KEY_SECRET=YOUR_ACTUAL_LIVE_KEY_SECRET
```

### Option B: Update `.env` file on server

**On your production server**, edit the `.env` file:

```bash
# Razorpay Payment Gateway - LIVE KEYS FOR PRODUCTION
RAZORPAY_KEY_ID=rzp_live_YOUR_ACTUAL_LIVE_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_ACTUAL_LIVE_KEY_SECRET
```

### Option C: Update in PM2 Ecosystem Config (if using PM2)

**Edit `ecosystem.config.cjs`** and update the production environment:

```javascript
env_production: {
  // ... other vars
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "rzp_live_YOUR_ACTUAL_LIVE_KEY_ID",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "YOUR_ACTUAL_LIVE_KEY_SECRET"
}
```

⚠️ **Note**: The fallback values in `ecosystem.config.cjs` are only used if environment variables are not set. It's better to set environment variables directly.

---

## ✅ Step 3: Restart Your Application

After setting the environment variables, **restart your application**:

```bash
# If using PM2
pm2 restart naukrimili

# Or restart your Node.js process
```

---

## ✅ Step 4: Verify Live Keys Are Active

1. **Check the debug endpoint** (if available):
   ```
   https://naukrimili.com/api/debug/payment-config
   ```
   
   You should see:
   ```json
   {
     "razorpay": {
       "keyMode": "LIVE",
       "isLiveMode": true,
       "isTestMode": false,
       "warning": "✅ Using LIVE keys for production"
     }
   }
   ```

2. **Test a payment**:
   - Go to `/pricing`
   - Click "Buy Now"
   - The Razorpay modal should **NOT** show "Test Mode" banner
   - Payments will process real transactions

---

## 🔍 How to Check Current Key Mode

The system now automatically detects and logs:
- **TEST mode**: Key starts with `rzp_test_`
- **LIVE mode**: Key starts with `rzp_live_`

Check server logs when creating an order - you'll see:
- `✅ [Create Order] Using LIVE keys - payments will process real transactions` (for live)
- `🧪 [Create Order] Using TEST keys - payments will be in test mode` (for test)
- `⚠️ [Create Order] Using fallback TEST keys` (if using fallback from config)

---

## ⚠️ Important Notes

1. **Test vs Live Keys**:
   - **Test keys** (`rzp_test_...`): For development, no real money
   - **Live keys** (`rzp_live_...`): For production, processes real payments

2. **Environment Variables Take Priority**:
   - If `RAZORPAY_KEY_ID` is set in environment, it will be used
   - Fallback values in `ecosystem.config.cjs` are only used if env vars are missing

3. **Security**:
   - Never commit live keys to Git
   - Never share live keys publicly
   - Use environment variables or secure secret management

4. **Testing**:
   - Always test with test keys first
   - Only switch to live keys when ready for production
   - Monitor first few live transactions carefully

---

## 🐛 Troubleshooting

### Still showing "Test Mode"?

1. **Check environment variables are set**:
   ```bash
   echo $RAZORPAY_KEY_ID
   echo $RAZORPAY_KEY_SECRET
   ```

2. **Verify key format**:
   - Live keys must start with `rzp_live_`
   - Test keys start with `rzp_test_`

3. **Restart application** after setting env vars

4. **Check server logs** for key mode detection messages

### Payment not working?

1. Verify keys are correct from Razorpay dashboard
2. Check server logs for errors
3. Ensure both `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set
4. Verify the keys match (live key ID with live key secret)

---

## ✅ Verification Checklist

- [ ] Got Live Key ID from Razorpay dashboard (starts with `rzp_live_`)
- [ ] Got Live Key Secret from Razorpay dashboard
- [ ] Set `RAZORPAY_KEY_ID` environment variable on server
- [ ] Set `RAZORPAY_KEY_SECRET` environment variable on server
- [ ] Restarted application
- [ ] Verified no "Test Mode" banner in Razorpay checkout
- [ ] Tested payment flow (with small amount first)
- [ ] Verified payment appears in Razorpay dashboard as real transaction

---

## 📞 Support

If you need help:
1. Check Razorpay Dashboard → Logs for transaction details
2. Check server logs for key mode detection
3. Verify environment variables are loaded correctly
4. Contact Razorpay support if keys are not working

