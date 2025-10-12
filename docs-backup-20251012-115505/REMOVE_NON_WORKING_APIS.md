# 🔧 Remove Non-Working APIs Plan

## APIs to Keep (Working)
- ✅ **Adzuna** - Working with API key
- ✅ **Indeed** - Working with RapidAPI key
- ✅ **ZipRecruiter** - Working with RapidAPI key

## APIs to Remove (Not Working)
- ❌ **JSearch** - Rate limited, no proper key
- ❌ **Google Jobs** - Needs subscription
- ❌ **Jooble** - No API key

## Files to Update

### 1. lib/jobs/providers.ts
- Remove fetchFromJSearch()
- Remove fetchFromGoogleJobs()
- Remove fetchFromJooble()
- Update health check to only include 3 APIs

### 2. lib/jobs/fetchJobs.ts
- Remove JSearch fetch
- Remove Google Jobs fetch
- Remove Jooble fetch
- Keep only Adzuna, Indeed, ZipRecruiter

### 3. lib/jobs/real-job-search.ts
- Remove non-working API imports
- Remove from apiPromises array

### 4. lib/jobs/optimized-search.ts
- Remove non-working API imports
- Remove from apiPromises array

### 5. lib/jobs/unlimited-search.ts
- Remove non-working API imports
- Remove from apiPromises array

### 6. lib/jobs/daily-scheduler.ts
- Remove imports for non-working APIs
- Remove from config
- Remove fetch calls

### 7. lib/jobs/enhanced-scraper.ts
- Remove switch cases
- Remove private methods

### 8. app/api/jobs/import-live/route.ts
- Remove from Promise.allSettled
- Update providers response

### 9. app/api/debug/health/route.ts
- Update to only check 3 APIs

## Strategy
- Remove carefully, one file at a time
- Test after each removal
- Keep all existing functionality intact
- No breaking changes
