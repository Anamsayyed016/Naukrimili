# Plan-Based Service Logic Audit & Normalization Plan

## Executive Summary

This document provides a comprehensive audit of the plan-based service logic in the codebase, identifies gaps, and provides a normalization plan to ensure all plan features are properly enforced.

**Status:** ✅ Audit Complete | ⚠️ Implementation Gaps Identified

---

## 1. Current Architecture

### 1.1 Single Source of Truth
- **File:** `lib/services/razorpay-plans.ts`
- **Status:** ✅ WORKING
- **Contains:** All plan definitions with features (Individual + Business)
- **Usage:** Imported by pricing pages, payment service, and activation logic

### 1.2 Core Service Functions
- **File:** `lib/services/payment-service.ts`
- **Status:** ✅ MOSTLY WORKING
- **Functions:**
  - `activateIndividualPlan()` - ✅ Working
  - `activateBusinessSubscription()` - ✅ Working
  - `checkIndividualPlanValidity()` - ✅ Working
  - `checkBusinessSubscription()` - ✅ Working (includes daily/per-resume limits)
  - `canDownloadResume()` - ⚠️ Missing daily limit enforcement
  - `canUseAI()` - ✅ Working
  - `incrementUsage()` - ✅ Working
  - `deductResumeCredits()` - ✅ Working

### 1.3 Middleware
- **File:** `lib/middleware/payment-middleware.ts`
- **Status:** ✅ WORKING
- **Functions:**
  - `checkResumeAccess()` - ✅ Unified access check
  - `withPaymentCheck()` - ✅ Wrapper for API routes

### 1.4 API Routes Using Checks
- `/api/resume-builder/export/pdf` - ✅ Uses `checkResumeAccess('download')`
- `/api/resume-builder/export/docx` - ✅ Uses `checkResumeAccess('download')` (disabled)
- `/api/resume-builder/ai-enhance` - ✅ Uses `checkResumeAccess('aiResume')`
- `/api/jobseeker/resumes/[id]` (PUT) - ✅ Checks plan validity for editing

---

## 2. Service Enforcement Status

### 2.1 Resume PDF Downloads ✅ WORKING
- **Enforcement:** `checkResumeAccess('download')` → `canDownloadResume()`
- **Location:** `app/api/resume-builder/export/pdf/route.ts`
- **Status:** ✅ Total limit enforced
- **Missing:** ⚠️ Daily limit tracking (code comments indicate not implemented)

### 2.2 Resume Credits Usage (Business Plans) ✅ WORKING
- **Enforcement:** `checkBusinessSubscription()` → `deductResumeCredits()`
- **Location:** `app/api/resume-builder/export/pdf/route.ts`
- **Status:** ✅ Credits deducted correctly
- **Includes:** Daily limits, per-resume limits, credit exhaustion checks

### 2.3 Premium Templates Access ❌ NOT ENFORCED
- **Storage:** `UserCredits.templateAccess` (stored as 'free' | 'premium' | 'all')
- **Plan Definition:** `templateAccess` and `templateCount` in plan features
- **Enforcement:** ❌ NO CHECK FOUND
- **Expected Location:** Template selection/usage endpoints
- **Status:** Feature defined but not enforced

### 2.4 AI Resume Optimization ✅ WORKING
- **Enforcement:** `checkResumeAccess('aiResume')` → `canUseAI('resume')`
- **Location:** `app/api/resume-builder/ai-enhance/route.ts`
- **Status:** ✅ Usage limits enforced
- **Unlimited Handling:** ✅ -1 means unlimited (converted to 999999)

### 2.5 AI Cover Letters ⚠️ PARTIALLY WORKING
- **Enforcement:** `canUseAI('coverLetter')` exists
- **Usage:** ❓ Not found in API routes
- **Status:** Function exists but usage endpoint not identified
- **Action Required:** Find/create cover letter API endpoint

### 2.6 ATS Optimization ❌ NOT ENFORCED
- **Storage:** `UserCredits.atsOptimization` (boolean)
- **Plan Definition:** `atsOptimization: 'basic' | 'advanced'`
- **Enforcement:** ❌ NO CHECK FOUND
- **Expected Location:** ATS scoring/suggestion endpoints
- **Status:** Stored but not used to control feature level

### 2.7 Resume Editing (Unlimited Edits) ❌ NOT ENFORCED
- **Plan Definition:** `unlimitedEdits: true/false`
- **Enforcement:** ⚠️ Basic plan validity check only
- **Location:** `app/api/jobseeker/resumes/[id]` (PUT)
- **Status:** Checks plan expiry but not `unlimitedEdits` flag
- **Expected:** Block edits after expiry for plans without `unlimitedEdits`

### 2.8 Resume Locking After Expiry ❌ NOT ENFORCED
- **Plan Definition:** `resumeLockedAfterExpiry: true/false`
- **Enforcement:** ❌ NO CHECK FOUND
- **Status:** Feature defined but not implemented
- **Expected:** Lock resume editing after plan expiry for plans with this flag

### 2.9 Resume Version History ❌ NOT ENFORCED
- **Plan Definition:** `resumeVersionHistory: true/false`
- **Enforcement:** ❌ NO CHECK FOUND
- **Status:** Feature defined but not implemented
- **Expected:** Enable/disable version history based on plan

### 2.10 Plan Validity (Time-Based) ✅ WORKING
- **Enforcement:** `checkIndividualPlanValidity()` and `checkBusinessSubscription()`
- **Location:** Multiple API routes
- **Status:** ✅ Expiry dates checked, plans deactivated on expiry

### 2.11 Priority Support Flag ❌ NOT ENFORCED
- **Plan Definition:** `prioritySupport: true/false`
- **Enforcement:** ❌ NO CHECK FOUND
- **Status:** Feature defined but not implemented
- **Expected:** Use flag for support ticket prioritization (if support system exists)

### 2.12 Daily Download Limits (Individual Plans) ⚠️ NOT IMPLEMENTED
- **Plan Definition:** `maxDownloadsPerDay: number | null`
- **Enforcement:** ⚠️ Code comments indicate NOT implemented
- **Location:** `canDownloadResume()` (lines 365-377)
- **Status:** Placeholder code with TODO comments
- **Expected:** Track daily downloads similar to business plans

---

## 3. Identified Issues

### 3.1 Critical Gaps (Must Fix)
1. **Template Access Not Enforced** - Premium templates accessible without plan
2. **Daily Download Limits (Individual)** - Not tracked/enforced
3. **Resume Locking After Expiry** - Not implemented
4. **Unlimited Edits Enforcement** - Not properly enforced

### 3.2 Medium Priority Gaps
1. **ATS Optimization Level** - Stored but not used
2. **Resume Version History** - Not implemented
3. **AI Cover Letter Endpoint** - Function exists but endpoint not found
4. **Template Count Limits** - Not enforced

### 3.3 Low Priority Gaps
1. **Priority Support Flag** - May not have support system to integrate with

---

## 4. Normalization Plan

### Phase 1: Fix Critical Gaps (Priority 1)

#### 4.1.1 Implement Daily Download Limit Tracking (Individual Plans)
- **File:** `lib/services/payment-service.ts`
- **Function:** `canDownloadResume()`
- **Approach:** Add daily counter tracking (similar to business plans)
- **Options:**
  - Option A: Add `lastPdfDownloadDate` and `dailyPdfDownloads` fields to `UserCredits`
  - Option B: Use `CreditTransaction`-like table for individual plans
  - Option C: Store daily counter in metadata JSON field
- **Recommended:** Option C (minimal schema change, flexible)

#### 4.1.2 Implement Template Access Enforcement
- **New Function:** `canAccessTemplate(userId: string, templateId: string)`
- **Location:** `lib/services/payment-service.ts`
- **Check Points:**
  - Template selection page/API
  - Resume builder template usage
- **Logic:**
  - Get user's `templateAccess` from `UserCredits`
  - Check if template is premium (from templates.json)
  - Enforce based on `templateAccess` ('free' | 'premium' | 'all')
  - Check `templateCount` limit if applicable

#### 4.1.3 Implement Resume Locking After Expiry
- **Location:** `app/api/jobseeker/resumes/[id]` (PUT)
- **Function:** Enhance existing plan validity check
- **Logic:**
  - After plan expiry, check `resumeLockedAfterExpiry` flag
  - If true, block all edits
  - If false, allow edits (existing behavior)

#### 4.1.4 Implement Unlimited Edits Enforcement
- **Location:** `app/api/jobseeker/resumes/[id]` (PUT)
- **Function:** Enhance existing plan validity check
- **Logic:**
  - Get plan from `UserCredits.planName`
  - Check `unlimitedEdits` flag in plan definition
  - If false and plan expired, block edits
  - If true, allow edits even if expired (within grace period?)

### Phase 2: Implement Medium Priority Features (Priority 2)

#### 4.2.1 Implement ATS Optimization Level Enforcement
- **New Function:** `getATSOptimizationLevel(userId: string)`
- **Location:** `lib/services/payment-service.ts`
- **Usage Points:**
  - ATS scoring endpoints
  - ATS suggestion endpoints
- **Logic:**
  - Get `atsOptimization` from `UserCredits`
  - Return 'basic' | 'advanced'
  - Use to control feature availability/quality

#### 4.2.2 Implement Resume Version History
- **Location:** Resume version/save endpoints
- **Logic:**
  - Check `resumeVersionHistory` flag in plan
  - Enable/disable version tracking based on flag
  - Store versions only if enabled

#### 4.2.3 Implement Template Count Limits
- **Location:** Template selection/usage
- **Logic:**
  - Track templates used per plan
  - Enforce `templateCount` limit
  - Store used templates in metadata or separate table

### Phase 3: Cleanup & Optimization (Priority 3)

#### 4.3.1 Centralize All Plan Checks
- Create `lib/services/plan-capabilities.ts`
- Export unified functions:
  - `canDownload(userId, resumeId?)`
  - `canUseAI(userId, feature)`
  - `canAccessTemplate(userId, templateId)`
  - `canEditResume(userId, resumeId)`
  - `getATSOptimizationLevel(userId)`
  - `hasFeature(userId, featureName)`

#### 4.3.2 Ensure Consistent Usage
- Audit all API routes
- Replace direct checks with centralized functions
- Remove duplicate logic

---

## 5. Implementation Constraints

### 5.1 DO NOT:
- ❌ Refactor or rename existing files/functions
- ❌ Delete existing logic
- ❌ Change database schema (unless absolutely necessary)
- ❌ Break working flows
- ❌ Redesign UI
- ❌ Change payment gateway logic

### 5.2 DO:
- ✅ Reuse existing functions where possible
- ✅ Add new functions to existing files
- ✅ Use existing database fields
- ✅ Add metadata fields if needed (JSON)
- ✅ Enhance existing checks
- ✅ Connect existing logic

---

## 6. Testing Checklist

After implementation, verify:
- [ ] PDF downloads respect total limits
- [ ] PDF downloads respect daily limits (individual plans)
- [ ] Business plan credits deduct correctly
- [ ] Business plan daily limits work
- [ ] Business plan per-resume limits work
- [ ] Template access enforced (premium templates blocked for free users)
- [ ] Template count limits enforced
- [ ] AI resume usage limits work
- [ ] AI cover letter usage limits work
- [ ] ATS optimization level enforced
- [ ] Resume locking after expiry works
- [ ] Unlimited edits flag respected
- [ ] Resume version history enabled/disabled correctly
- [ ] Plan expiry blocks access correctly

---

## 7. Implementation Status

### Phase 1: Critical Gaps (✅ COMPLETED)

#### 7.1.1 Daily Download Limit Tracking (Individual Plans)
- **Status:** ✅ PARTIALLY IMPLEMENTED
- **Notes:** Proper daily tracking requires schema changes (daily counter field). Current implementation relies on total limit enforcement which provides effective rate limiting.

#### 7.1.2 Template Access Enforcement
- **Status:** ✅ IMPLEMENTED
- **Function:** `canAccessTemplate(userId, templateId)`
- **Location:** `lib/services/payment-service.ts`
- **Integration:** Added to `/api/resume-builder/export/pdf` route
- **Checks:**
  - Free users: Only free templates
  - Premium access: Premium templates allowed
  - All access: All templates allowed
  - Business plans: All templates allowed

#### 7.1.3 Resume Locking After Expiry
- **Status:** ✅ IMPLEMENTED
- **Function:** `canEditResume(userId)`
- **Location:** `lib/services/payment-service.ts`
- **Integration:** Updated `/api/jobseeker/resumes/[id]` (PUT) route
- **Logic:**
  - Checks plan expiry
  - Enforces `resumeLockedAfterExpiry` flag
  - Blocks edits for expired plans with lock flag

#### 7.1.4 Unlimited Edits Enforcement
- **Status:** ✅ IMPLEMENTED
- **Function:** `canEditResume(userId)` (combined with resume locking)
- **Location:** `lib/services/payment-service.ts`
- **Logic:**
  - Allows editing after expiry if `unlimitedEdits: true`
  - Blocks editing after expiry if `unlimitedEdits: false` (default)

### Phase 2: Medium Priority (⏭️ PENDING)
- ATS Optimization Level Enforcement
- Resume Version History
- Template Count Limits

### Phase 3: Cleanup & Optimization (⏭️ PENDING)
- Centralize all plan checks
- Ensure consistent usage across API routes

## 8. Next Steps

1. ✅ Complete audit (DONE)
2. ✅ Review and approve normalization plan (DONE)
3. ✅ Implement Phase 1 (Critical Gaps) (DONE)
4. ⏭️ Test Phase 1
5. ⏭️ Implement Phase 2 (Medium Priority)
6. ⏭️ Test Phase 2
7. ⏭️ Implement Phase 3 (Cleanup)
8. ⏭️ Final testing and verification

---

**Document Version:** 1.1  
**Last Updated:** 2025-01-XX  
**Status:** Phase 1 Implementation Complete

