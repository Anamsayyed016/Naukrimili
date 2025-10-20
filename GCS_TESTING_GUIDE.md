# Google Cloud Storage - Testing Guide

## 📋 Complete Testing Checklist

This guide provides step-by-step instructions for testing the Google Cloud Storage integration in both local and production environments.

---

## 🏠 Local Development Testing

### Prerequisites

- Node.js 18+ installed
- Project dependencies installed (`npm install`)
- Environment variables configured
- (Optional) GCS service account key for local testing

### Step 1: Configure Environment

**Option A: Test with GCS (Recommended for full testing)**

```bash
# .env.local or .env
GCP_PROJECT_ID=naukrimili-474709
GCS_BUCKET_NAME=naukrimili
GCP_IDENTITY_POOL=naukrimili-job-portal
ENABLE_GCS_STORAGE=true
GCS_SIGNED_URL_EXPIRATION_MINUTES=60

# Optional: Service account key for local dev
# GCP_SERVICE_ACCOUNT_KEY=/path/to/service-account-key.json
```

**Option B: Test with Local Storage (Fallback testing)**

```bash
# .env.local
ENABLE_GCS_STORAGE=false
```

### Step 2: Start Development Server

```bash
npm run dev
```

Server should start on `http://localhost:3000`

### Step 3: Test GCS Connection

**Via Browser:**
1. Navigate to: `http://localhost:3000/api/storage/test-gcs`
2. You should see JSON response with connection status

**Via cURL:**
```bash
curl http://localhost:3000/api/storage/test-gcs
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Successfully connected to Google Cloud Storage with read/write permissions",
  "bucketName": "naukrimili",
  "projectId": "naukrimili-474709",
  "config": {
    "projectId": "naukrimili-474709",
    "bucketName": "naukrimili",
    "identityPool": "naukrimili-job-portal",
    "environment": "development",
    "enabled": true
  }
}
```

**If Connection Fails:**
- Check environment variables
- Verify service account key (if using)
- Ensure bucket exists and is accessible
- Check IAM permissions
- Review server console logs

### Step 4: Test Resume Upload Flow

#### 4.1 Login to Application
1. Navigate to `http://localhost:3000`
2. Log in or create an account
3. Select "Job Seeker" role

#### 4.2 Upload Resume via UI
1. Navigate to resume upload page
2. Select a test resume (PDF, DOC, DOCX, or TXT)
3. Click "Upload Resume"
4. Wait for processing

**Expected Behavior:**
- File uploads successfully
- AI parsing extracts information
- Success message appears
- Resume appears in your profile

#### 4.3 Upload Resume via API
```bash
curl -X POST http://localhost:3000/api/resumes/ultimate-upload \
  -H "Content-Type: multipart/form-data" \
  -H "Cookie: your-session-cookie" \
  -F "file=@test-resume.pdf"
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Resume uploaded and parsed successfully using AI",
  "resumeId": "clxxxxx",
  "storage": {
    "type": "gcs",
    "secure": true,
    "cloud": true
  },
  "aiSuccess": true,
  "atsScore": 90
}
```

### Step 5: Verify File in GCS

**Via Google Cloud Console:**
1. Go to `https://console.cloud.google.com/storage/browser/naukrimili`
2. Navigate to `resumes/` folder
3. Verify your uploaded file appears
4. Check file metadata

**Via gcloud CLI:**
```bash
gsutil ls gs://naukrimili/resumes/
```

### Step 6: Test File Download

1. Get a resume file URL from the database
2. Try accessing the signed URL
3. Verify file downloads correctly

**Via cURL:**
```bash
curl -o downloaded-resume.pdf "SIGNED_URL_HERE"
```

### Step 7: Test Fallback Mechanism

1. **Disable GCS:**
   ```bash
   # In .env.local
   ENABLE_GCS_STORAGE=false
   ```

2. **Restart server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

3. **Upload another resume**

4. **Verify:**
   - Upload still succeeds
   - File stored locally in `uploads/resumes/`
   - Storage type in response is `"local"`

5. **Re-enable GCS:**
   ```bash
   ENABLE_GCS_STORAGE=true
   ```

---

## 🚀 Production Testing

### Prerequisites

- Production server access (SSH)
- Environment variables configured on server
- Workload Identity Federation configured
- PM2 or similar process manager running

### Step 1: Verify Environment Variables

```bash
# SSH into production server
ssh user@your-server.com

# Check environment variables
echo $GCP_PROJECT_ID
echo $GCS_BUCKET_NAME
echo $ENABLE_GCS_STORAGE
```

**Required Variables:**
```bash
export GCP_PROJECT_ID=naukrimili-474709
export GCS_BUCKET_NAME=naukrimili
export GCP_IDENTITY_POOL=naukrimili-job-portal
export ENABLE_GCS_STORAGE=true
export GCS_SIGNED_URL_EXPIRATION_MINUTES=60
```

### Step 2: Deploy Latest Code

```bash
# On production server
cd /path/to/jobportal

# Pull latest code
git pull origin main

# Install dependencies
npm ci --production

# Build application
npm run build

# Restart application
pm2 restart jobportal

# Check logs
pm2 logs jobportal --lines 50
```

### Step 3: Test GCS Connection

```bash
curl https://naukrimili.com/api/storage/test-gcs
```

**Expected Response:** Same as local testing, but with `"environment": "production"`

### Step 4: Test Resume Upload

#### Via Production UI
1. Navigate to `https://naukrimili.com`
2. Log in to your account
3. Go to resume upload page
4. Upload a test resume
5. Verify success

#### Via API
```bash
curl -X POST https://naukrimili.com/api/resumes/ultimate-upload \
  -H "Content-Type: multipart/form-data" \
  -H "Cookie: session-cookie" \
  -F "file=@test-resume.pdf"
```

### Step 5: Monitor Logs

```bash
# Real-time logs
pm2 logs jobportal

# Search for GCS-related logs
pm2 logs jobportal | grep GCS

# Check for errors
pm2 logs jobportal | grep ERROR
```

**Look for these log patterns:**
```
✅ [GCS] Storage client initialized
✅ [GCS] Connected to bucket: naukrimili
📤 [GCS] Starting upload: resume.pdf
✅ [GCS] Upload successful: resumes/xxxxx_resume.pdf
```

### Step 6: Verify Files in Production Bucket

```bash
# Using gcloud CLI (if installed)
gcloud auth login
gsutil ls gs://naukrimili/resumes/

# Count files
gsutil ls gs://naukrimili/resumes/ | wc -l
```

### Step 7: Performance Testing

#### Load Test (Optional)
```bash
# Using Apache Bench
ab -n 100 -c 10 -T 'multipart/form-data' \
   https://naukrimili.com/api/resumes/ultimate-upload
```

#### Monitor Metrics
- Response times
- Upload success rate
- Server CPU/memory usage
- GCS API call latency

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### Issue 1: "Connection to GCS failed"

**Symptoms:**
- Test endpoint returns error
- Uploads fail
- Logs show connection errors

**Solutions:**
```bash
# 1. Check environment variables
echo $GCP_PROJECT_ID
echo $GCS_BUCKET_NAME

# 2. Verify Workload Identity
gcloud iam workload-identity-pools list \
  --location=global

# 3. Test bucket access manually
gsutil ls gs://naukrimili/

# 4. Check IAM permissions
gcloud projects get-iam-policy naukrimili-474709

# 5. Fallback to local storage temporarily
export ENABLE_GCS_STORAGE=false
pm2 restart jobportal
```

#### Issue 2: "Upload fails with 403 Forbidden"

**Cause:** Missing IAM permissions

**Solution:**
```bash
# Grant necessary roles to service account
gcloud projects add-iam-policy-binding naukrimili-474709 \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT" \
  --role="roles/storage.objectCreator"

gcloud projects add-iam-policy-binding naukrimili-474709 \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT" \
  --role="roles/storage.objectViewer"
```

#### Issue 3: "Signed URL generation fails"

**Cause:** Missing `signBlob` permission

**Solution:**
```bash
gcloud projects add-iam-policy-binding naukrimili-474709 \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT" \
  --role="roles/iam.serviceAccountTokenCreator"
```

#### Issue 4: Files upload but can't be accessed

**Symptoms:**
- Upload succeeds
- File exists in bucket
- Signed URLs don't work

**Solutions:**
1. Check URL expiration time
2. Verify file permissions
3. Ensure signed URL includes all required parameters
4. Test with fresh signed URL

```typescript
// Generate fresh URL
import { getSignedUrl } from '@/lib/storage/google-cloud-storage';
const newUrl = await getSignedUrl('resumes/file.pdf', 60);
```

#### Issue 5: Automatic fallback not working

**Symptoms:**
- GCS fails but local storage doesn't kick in
- Application crashes on upload failure

**Solutions:**
1. Check `ENABLE_GCS_STORAGE` setting
2. Verify local `uploads/resumes/` directory exists and is writable
3. Review error logs for specific failures

```bash
# Create uploads directory
mkdir -p uploads/resumes
chmod 755 uploads/resumes
```

---

## 📊 Testing Scenarios Matrix

| Scenario | GCS Enabled | Expected Result | Storage Type |
|----------|-------------|-----------------|--------------|
| Normal upload | ✅ Yes | Success | GCS |
| GCS unavailable | ✅ Yes | Success (fallback) | Local |
| Disabled GCS | ❌ No | Success | Local |
| Invalid file type | ✅ Yes | Error: Invalid type | N/A |
| File too large | ✅ Yes | Error: Size exceeded | N/A |
| No authentication | ✅ Yes | Error: Auth required | N/A |

---

## ✅ Production Deployment Checklist

Before enabling GCS in production:

- [ ] Environment variables set correctly
- [ ] Workload Identity Federation configured
- [ ] IAM roles assigned properly
- [ ] Test endpoint returns success
- [ ] Sample resume upload works
- [ ] Files appear in GCS bucket
- [ ] Signed URLs work correctly
- [ ] Fallback mechanism tested
- [ ] Monitoring and logging active
- [ ] Rollback procedure documented
- [ ] Team notified of changes

---

## 📈 Performance Benchmarks

### Expected Performance

| Metric | Local Storage | GCS |
|--------|--------------|-----|
| Upload Time (1MB) | ~100ms | ~300ms |
| Upload Time (10MB) | ~500ms | ~2s |
| URL Generation | Instant | ~50ms |
| Download Time | Fast | Depends on location |

### Optimization Tips

1. **Enable compression** for large files
2. **Use regional buckets** for faster access
3. **Implement caching** for signed URLs
4. **Monitor API quotas** to avoid limits
5. **Use lifecycle policies** to archive old files

---

## 🔐 Security Testing

### Security Checklist

- [ ] Resumes not publicly accessible
- [ ] Signed URLs expire correctly
- [ ] No credentials in logs
- [ ] No service account keys in code
- [ ] Workload Identity working
- [ ] HTTPS enforced
- [ ] File validation working
- [ ] Size limits enforced
- [ ] User authentication required

### Security Tests

```bash
# 1. Try accessing file without signed URL (should fail)
curl https://storage.googleapis.com/naukrimili/resumes/file.pdf
# Expected: 403 Forbidden

# 2. Try uploading unauthorized file type (should fail)
curl -X POST http://localhost:3000/api/resumes/ultimate-upload \
  -F "file=@malicious.exe"
# Expected: Error: Invalid file type

# 3. Try uploading oversized file (should fail)
curl -X POST http://localhost:3000/api/resumes/ultimate-upload \
  -F "file=@large-file-11mb.pdf"
# Expected: Error: File size exceeded

# 4. Try accessing without authentication (should fail)
curl http://localhost:3000/api/resumes/ultimate-upload
# Expected: 401 Unauthorized
```

---

## 📝 Test Report Template

Use this template to document your testing:

```markdown
# GCS Integration Test Report

**Date:** [Date]
**Tester:** [Name]
**Environment:** [Local/Production]

## Connection Test
- [ ] Test endpoint accessible
- [ ] Connection successful
- [ ] Bucket accessible
- [ ] Permissions verified

## Upload Test
- [ ] File upload via UI works
- [ ] File upload via API works
- [ ] File appears in GCS
- [ ] Correct metadata stored

## Download Test
- [ ] Signed URL generated
- [ ] File accessible via URL
- [ ] URL expires correctly

## Fallback Test
- [ ] Local storage fallback works
- [ ] No errors on GCS failure
- [ ] System continues operating

## Performance
- Average upload time: [time]
- Average URL generation: [time]
- Success rate: [percentage]

## Issues Found
[List any issues]

## Sign-off
- [ ] All tests passed
- [ ] Ready for production
- [ ] Documentation updated
```

---

## 🆘 Emergency Rollback

If critical issues occur in production:

### Immediate Rollback (< 1 minute)

```bash
# SSH to server
ssh user@production-server

# Disable GCS immediately
export ENABLE_GCS_STORAGE=false

# Restart application
pm2 restart jobportal

# Verify application is working
curl https://naukrimili.com/api/storage/test-gcs
```

### Full Rollback (5-10 minutes)

```bash
# 1. Disable GCS
export ENABLE_GCS_STORAGE=false

# 2. Revert code if needed
git checkout main~1  # or specific commit
npm ci --production
npm run build

# 3. Restart
pm2 restart jobportal

# 4. Verify
pm2 logs jobportal
curl https://naukrimili.com

# 5. Notify team
echo "GCS disabled, using local storage"
```

---

## 📞 Support Contacts

- **GCS Integration**: Check this guide first
- **Google Cloud Console**: https://console.cloud.google.com
- **Server Logs**: `pm2 logs jobportal`
- **Documentation**: See `GOOGLE_CLOUD_STORAGE_INTEGRATION.md`

---

**Last Updated**: October 20, 2025  
**Version**: 1.0.0  
**Status**: ✅ Ready for Testing

