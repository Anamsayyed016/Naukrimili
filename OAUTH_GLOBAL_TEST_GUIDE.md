# OAuth Global Test Guide

## ✅ Current Status
- **Google OAuth**: Configured ✅
- **CORS Headers**: Working ✅
- **Session Endpoint**: Working ✅
- **Sign-in Endpoint**: Redirecting (302) ✅ (Expected behavior)

## 🌐 How to Test OAuth Globally

### 1. Test from Production Domain
```
https://naukrimili.com/api/auth/signin/google
```
Expected: Redirects to Google OAuth consent screen

### 2. Test OAuth Flow
1. Navigate to: `https://naukrimili.com/auth/signin`
2. Click "Sign in with Google"
3. Should redirect to Google OAuth
4. After consent, should redirect back to your app

### 3. Test from Different Locations
- Access from different countries/regions
- Use VPN to test from different IPs
- Test on mobile devices
- Test on different browsers

## 🔧 Google Cloud Console Configuration

### Required Settings:
**Authorized JavaScript origins:**
```
https://naukrimili.com
http://localhost:3000
```

**Authorized redirect URIs:**
```
https://naukrimili.com/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

## ✅ Verification Commands

### Check OAuth Providers:
```bash
curl https://naukrimili.com/api/auth/providers
```

### Check Google Sign-in:
```bash
curl -I https://naukrimili.com/api/auth/signin/google
```
Expected: 302 redirect to Google

### Check Session:
```bash
curl https://naukrimili.com/api/auth/session
```

## 🌍 Global Testing Checklist

- [ ] OAuth works from production domain
- [ ] OAuth works from different countries
- [ ] OAuth works on mobile devices
- [ ] OAuth works on different browsers
- [ ] Google Cloud Console is configured correctly
- [ ] Environment variables are set on production server
- [ ] No CORS errors in browser console
- [ ] No PKCE errors in server logs

## 📝 Common Issues

### Issue: "InvalidCheck: pkceCodeVerifier"
**Solution**: Clear browser cookies and try again in incognito mode

### Issue: "UnknownAction: Only GET and POST requests are supported"
**Solution**: Ensure middleware.ts is updated and app is rebuilt

### Issue: "redirect_uri_mismatch"
**Solution**: Verify redirect URI in Google Cloud Console matches exactly

