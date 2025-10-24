# Google Cloud Storage Integration - Complete Documentation

## 📋 Overview

This document provides comprehensive information about the Google Cloud Storage (GCS) integration implemented in the NaukriMili Job Portal application.

### ✨ Key Features

- **Keyless Authentication** using Workload Identity Federation
- **Secure File Storage** for resumes and documents
- **Automatic Fallback** to local storage if GCS is unavailable
- **Signed URLs** for secure, temporary file access
- **Comprehensive Error Handling** with retry logic
- **Multi-Environment Support** (local development & production)
- **Zero Breaking Changes** - existing functionality remains intact

---

## 🏗️ Architecture

### Storage Flow

```
User Upload → API Route → Resume Storage Service → [GCS / Local Storage] → Database
                                    ↓
                          Automatic Detection & Fallback
```

### Components

1. **`lib/storage/google-cloud-storage.ts`** - Core GCS integration
   - Connection management
   - Upload/download/delete operations
   - Signed URL generation
   - File management utilities

2. **`lib/storage/resume-storage.ts`** - Resume-specific storage wrapper
   - File validation
   - Automatic GCS/local storage selection
   - Metadata management
   - Fallback handling

3. **`app/api/resumes/ultimate-upload/route.ts`** - Enhanced upload endpoint
   - Integrated with new storage service
   - Maintains backward compatibility
   - Returns storage metadata

4. **`app/api/storage/test-gcs/route.ts`** - Connection test endpoint
   - Validates GCS configuration
   - Tests read/write permissions
   - Returns connection status

---

## 🔐 Authentication: Workload Identity Federation

### What is Workload Identity Federation?

Workload Identity Federation allows your application to access Google Cloud resources **without storing service account keys**. This is the most secure authentication method for cloud applications.

### Your Configuration

- **Project ID**: `naukrimili-474709`
- **Bucket Name**: `naukrimili`
- **Identity Pool**: `naukrimili-job-portal`
- **Principal**: `principalSet://iam.googleapis.com/projects/248670675129/locations/global/workloadIdentityPools/naukrimili-job-portal/attribute.subject/*`

### How It Works

1. **In Production**: The application automatically authenticates using the Workload Identity bound to the service
2. **In Development**: Optionally use a service account key file (not recommended for production)
3. **Zero Keys in Code**: No credentials stored in environment variables or code

---

## ⚙️ Environment Configuration

### Required Environment Variables

Add these to your `.env` or production environment:

```env
# Google Cloud Storage Configuration
GCP_PROJECT_ID=naukrimili-474709
GCS_BUCKET_NAME=naukrimili
GCP_IDENTITY_POOL=naukrimili-job-portal

# Storage Feature Flags
ENABLE_GCS_STORAGE=true
GCS_MAKE_RESUMES_PUBLIC=false
GCS_SIGNED_URL_EXPIRATION_MINUTES=60
```

### Optional (Development Only)

```env
# For local development only - DO NOT USE IN PRODUCTION
GCP_SERVICE_ACCOUNT_KEY=/path/to/service-account-key.json
```

⚠️ **Security Note**: Never commit service account key files to version control!

---

## 🚀 Usage

### Basic File Upload

```typescript
import { uploadResume } from '@/lib/storage/resume-storage';

const buffer = Buffer.from(fileData);
const result = await uploadResume(
  buffer,
  'resume.pdf',
  'application/pdf',
  buffer.length,
  userId
);

if (result.success) {
  console.log('File URL:', result.fileUrl);
  console.log('Storage:', result.storage); // 'gcs' or 'local'
}
```

### Get Secure File URL

```typescript
import { getResumeUrl } from '@/lib/storage/resume-storage';

const url = await getResumeUrl(filePath, 'gcs');
// Returns a signed URL valid for 60 minutes (configurable)
```

### Delete File

```typescript
import { deleteResume } from '@/lib/storage/resume-storage';

const success = await deleteResume(filePath, 'gcs');
```

### Direct GCS Operations

```typescript
import {
  uploadFileToGCS,
  downloadFileFromGCS,
  deleteFileFromGCS,
  getSignedUrl,
  listFilesInGCS,
} from '@/lib/storage/google-cloud-storage';

// Upload with custom options
const result = await uploadFileToGCS(buffer, 'document.pdf', {
  folder: 'documents',
  metadata: { userId: '123' },
  makePublic: false,
  contentType: 'application/pdf',
});

// List files in a folder
const { files, nextPageToken } = await listFilesInGCS('resumes', 100);

// Generate signed URL (temporary access)
const url = await getSignedUrl('resumes/file.pdf', 30); // 30 minutes
```

---

## 🧪 Testing

### Test GCS Connection

**Via API:**
```bash
curl http://localhost:3000/api/storage/test-gcs
```

**Via Browser:**
Navigate to `http://localhost:3000/api/storage/test-gcs`

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
    "environment": "production",
    "enabled": true
  },
  "timestamp": "2025-10-20T12:00:00.000Z"
}
```

### Test Resume Upload Flow

```bash
# Test the ultimate resume upload endpoint
curl -X POST http://localhost:3000/api/resumes/ultimate-upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample-resume.pdf"
```

### Local Development Testing

1. **Without GCS** (uses local storage):
   ```env
   ENABLE_GCS_STORAGE=false
   ```

2. **With GCS** (uses cloud storage):
   ```env
   ENABLE_GCS_STORAGE=true
   GCP_SERVICE_ACCOUNT_KEY=/path/to/key.json  # Optional for local dev
   ```

---

## 🔄 Automatic Fallback

The system automatically falls back to local storage in these scenarios:

1. `ENABLE_GCS_STORAGE=false` in environment
2. GCS connection fails
3. GCS upload fails
4. Missing GCS credentials

**Fallback behavior:**
- Seamlessly switches to local filesystem storage
- No errors thrown to the user
- Logs warning messages for debugging
- Application continues to function normally

---

## 📊 Storage Metadata

Files uploaded through the system include the following metadata:

```typescript
interface ResumeMetadata {
  fileName: string;           // Generated filename
  fileUrl: string;            // Accessible URL (signed URL for GCS)
  fileSize: number;           // File size in bytes
  storage: 'gcs' | 'local';   // Storage type
  gcsPath?: string;           // Full GCS path (if GCS)
}
```

This metadata is stored in the database `Resume` table's `parsedData` field.

---

## 🛡️ Security Best Practices

### ✅ DO

- Use Workload Identity Federation in production
- Enable `ENABLE_GCS_STORAGE=true` for production
- Keep `GCS_MAKE_RESUMES_PUBLIC=false` (resumes are private)
- Use signed URLs for temporary access
- Set appropriate URL expiration times
- Monitor access logs

### ❌ DON'T

- Never commit service account keys to version control
- Never store keys in environment variables in production
- Don't make resumes publicly accessible
- Don't hardcode credentials in code
- Don't share signed URLs publicly

---

## 🔧 Troubleshooting

### Connection Errors

**Problem**: "Failed to connect to Google Cloud Storage"

**Solutions**:
1. Verify Workload Identity is configured correctly
2. Check environment variables are set
3. Ensure the bucket exists and is accessible
4. Test connection with `/api/storage/test-gcs`
5. Check application has necessary IAM permissions:
   - `storage.objects.create`
   - `storage.objects.get`
   - `storage.objects.delete`

### Upload Failures

**Problem**: "Upload failed" or files not appearing

**Solutions**:
1. Check file size (max 10MB)
2. Verify file type (PDF, DOC, DOCX, TXT)
3. Check bucket permissions
4. Review server logs for detailed errors
5. Test with local storage first (`ENABLE_GCS_STORAGE=false`)

### Signed URL Errors

**Problem**: "Failed to generate signed URL"

**Solutions**:
1. Ensure file exists in GCS
2. Check IAM permissions include `storage.objects.get`
3. Verify service account has `signBlob` permission
4. Try regenerating the URL

---

## 📦 Deployment

### Production Deployment Steps

1. **Set Environment Variables** on production server:
   ```bash
   export GCP_PROJECT_ID=naukrimili-474709
   export GCS_BUCKET_NAME=naukrimili
   export GCP_IDENTITY_POOL=naukrimili-job-portal
   export ENABLE_GCS_STORAGE=true
   export GCS_SIGNED_URL_EXPIRATION_MINUTES=60
   ```

2. **Configure Workload Identity** (if not already done):
   - Bind service account to Workload Identity Pool
   - Grant necessary IAM roles
   - Verify identity binding

3. **Deploy Application**:
   ```bash
   npm run build
   pm2 restart jobportal
   ```

4. **Test GCS Connection**:
   ```bash
   curl https://naukrimili.com/api/storage/test-gcs
   ```

5. **Test Resume Upload**:
   - Log in to application
   - Navigate to resume upload
   - Upload a test resume
   - Verify file appears in GCS bucket

### Rollback Procedure

If you encounter issues, immediately roll back:

1. **Disable GCS**:
   ```bash
   export ENABLE_GCS_STORAGE=false
   pm2 restart jobportal
   ```

2. **System will automatically use local storage**

3. **No data loss** - existing files remain accessible

4. **Debug and fix** - check logs, test connection, verify configuration

5. **Re-enable when fixed**:
   ```bash
   export ENABLE_GCS_STORAGE=true
   pm2 restart jobportal
   ```

---

## 📈 Monitoring

### Key Metrics to Monitor

- **Upload success rate**: Track successful vs failed uploads
- **Storage type distribution**: Ratio of GCS vs local storage
- **URL expiration**: Monitor signed URL access patterns
- **File sizes**: Track storage usage
- **Error rates**: Monitor GCS-related errors

### Logging

The system provides detailed logs:

```
✅ [GCS] Storage client initialized
✅ [GCS] Connected to bucket: naukrimili
📤 [GCS] Starting upload: resume.pdf
✅ [GCS] Upload successful: resumes/1729425600000_resume.pdf
🔗 [GCS] Generated signed URL for: resumes/1729425600000_resume.pdf
```

---

## 🔗 Related Files

- `lib/storage/google-cloud-storage.ts` - Core GCS service
- `lib/storage/resume-storage.ts` - Resume storage wrapper
- `app/api/resumes/ultimate-upload/route.ts` - Upload endpoint
- `app/api/storage/test-gcs/route.ts` - Test endpoint
- `env.template` - Environment configuration template

---

## 📞 Support

For issues or questions:

1. Check this documentation first
2. Review server logs for detailed error messages
3. Test with `/api/storage/test-gcs` endpoint
4. Check Google Cloud Console for bucket access
5. Verify Workload Identity configuration

---

## ✅ Integration Checklist

- [x] Install `@google-cloud/storage` package
- [x] Create core GCS service module
- [x] Create resume storage wrapper
- [x] Update resume upload endpoint
- [x] Add environment configuration
- [x] Create test API endpoint
- [x] Add automatic fallback mechanism
- [x] Implement signed URL generation
- [x] Add comprehensive error handling
- [x] Create documentation
- [x] Maintain backward compatibility
- [ ] Deploy to production
- [ ] Test in production environment
- [ ] Monitor performance and errors

---

## 📝 Version History

- **v1.0.0** (2025-10-20): Initial GCS integration
  - Workload Identity Federation support
  - Automatic fallback to local storage
  - Resume upload integration
  - Test endpoints and documentation

---

**Last Updated**: October 20, 2025  
**Integration Status**: ✅ Complete - Ready for Production Testing

