# Upload Error Troubleshooting Guide

## Issue Description
The resume upload feature is showing "Upload failed. Please try again." error.

## Root Cause Analysis

Based on the code analysis, the issue could be caused by several factors:

### 1. **Dependencies Issues**
- Missing or outdated `formidable` package
- Missing `@types/formidable` TypeScript definitions

### 2. **File System Issues**
- Upload directory not writable
- File path issues on Windows
- Permission problems

### 3. **Next.js Configuration Issues**
- Body parser not properly disabled
- API route configuration problems

### 4. **Frontend-Backend Communication Issues**
- CORS issues
- Request format problems
- Network connectivity

## Solutions Applied

### 1. **Enhanced Error Handling**
- Added detailed logging to upload API
- Improved error messages with specific error details
- Added HTTP status checks in frontend

### 2. **File System Validation**
- Added directory write permission checks
- Enhanced directory creation logic
- Added file access validation

### 3. **Request Processing Improvements**
- Added detailed form parsing logs
- Enhanced file validation
- Added MIME type checking

### 4. **Frontend Error Handling**
- Added HTTP status validation
- Enhanced error display
- Added detailed console logging

## Testing Steps

1. **Check if Next.js dev server is running:**
   ```bash
   npm run dev
   ```

2. **Check browser console for errors:**
   - Open browser DevTools
   - Go to Console tab
   - Look for any JavaScript errors

3. **Check server logs:**
   - Look at the terminal where Next.js is running
   - Check for any error messages during upload

4. **Test with a simple PDF file:**
   - Create a small PDF file (< 1MB)
   - Try uploading it
   - Check console logs

## Additional Fixes to Try

### 1. **Install/Reinstall Dependencies**
```bash
npm install formidable @types/formidable
```

### 2. **Check File Permissions**
```bash
# On Windows PowerShell
Get-Acl "E:\myprojects\jobportal\tmp\uploads"
```

### 3. **Clear Next.js Cache**
```bash
rm -rf .next
npm run dev
```

### 4. **Check Upload Directory**
```bash
# Ensure the directory exists and is writable
mkdir -p tmp/uploads
```

### 5. **Restart Development Server**
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## File Changes Made

1. **`pages/api/resumes/upload.ts`**
   - Added detailed logging
   - Enhanced error handling
   - Added directory permission checks
   - Improved file validation

2. **`components/resumeuploadmodal.tsx`**
   - Added HTTP status validation
   - Enhanced error display
   - Added detailed console logging
   - Improved error messages

## Expected Behavior

After applying these fixes:
1. Upload should work with PDF, DOC, and DOCX files
2. Detailed error messages should appear in console
3. Better error handling for various failure scenarios
4. Proper file validation and processing

## Next Steps

1. Test the upload with a small PDF file
2. Check the browser console for any errors
3. Check the server terminal for detailed logs
4. If issues persist, check the specific error messages in console
