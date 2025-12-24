# 🚀 Razorpay Payment Gateway - Setup Guide

## ❌ Current Issue

Your payment gateway is **not configured** with Razorpay credentials. The button and backend are working, but:

- `RAZORPAY_KEY_ID` is missing
- `RAZORPAY_KEY_SECRET` is missing

When users click "Buy Now", the backend returns `keyId: undefined`, which prevents the Razorpay checkout from opening.

---

## ✅ Step 1: Create Razorpay Account

1. Go to https://dashboard.razorpay.com/
2. Sign up with your email
3. Complete email verification
4. Set up your business details

---

## 🔑 Step 2: Get Your API Keys

### For **Development/Testing** (Recommended First):

1. Log in to Razorpay Dashboard
2. Go to **Settings** → **API Keys** (top right)
3. You'll see two sections:
   - **Test Keys** (for development)
   - **Live Keys** (for production)

4. Copy your **Test Key ID** (looks like: `rzp_test_xxxxxxxxxxxxx`)
5. Copy your **Test Key Secret** (looks like: `xxxxxxxxxxxxxxxx`)

### For **Production**:
- Use the **Live Keys** instead
- These process real payments
- Keep them secret!

---

## 📝 Step 3: Update Your Environment

### Option A: Edit `.env.local` (Recommended for local development)

Create or edit `.env.local` in your project root:

```
# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
```

Replace `xxxxxxxxxxxxxxxxxxxx` with your actual keys from Razorpay dashboard.

### Option B: Edit `ecosystem.config.cjs` (For server deployment)

Find these lines (around line 157 and 202):

**Before:**
```javascript
RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "rzp_test_",
RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "R m4cVgW16U4Plei3gFa1YP2hR"
```

**After:**
```javascript
RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "rzp_test_YOUR_ACTUAL_KEY",
RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "YOUR_ACTUAL_SECRET"
```

---

## 🧪 Step 4: Test Your Setup

### 1. Restart the dev server:
```bash
npm run dev
```

### 2. Check if credentials are loaded:

Visit: `http://localhost:3000/api/debug/payment-config`

You should see:
```json
{
  "razorpay": {
    "keyIdConfigured": true,
    "keySecretConfigured": true,
    "keyIdPrefix": "rzp_test_xxxx..."
  },
  ...
}
```

If you see `false`, the credentials are **not loaded**. Restart your dev server.

### 3. Test the payment flow:

1. Go to `http://localhost:3000/pricing`
2. Click **"Buy Now"** button
3. Razorpay checkout should appear
4. Use test card: **4111 1111 1111 1111**
5. Any future date for expiry
6. Any 3 digits for CVV

---

## 🧪 Test Cards (For Development)

### Successful Payment:
- **Card Number:** `4111 1111 1111 1111`
- **Expiry:** Any future date
- **CVV:** Any 3 digits

### Failed Payment:
- **Card Number:** `4000 0000 0000 0002`
- **Expiry:** Any future date
- **CVV:** Any 3 digits

---

## 🔒 Production Deployment

When deploying to production:

1. **DO NOT** commit your Razorpay keys to GitHub
2. **DO** add them as environment variables on your hosting platform
3. Use **Live Keys** for production (not Test keys)

### For Hostinger/Server Deployment:

1. Update `.env` file on your server with Live keys
2. Or set environment variables in your hosting control panel
3. Restart the application

---

## ✨ Webhook Configuration (Optional but Recommended)

For business subscriptions, configure Razorpay webhooks:

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Enable these events:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
   - `subscription.activated`
   - `subscription.cancelled`
   - `subscription.expired`

4. Copy the webhook secret and add to `.env`:
```
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

---

## 🐛 Troubleshooting

### Problem: "Payment gateway not configured"

**Solution:** 
- Check if `.env.local` has the keys
- Restart `npm run dev`
- Visit `/api/debug/payment-config` to verify

### Problem: "Invalid payment signature"

**Solution:**
- Make sure you're using the correct **Key Secret**
- Don't use Key ID as the secret (common mistake!)

### Problem: Razorpay checkout doesn't open

**Solution:**
- Check browser console for errors
- Verify `keyId` is defined (visit `/api/debug/payment-config`)
- Check that ad-blockers aren't blocking Razorpay CDN

### Problem: Payment says "failed" in Razorpay dashboard

**Solution:**
- Make sure you're using **Test cards** for test mode
- Use the test card numbers listed above

---

## 📞 Support

If you have issues:

1. Check Razorpay documentation: https://razorpay.com/docs/
2. Test in Razorpay Dashboard → Logs section
3. Check server logs for detailed errors

---

## ✅ Verification Checklist

- [ ] Created Razorpay account
- [ ] Copied Test/Live Key ID and Secret
- [ ] Updated `.env.local` with credentials
- [ ] Restarted dev server
- [ ] Visited `/api/debug/payment-config` and confirmed keys are set
- [ ] Tested payment flow with test card
- [ ] Verified plan activates after payment
- [ ] (Optional) Configured webhook

---

## 📊 What Happens After Setup

1. **User clicks "Buy Now"**
   - Frontend sends plan selection to `/api/payments/create-order`
   
2. **Backend creates Razorpay order**
   - Stores payment record in database
   - Returns order ID and `keyId` to frontend
   
3. **Razorpay checkout opens**
   - User enters card details
   - Razorpay processes payment
   
4. **Frontend verifies payment**
   - Calls `/api/payments/verify` with payment signature
   - Backend validates signature with `RAZORPAY_KEY_SECRET`
   
5. **Plan is activated**
   - User credits are created/updated
   - User is redirected to dashboard
   - Plan is valid for specified days

---

Good luck! 🎉

