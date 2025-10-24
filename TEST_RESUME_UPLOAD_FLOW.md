# Resume Upload & Job Recommendations - Testing Guide

## 🔧 What Was Fixed

### 1. File Size Limit Issue (413 Error)
- **Problem**: Server was rejecting files over 1MB
- **Solution**: 
  - Added `MAX_FILE_SIZE = 10MB` constant
  - Added explicit file size validation with helpful error messages
  - Added route configuration for larger uploads

### 2. Authentication Issue (401 Error)
- **Problem**: Resume upload API requires authenticated session
- **Solution**: 
  - API now properly checks for authenticated session
  - Returns clear error messages if not logged in
  - Frontend handles authentication gracefully

### 3. Job Recommendations Integration
- **Problem**: Resume upload didn't show recommended jobs
- **Solution**:
  - Resume upload API now fetches job recommendations automatically
  - Recommendations based on extracted skills, location, and job type
  - Frontend displays top 3 recommendations with match scores
  - Link to view all recommendations in dashboard

## 🎯 How It Works Now

### User Flow:
1. **Upload Resume** → User uploads PDF/DOC/DOCX/TXT resume
2. **AI Analysis** → System extracts:
   - Personal info (name, email, phone, location)
   - Skills
   - Experience
   - Education
   - Projects, certifications, languages
3. **Job Matching** → System automatically:
   - Searches for jobs matching extracted skills
   - Calculates match scores (0-100%)
   - Returns top 6 recommendations
4. **Display** → User sees:
   - Autofilled profile form (editable)
   - Top 3 recommended jobs with match scores
   - Link to view all recommendations
5. **Save** → User reviews, edits, and saves profile
6. **Dashboard** → Redirected to dashboard with full recommendations

## 📋 Server Testing Commands

### Prerequisites
Make sure your server is running:
```bash
# Check if server is running
curl http://localhost:3000/api/health

# If not running, start it
npm run dev
# or
pm2 start ecosystem.config.cjs
```

### Test 1: Check API Health
```bash
curl -X GET "http://localhost:3000/api/debug/auth-status" -H "Content-Type: application/json"
```
**Expected**: Should return `{"success":true, ...}` with auth info

### Test 2: Check Job Recommendations (Test API)
```bash
curl -X GET "http://localhost:3000/api/jobseeker/recommendations-test?limit=3&algorithm=skills" -H "Content-Type: application/json"
```
**Expected**: Should return job recommendations with match scores

### Test 3: Test Resume Upload (Requires Authentication)

⚠️ **Note**: This requires a logged-in session. You'll need to:

1. **Option A - Use Browser**:
   - Go to `http://localhost:3000/auth/signin`
   - Log in with Google or credentials
   - Go to `http://localhost:3000/resumes/upload`
   - Upload a resume file
   - See autofilled form + recommended jobs

2. **Option B - Get Session Token from Browser**:
   - Log in via browser
   - Open DevTools (F12)
   - Go to Application → Cookies → `http://localhost:3000`
   - Copy the `next-auth.session-token` value
   - Use in curl:

```bash
curl -X POST "http://localhost:3000/api/resumes/ultimate-upload" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN_HERE" \
  -F "file=@/path/to/your/resume.pdf"
```

### Test 4: Check Database for Uploaded Resume
```bash
# Using the resumeId from upload response
curl -X GET "http://localhost:3000/api/resumes/{resumeId}" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN_HERE"
```

## 🎨 Frontend Testing (Manual)

### Complete Flow Test:

1. **Navigate to Resume Upload Page**
   ```
   http://localhost:3000/resumes/upload
   ```

2. **Upload a Test Resume**
   - Click "Choose File" or drag & drop
   - Select a resume (PDF, DOC, DOCX, or TXT)
   - Click "Upload & Analyze"

3. **Verify AI Analysis**
   - Check console logs (F12) for extracted data
   - Verify profile form is autofilled with:
     - Name, Email, Phone, Location
     - Skills (as tags)
     - Experience entries
     - Education entries

4. **Check Recommended Jobs Section**
   - Should appear below the upload section
   - Shows top 3 jobs with match scores
   - Each job shows:
     - Title, Company, Location
     - Match score badge (0-100%)
     - Match reasons
     - "View Job" button

5. **Edit and Save Profile**
   - Review autofilled data
   - Edit any fields as needed
   - Add missing information
   - Click "Save Profile"

6. **Verify Dashboard Redirect**
   - Should redirect to `/dashboard/jobseeker`
   - Should show all recommendations
   - Profile should be saved in database

## 🐛 Common Issues & Solutions

### Issue 1: "413 Request Entity Too Large"
**Solution**: File is larger than 10MB. Compress or use a smaller file.

### Issue 2: "Authentication Required"
**Solution**: 
- Make sure you're logged in
- Check that session cookie is being sent
- Try logging out and back in

### Issue 3: No Recommendations Showing
**Solution**:
- Check if resume has extractable skills
- Verify there are active jobs in database
- Check browser console for errors

### Issue 4: "NEXTAUTH_URL environment variable is required"
**Solution**: Add to `.env.local`:
```
NEXTAUTH_URL=http://localhost:3000
```

### Issue 5: Form Not Autofilling
**Solution**:
- Check browser console for logs
- Verify API response includes profile data
- Check ProfileCompletionForm component is receiving data

## 📊 Expected API Response

### Successful Resume Upload Response:
```json
{
  "success": true,
  "message": "Resume uploaded and parsed successfully using AI",
  "resumeId": "clxxxxx",
  "profile": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "location": "Mumbai, India",
    "skills": ["JavaScript", "React", "Node.js", "Python"],
    "experience": [...],
    "education": [...],
    "summary": "Experienced professional...",
    "confidence": 85
  },
  "recommendations": [
    {
      "id": 4828,
      "title": "Senior Software Engineer",
      "company": "Tech Company",
      "location": "Mumbai, Maharashtra",
      "matchScore": 74,
      "matchReasons": [
        "3 skill(s) match: JavaScript, React, Python",
        "Location match"
      ]
    }
  ],
  "atsScore": 90,
  "confidence": 85,
  "processingTime": 1234
}
```

## 🎯 Success Criteria

✅ **Upload Success**: File uploads without errors
✅ **AI Extraction**: Profile data extracted from resume
✅ **Form Autofill**: All extracted data appears in form
✅ **Job Recommendations**: Shows 3-6 relevant jobs
✅ **Match Scores**: Each job has a score (0-100%)
✅ **Editable Form**: User can modify all fields
✅ **Save Success**: Profile saves to database
✅ **Dashboard Redirect**: Redirects to jobseeker dashboard

## 🚀 Next Steps

After successful testing:
1. Deploy changes to production
2. Test with real resume files
3. Monitor error logs
4. Gather user feedback
5. Optimize AI extraction accuracy
6. Add more recommendation algorithms

## 📝 Notes

- The AI extraction uses basic regex parsing (can be enhanced with OpenAI/Gemini)
- Recommendations use skills-based matching (40%), location (30%), job type (20%), remote (10%)
- Form includes AI-powered suggestions for skills, job title, summary
- All data is editable before saving
- Resume file is stored in `uploads/resumes/` directory
- Database stores both file and parsed data

## 🔗 Related Files

- API Route: `app/api/resumes/ultimate-upload/route.ts`
- Frontend Component: `components/resume/ResumeUpload.tsx`
- Form Component: `components/resume/ProfileCompletionForm.tsx`
- Upload Page: `app/resumes/upload/page.tsx`
- Recommendations API: `app/api/jobseeker/recommendations/route.ts`
- Test API: `app/api/jobseeker/recommendations-test/route.ts`

---

**Last Updated**: 2025-10-18
**Status**: ✅ All features implemented and ready for testing

