# 🔑 API Keys Setup Guide - Resume Builder AI Enhancement

## ✅ **API Keys Configured**

### **1. OpenAI API Key** ✅
**Key:** See `env.template` file for the API key

**Usage:**
- Enhanced ATS suggestions
- Resume content optimization
- AI-powered resume analysis
- Smart content generation

**Environment Variable:**
```bash
OPENAI_API_KEY=your_openai_api_key_here
# Get the actual key from env.template file
```

**Optional Model Configuration:**
```bash
OPENAI_MODEL=gpt-4o-mini  # or gpt-4o, gpt-4-turbo, etc.
```

---

### **2. Google Cloud Vision OCR API Key** ✅
**Key:** See `env.template` file for the API key

**Usage:**
- Extract text from resume images
- Parse resume PDFs/images
- Auto-fill form from uploaded resume
- OCR-based resume analysis

**Environment Variable:**
```bash
GOOGLE_CLOUD_OCR_API_KEY=your_google_cloud_ocr_api_key_here
# Get the actual key from env.template file
```

**Alternative (if using same key for multiple services):**
```bash
GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key_here
# Get the actual key from env.template file
```

---

## 🚀 **Setup Instructions**

### **Step 1: Update Environment Variables**

Add the following to your `.env.local` or `.env` file:

```bash
# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# Google Cloud Vision OCR
GOOGLE_CLOUD_OCR_API_KEY=your_google_cloud_ocr_api_key_here

# Copy the actual keys from env.template file
```

### **Step 2: Restart Your Development Server**

```bash
npm run dev
# or
yarn dev
```

### **Step 3: Verify API Keys Are Loaded**

Check the console logs when the server starts:
- ✅ `Enhanced AI Service: OpenAI initialized`
- ✅ `Google Cloud OCR Service initialized`

---

## 🎯 **Features Enabled**

### **1. Enhanced ATS Suggestions** ✅
- **Better AI Models:** Uses GPT-4o-mini (or configured model)
- **Improved Prompts:** More detailed and context-aware
- **Higher Quality:** Better suggestions with real industry keywords
- **Faster Responses:** Optimized API calls

**API Endpoint:** `/api/resume-builder/ats-suggestions`

### **2. OCR Resume Extraction** ✅
- **Image Upload:** Upload resume images/PDFs
- **Text Extraction:** Automatically extract text using Google Cloud Vision
- **Structured Parsing:** Parse into resume sections (Personal Info, Experience, Education, Skills)
- **Auto-Fill Forms:** Automatically populate form fields

**API Endpoint:** `/api/resume-builder/ocr-extract`

### **3. AI Content Enhancement** ✅
- **Content Optimization:** Enhance existing resume content
- **ATS Optimization:** Make content more ATS-friendly
- **Keyword Suggestions:** Get relevant ATS keywords
- **Smart Suggestions:** Context-aware improvements

**API Endpoint:** `/api/resume-builder/ai-enhance`

---

## 📋 **API Endpoints**

### **1. ATS Suggestions**
```typescript
POST /api/resume-builder/ats-suggestions
Body: {
  job_title: string;
  industry: string;
  experience_level: string;
  summary_input: string;
  skills_input: string;
  experience_input: string;
  education_input: string;
}
```

### **2. OCR Extract**
```typescript
POST /api/resume-builder/ocr-extract
Body: {
  imageBase64: string; // Base64 encoded image
}
Response: {
  success: boolean;
  data: {
    personalInfo: Record<string, string>;
    experience: Array<Record<string, string>>;
    education: Array<Record<string, string>>;
    skills: string[];
    summary: string;
  }
}
```

### **3. AI Enhance**
```typescript
POST /api/resume-builder/ai-enhance
Body: {
  jobTitle?: string;
  industry?: string;
  experienceLevel?: string;
  currentContent?: string;
  enhancementType: 'summary' | 'skills' | 'experience' | 'keywords' | 'optimize';
}
Response: {
  success: boolean;
  enhanced: string;
  suggestions: string[];
  keywords: string[];
  confidence: number;
}
```

---

## 🔧 **Configuration Options**

### **OpenAI Configuration:**
```bash
# Model selection
OPENAI_MODEL=gpt-4o-mini        # Fast, cost-effective (default)
OPENAI_MODEL=gpt-4o             # Better quality, higher cost
OPENAI_MODEL=gpt-4-turbo        # Balanced option
```

### **Gemini Configuration (Optional Backup):**
```bash
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-1.5-pro      # Better quality (default)
GEMINI_MODEL=gemini-1.5-flash   # Faster, lower cost
```

---

## ✅ **Verification**

### **Test ATS Suggestions:**
1. Open resume builder editor
2. Fill in job title and industry
3. Type in summary or skills field
4. Check for auto-suggestions (should appear after 3-10 characters)
5. Suggestions should be relevant and ATS-optimized

### **Test OCR (if implemented in UI):**
1. Upload a resume image
2. Check console for OCR extraction
3. Verify form fields are auto-filled

### **Test AI Enhancement:**
1. Call `/api/resume-builder/ai-enhance` with sample content
2. Verify enhanced content is returned
3. Check suggestions and keywords arrays

---

## 🔒 **Security Notes**

1. **Never commit API keys to Git**
   - Keys are in `.env.local` (should be in `.gitignore`)
   - Use environment variables only

2. **Rotate keys if exposed**
   - If keys are accidentally committed, rotate them immediately
   - Update environment variables with new keys

3. **Use different keys for production**
   - Use separate API keys for production environment
   - Monitor API usage and set limits

4. **Rate limiting**
   - Implement rate limiting for API endpoints
   - Monitor API usage to prevent abuse

---

## 📊 **API Usage Monitoring**

### **OpenAI:**
- Monitor usage at: https://platform.openai.com/usage
- Set usage limits to control costs
- Track token usage per request

### **Google Cloud:**
- Monitor usage at: https://console.cloud.google.com/apis/dashboard
- Set quotas and limits
- Track OCR requests and costs

---

## 🐛 **Troubleshooting**

### **Issue: API keys not working**
- ✅ Check environment variables are set correctly
- ✅ Restart development server
- ✅ Verify keys are not expired
- ✅ Check API key permissions

### **Issue: OCR not extracting text**
- ✅ Verify Google Cloud Vision API is enabled
- ✅ Check image format (supports: PNG, JPEG, PDF)
- ✅ Verify base64 encoding is correct
- ✅ Check API quota limits

### **Issue: AI suggestions not appearing**
- ✅ Check OpenAI API key is valid
- ✅ Verify model name is correct
- ✅ Check API rate limits
- ✅ Review console logs for errors

---

## 🚀 **Next Steps**

1. ✅ API keys configured
2. ✅ Services initialized
3. ✅ API endpoints created
4. ⏳ Test in development
5. ⏳ Deploy to production
6. ⏳ Monitor usage and costs

---

**Status:** ✅ **API Keys Configured and Ready**

