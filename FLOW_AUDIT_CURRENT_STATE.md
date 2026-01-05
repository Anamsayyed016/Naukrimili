# 🔍 Flow Audit - Current State Analysis

**Date:** Current  
**Purpose:** Document current authentication, routing, and user flow state before applying fixes

---

## 📊 **CURRENT FLOW MAPPING**

### **ISSUE 1: Flow Break After Login**

#### **Current Behavior:**

**Scenario A: User Clicks "Create New Resume" (Not Authenticated)**
1. User on homepage or resume builder start page
2. Clicks "Create New Resume" button
3. **Current:** Directly navigates to `/resume-builder/templates` (no auth check)
4. User selects template → `/resume-builder/editor`
5. User fills form → Clicks download/export
6. **Payment blocked** (no clear message shown)

**Scenario B: User Clicks "View Plans / Pricing" (Not Authenticated)**
1. User clicks pricing link/button
2. Navigates to `/pricing`
3. User can view plans
4. User clicks "Buy Plan" → **Redirected to login** (if not authenticated)
5. After login → **Redirected to `/dashboard/jobseeker`** ❌
6. User must manually navigate back to pricing/resume builder

#### **Current Auth Redirect Logic:**

**After Login (`app/auth/signin/page.tsx`):**
```typescript
// Lines 48-60
switch (session.user.role) {
  case 'admin':
    router.replace('/dashboard/admin');
    break;
  case 'jobseeker':
    router.replace('/dashboard/jobseeker'); // ❌ HARDCODED
    break;
  case 'employer':
    router.replace('/dashboard/company');
    break;
  default:
    router.replace('/auth/role-selection');
}
```

**After Registration (`components/auth/PostAuthRoleSelection.tsx`):**
```typescript
// Lines 178-192
switch (role) {
  case 'jobseeker':
    targetUrl = '/dashboard/jobseeker'; // ❌ HARDCODED
    break;
  case 'employer':
    targetUrl = '/dashboard/company';
    break;
  default:
    targetUrl = '/dashboard';
}
router.push(targetUrl);
```

**NextAuth Redirect Callback (`lib/nextauth-config.ts`):**
- Supports `callbackUrl` parameter
- Currently used for OAuth flows
- Not consistently used for credential login

---

### **ISSUE 2: Payment Block Without Feedback**

#### **Current Behavior:**

**Scenario: User Tries to Download/Export (Not Authenticated)**

**In FinalizeStep (`components/resume-builder/steps/FinalizeStep.tsx`):**
```typescript
// Lines 179-210
const handleExport = async (format: 'pdf', bypassPaymentCheck: boolean = false) => {
  // ... payment status check
  if (!paymentStatus.isActive || !paymentStatus.planType) {
    setPendingExportFormat(format);
    setShowPaymentDialog(true); // ✅ Shows payment dialog
    setExporting(null);
    return;
  }
}
```

**Payment Dialog:**
- Shows pricing plans
- Allows payment selection
- **BUT:** If user not authenticated, payment API will fail
- **NO clear message shown:** "You need to log in first"

**In Pricing Page (`app/pricing/page.tsx`):**
- Users can view plans without authentication
- "Buy Plan" button likely redirects to login
- After login → Redirected to dashboard (not back to pricing)

---

## 🗺️ **CURRENT ROUTING MAP**

### **Resume Builder Entry Points:**

1. **`/resume-builder/start`**
   - Component: `components/resume-builder/ResumeBuilderStart.tsx`
   - Buttons:
     - "Create New Resume" → `/resume-builder/templates` (no auth check)
     - "Import Resume" → `/resumes/upload?intent=builder`
     - "View Plans / Pricing" → `/pricing`

2. **Jobseeker Dashboard (`/dashboard/jobseeker`)**
   - Need to check if there's a "Build Resume" CTA
   - Currently redirects here after login

3. **Pricing Page (`/pricing`)**
   - Accessible without auth
   - Buy Plan button → ? (need to check)

### **Authentication Pages:**

1. **`/auth/login`** → Redirects to `/auth/role-selection`
2. **`/auth/signin`** → Main sign in page
3. **`/auth/register/jobseeker`** → Registration page
4. **`/auth/role-selection`** → Role selection after OAuth

### **Redirect Flow After Auth:**

```
Login/Register Success
  ↓
Check user.role
  ↓
HARDCODED redirects:
  - jobseeker → /dashboard/jobseeker ❌
  - employer → /dashboard/company
  - admin → /dashboard/admin
  ↓
User loses original intent ❌
```

---

## 🔐 **AUTHENTICATION CHECK POINTS**

### **Currently Protected Routes:**
- `/dashboard/*` - Requires auth
- `/api/resume-builder/export/*` - Requires auth + payment
- `/api/resume-builder/save` - Requires auth

### **Currently Unprotected Routes:**
- `/resume-builder/start` - No auth required
- `/resume-builder/templates` - No auth required
- `/resume-builder/editor` - No auth required (but export requires it)
- `/pricing` - No auth required

---

## 💳 **PAYMENT BLOCKING POINTS**

### **Current Payment Checks:**

1. **PDF Export (`components/resume-builder/steps/FinalizeStep.tsx`):**
   - Checks `/api/payments/status`
   - If no active plan → Shows payment dialog
   - **BUT:** No auth check before payment check
   - **Missing:** Clear message if not authenticated

2. **Pricing Page:**
   - Buy Plan button → Need to check implementation
   - Likely redirects to login if not authenticated
   - After login → Loses context

---

## 🎯 **IDENTIFIED ISSUES SUMMARY**

### **Issue 1: Redirect Intent Lost**
- ✅ **Location:** `app/auth/signin/page.tsx` (lines 48-60)
- ✅ **Location:** `components/auth/PostAuthRoleSelection.tsx` (lines 178-192)
- ✅ **Problem:** Hardcoded redirects to dashboard
- ✅ **Solution Needed:** Capture `callbackUrl` / redirect intent

### **Issue 2: Resume Builder Entry (No Auth Check)**
- ✅ **Location:** `components/resume-builder/ResumeBuilderStart.tsx`
- ✅ **Current:** Direct navigation, no auth check
- ✅ **Problem:** User can start building but hits wall at export
- ✅ **Solution Needed:** Optional - could add auth check OR just improve messaging

### **Issue 3: Payment Block Messaging**
- ✅ **Location:** `components/resume-builder/steps/FinalizeStep.tsx`
- ✅ **Current:** Shows payment dialog but no auth check message
- ✅ **Problem:** Confusing if user not authenticated
- ✅ **Solution Needed:** Clear message + login CTA

---

## 📝 **REQUIRED FIXES (FLOW-LEVEL ONLY)**

### **FIX 1: Preserve Redirect Intent**

**Files to Modify:**
1. `components/resume-builder/ResumeBuilderStart.tsx`
   - Add `?redirect=/resume-builder/start` to auth links (if any)
   - OR: Store intent in localStorage before navigation

2. `app/auth/signin/page.tsx`
   - Read `callbackUrl` from query params
   - Use it for redirect after login (if valid)
   - Fallback to dashboard if no callbackUrl

3. `components/auth/PostAuthRoleSelection.tsx`
   - Read redirect intent from URL/storage
   - Use it after role selection
   - Fallback to dashboard if no intent

4. `app/pricing/page.tsx`
   - Add `?redirect=/pricing` to login links
   - Store intent before navigation

### **FIX 2: Payment Block Messages**

**Files to Modify:**
1. `components/resume-builder/steps/FinalizeStep.tsx`
   - Check authentication before payment check
   - Show clear message if not authenticated
   - Provide login/register CTAs
   - Preserve export intent

2. `app/pricing/page.tsx`
   - Check authentication before payment flow
   - Show message if not authenticated
   - Provide login/register CTAs

### **FIX 3: Resume Builder Entry Unification**

**Files to Modify:**
1. `app/dashboard/jobseeker/page.tsx`
   - Ensure "Build Resume" CTA → `/resume-builder/start`
   - No intermediate steps

---

## ✅ **IMPLEMENTATION PLAN**

### **Phase 1: Redirect Intent Preservation**
1. Update resume builder start page to capture intent
2. Update pricing page to capture intent
3. Update auth signin to use callbackUrl
4. Update role selection to use callbackUrl
5. Test redirect flow

### **Phase 2: Payment Block Messages**
1. Add auth check to FinalizeStep export handler
2. Add clear messaging for unauthenticated users
3. Add login/register CTAs
4. Test payment flow

### **Phase 3: Entry Point Unification**
1. Verify jobseeker dashboard resume builder link
2. Ensure direct routing
3. Test complete flow

---

**Status:** Audit Complete  
**Next Step:** Implement fixes

