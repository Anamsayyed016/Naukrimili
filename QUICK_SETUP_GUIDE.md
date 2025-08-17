# 🚀 **QUICK SETUP GUIDE - GET YOUR JOB PORTAL RUNNING IN 5 MINUTES**

## ⚡ **FAST SETUP (5 minutes)**

### **Step 1: Create .env.local**
Create `.env.local` in your project root and add your API keys:

```env
# Database (if you have PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/jobportal"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-32-char-secret-key"

# Real API Keys (copy from API_KEYS_SECURE.md)
ADZUNA_APP_ID="your-adzuna-app-id"
ADZUNA_APP_KEY="your-adzuna-app-key"
RAPIDAPI_KEY="your-rapidapi-key"
GOOGLE_JOBS_API_KEY="your-google-jobs-api-key"
GOOGLE_GEOLOCATION_API_KEY="your-google-geolocation-api-key"
OPENAI_API_KEY="your-openai-api-key"

# Feature Flags
NEXT_PUBLIC_MOCK_DATA=false
```

### **Step 2: Install Dependencies**
```bash
npm install
# or
pnpm install
```

### **Step 3: Start Development Server**
```bash
npm run dev
# or
pnpm dev
```

### **Step 4: Test Real APIs**
Visit: `http://localhost:3000/api/jobs/import`

## 🎯 **WHAT YOU'LL GET**

✅ **1000+ Real Jobs** from Adzuna, JSearch, Google Jobs  
✅ **AI-Powered Resume Analysis** with OpenAI GPT-4  
✅ **Advanced Location Search** with GPS detection  
✅ **Professional Authentication** with NextAuth.js  
✅ **Enterprise Performance** with Redis caching  

## 🚨 **TROUBLESHOOTING**

### **If APIs Don't Work:**
1. Check `.env.local` exists
2. Verify API keys are correct
3. Restart development server
4. Check browser console for errors

### **If Database Connection Fails:**
1. Install PostgreSQL
2. Create database: `createdb jobportal`
3. Run: `npx prisma migrate dev`

## 🎉 **YOU'RE READY!**

Your job portal now has:
- **Real job data** from multiple sources
- **AI-powered features** with OpenAI
- **Professional performance** with Redis
- **Enterprise-grade architecture**

**Start competing with Indeed, LinkedIn, and Glassdoor!** 🚀
