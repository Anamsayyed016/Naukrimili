# 📋 Job Fetching API - Complete Details

**Status:** ✅ **IMPLEMENTED** but ❌ **NOT WORKING in Production**

---

## 🔍 **Overview**

Your codebase has a comprehensive job fetching API system that integrates multiple external job providers. The system is fully implemented but not working in production due to missing environment variables.

---

## 🏗️ **Architecture**

### **Main API Endpoints:**

1. **`/api/jobs/unified`** - Primary unified API
   - Location: `app/api/jobs/unified/route.ts`
   - Combines database jobs + external APIs
   - Supports caching (5-minute cache)

2. **`/api/jobs/unlimited`** - Unlimited job search
   - Location: `app/api/jobs/unlimited/route.ts`
   - Enhanced version with unlimited limits
   - Smart duplicate removal

3. **`/api/jobs`** - Basic database-only API
   - Location: `app/api/jobs/route.ts`
   - Only fetches from database (no external APIs)

### **External Job Providers Integrated:**

| Provider | Function | API Keys Required | Status |
|----------|----------|-------------------|--------|
| **Adzuna** | `fetchFromAdzuna()` | `ADZUNA_APP_ID`<br>`ADZUNA_APP_KEY` | ⚠️ Keys hardcoded in ecosystem.config.cjs |
| **JSearch** | `fetchFromJSearch()` | `RAPIDAPI_KEY` | ⚠️ Key hardcoded in ecosystem.config.cjs |
| **Google Jobs** | `fetchFromGoogleJobs()` | `RAPIDAPI_KEY` | ⚠️ Key hardcoded in ecosystem.config.cjs |
| **Jooble** | `fetchFromJooble()` | `JOOBLE_API_KEY` | ⚠️ Key hardcoded in ecosystem.config.cjs |

---

## 📁 **File Structure**

```
lib/jobs/
├── providers.ts              # Main external API fetchers (Adzuna, JSearch, Google, Jooble)
├── dynamic-providers.ts      # Additional dynamic job fetching
├── job-id-validator.ts       # Job validation
└── serverFetchJobs.ts        # Server-side job fetching helper

app/api/jobs/
├── unified/route.ts          # Unified API (database + external)
├── unlimited/route.ts        # Unlimited search API
├── route.ts                  # Basic database-only API
├── test-external/route.ts    # Test endpoint for external APIs
└── test-connection/route.ts  # API connection tester
```

---

## 🔑 **API Keys Configuration**

### **Required Environment Variables:**

```env
# Adzuna (Job Aggregator)
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key

# RapidAPI (For JSearch & Google Jobs)
RAPIDAPI_KEY=your_rapidapi_key

# Jooble (Job Search Engine)
JOOBLE_API_KEY=your_jooble_api_key
```

### **Current Configuration Status:**

#### **✅ Hardcoded in `ecosystem.config.cjs`:**
```javascript
env_production: {
  RAPIDAPI_KEY: "6817e0f996msh7e837aee4175f0cp1ab059jsn315ea7f0f041",
  ADZUNA_APP_ID: "5e478efa",
  ADZUNA_APP_KEY: "f216fb45f9e324783b04fd877fc0f4f7",
  JOOBLE_API_KEY: "10fd38f3-17ed-4718-8471-504f472b410a",
}
```

#### **❌ NOT in GitHub Actions Secrets:**
- The deployment workflow (`.github/workflows/deploy.yml`) does **NOT** pass these API keys to production
- Keys are hardcoded in `ecosystem.config.cjs`, but PM2 may not load them correctly
- Environment variables need to be set at runtime

---

## 🔄 **How It Works**

### **1. Job Fetching Flow:**

```
User Request
    ↓
/api/jobs/unified?query=developer&location=Mumbai
    ↓
┌─────────────────────────────────────┐
│  Check includeExternal parameter    │
│  (default: true)                    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Fetch Database Jobs                │
│  (from PostgreSQL)                  │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Fetch External Jobs (if enabled)   │
│  ├─ Adzuna                          │
│  ├─ JSearch (RapidAPI)              │
│  ├─ Google Jobs (RapidAPI)          │
│  └─ Jooble                          │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Merge & Deduplicate Jobs           │
│  (Remove duplicates, prioritize)    │
└─────────────────────────────────────┘
    ↓
Return Combined Results
```

### **2. External API Fetchers:**

#### **Adzuna API** (`fetchFromAdzuna`)
- **URL:** `https://api.adzuna.com/v1/api/jobs/{country}/search/{page}`
- **Params:** `app_id`, `app_key`, `what`, `where`, `results_per_page`
- **Returns:** Up to 50 jobs per page
- **Countries Supported:** IN, US, GB, AU, etc.
- **Location:** `lib/jobs/providers.ts:44-116`

#### **JSearch API** (`fetchFromJSearch`)
- **URL:** `https://jsearch.p.rapidapi.com/search`
- **Headers:** `x-rapidapi-key`, `x-rapidapi-host`
- **Returns:** Job listings from multiple sources
- **Location:** `lib/jobs/providers.ts:122-169`

#### **Google Jobs API** (`fetchFromGoogleJobs`)
- **URL:** `https://google-jobs-api.p.rapidapi.com/google-jobs/job-type`
- **Uses:** RapidAPI (same key as JSearch)
- **Location:** `lib/jobs/providers.ts:174-229`

#### **Jooble API** (`fetchFromJooble`)
- **URL:** `https://jooble.org/api/{apiKey}`
- **Method:** POST
- **Returns:** Real-time job listings
- **Location:** `lib/jobs/providers.ts:235-326`

---

## 🚨 **Why It's Not Working in Production**

### **Problem 1: API Keys Not Passed to Production**

**Issue:**
- API keys are hardcoded in `ecosystem.config.cjs`
- But PM2 may not load environment variables correctly
- GitHub Actions workflow doesn't export these keys during deployment

**Evidence:**
```javascript
// ecosystem.config.cjs (line 102-105)
env_production: {
  RAPIDAPI_KEY: "6817e0f996msh7e837aee4175f0cp1ab059jsn315ea7f0f041",
  ADZUNA_APP_ID: "5e478efa",
  ADZUNA_APP_KEY: "f216fb45f9e324783b04fd877fc0f4f7",
  JOOBLE_API_KEY: "10fd38f3-17ed-4718-8471-504f472b410a",
}
```

**Missing in Deployment:**
- `.github/workflows/deploy.yml` does NOT export these variables
- No `export ADZUNA_APP_ID=...` in SSH deployment step
- Environment variables not set in production server

### **Problem 2: API Key Validation**

**Location:** `lib/jobs/providers.ts:50-56`
```typescript
const app_id = process.env.ADZUNA_APP_ID;
const app_key = process.env.ADZUNA_APP_KEY;

if (!app_id || !app_key) {
  console.warn('External job API keys not configured, skipping external job fetch');
  return [] as NormalizedJob[];  // Returns empty array
}
```

**Result:**
- If keys are missing, functions return empty arrays
- No errors thrown (fails silently)
- Production shows no external jobs

### **Problem 3: Error Handling**

**Location:** `app/api/jobs/unified/route.ts:396-467`
```typescript
if (includeExternal !== false) {
  try {
    // Fetch external jobs...
    const adzunaJobs = await getCachedOrFetch(...);
    // ...
  } catch (error: any) {
    console.error('❌ External APIs error:', error.message);
    // Continue execution even if external APIs fail
  }
}
```

**Result:**
- Errors are caught and logged
- API continues without external jobs
- No indication to user that external APIs failed

---

## 📊 **Current Implementation Details**

### **Caching System:**

**Location:** `app/api/jobs/unified/route.ts:7-30`
- **Cache Duration:** 5 minutes
- **Storage:** In-memory Map
- **Key Format:** `external-{query}-{location}-{country}-{page}-{provider}`

### **Duplicate Removal:**

**Location:** `app/api/jobs/unlimited/route.ts:17-93`
- **Strategy:** Title + Company + Location matching
- **Priority:** employer/manual > database > external
- **Result:** Removes duplicates while preserving best source

### **Job Normalization:**

**Location:** `lib/jobs/providers.ts`
- All external jobs normalized to `NormalizedJob` type
- Consistent structure across all providers
- Skills extraction using `SkillsExtractionService`

---

## 🧪 **Testing Endpoints**

### **Test External APIs:**
```
GET /api/jobs/test-external
```
- Tests all external providers
- Shows which APIs are working
- Returns job counts per provider

### **Test API Connection:**
```
GET /api/jobs/test-connection
```
- Checks environment variables
- Tests API connectivity
- Returns health status

---

## 🔍 **Key Code Locations**

### **Main Fetching Logic:**
1. **Unified API:** `app/api/jobs/unified/route.ts:395-468`
2. **Unlimited API:** `app/api/jobs/unlimited/route.ts:351-531`
3. **Provider Functions:** `lib/jobs/providers.ts`

### **API Key Checks:**
1. **Adzuna:** `lib/jobs/providers.ts:50-56`
2. **JSearch:** `lib/jobs/providers.ts:123-128`
3. **Google Jobs:** `lib/jobs/providers.ts:179-184`
4. **Jooble:** `lib/jobs/providers.ts:241-246`

### **Deployment Configuration:**
1. **ecosystem.config.cjs:** Lines 102-105
2. **deploy.yml:** Missing API key exports

---

## ✅ **Summary**

**What's Implemented:**
- ✅ Complete external API integration (Adzuna, JSearch, Google Jobs, Jooble)
- ✅ Unified job fetching API
- ✅ Caching system (5-minute cache)
- ✅ Duplicate removal logic
- ✅ Error handling and fallbacks
- ✅ Job normalization

**What's Missing:**
- ❌ API keys not passed to production via deployment workflow
- ❌ Environment variables not exported during SSH deployment
- ❌ No verification that keys are loaded in production
- ❌ Silent failures when keys are missing

**Root Cause:**
The API fetching system is fully implemented, but **API keys are not being passed to the production server** during deployment. The keys exist in `ecosystem.config.cjs`, but they need to be:
1. Exported in the GitHub Actions workflow
2. Set as environment variables on the production server
3. Verified to be loaded by PM2

**Next Steps to Fix:**
1. Add API keys to GitHub Secrets
2. Export them in `.github/workflows/deploy.yml`
3. Ensure PM2 loads them from environment
4. Add verification endpoint to check if keys are loaded

---

## 📝 **API Endpoints Summary**

| Endpoint | Purpose | External APIs | Database |
|----------|---------|---------------|----------|
| `/api/jobs/unified` | Unified search | ✅ Yes | ✅ Yes |
| `/api/jobs/unlimited` | Unlimited search | ✅ Yes | ✅ Yes |
| `/api/jobs` | Basic search | ❌ No | ✅ Yes |
| `/api/jobs/test-external` | Test providers | ✅ Yes | ❌ No |
| `/api/jobs/test-connection` | Health check | ✅ Yes | ❌ No |
