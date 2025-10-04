# 🔐 **SECURE API SETUP GUIDE - NO KEYS EXPOSED**

## ⚠️ **SECURITY FIRST**
This guide shows you how to set up your job portal **WITHOUT exposing API keys** in Git.

## 🚀 **QUICK SETUP (5 minutes)**

### **Step 1: Create .env.local**
Create `.env.local` in your project root:

```env
# Database (if you have PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/jobportal"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-32-char-secret-key"

# External Job APIs (ADD YOUR KEYS HERE)
ADZUNA_APP_ID="your-adzuna-app-id"
ADZUNA_APP_KEY="your-adzuna-app-key"
RAPIDAPI_KEY="your-rapidapi-key"
RAPIDAPI_HOST="jsearch.p.rapidapi.com"

# Google Jobs API (ADD YOUR KEYS HERE)
GOOGLE_JOBS_API_KEY="your-google-jobs-api-key"
GOOGLE_GEOLOCATION_API_KEY="your-google-geolocation-api-key"

# AI Services (ADD YOUR KEY HERE)
OPENAI_API_KEY="your-openai-api-key"

# Feature Flags
NEXT_PUBLIC_MOCK_DATA=false
```

### **Step 2: Get Your API Keys**

#### **Adzuna API (Job Data)**
1. Go to [Adzuna API](https://developer.adzuna.com/)
2. Sign up for free account
3. Get your App ID and App Key

#### **RapidAPI (JSearch & Google Jobs)**
1. Go to [RapidAPI](https://rapidapi.com/)
2. Subscribe to JSearch API
3. Get your API key

#### **Google APIs**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Jobs API and Geolocation API
3. Create API keys

#### **OpenAI API**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up and add billing
3. Get your API key

### **Step 3: Install & Run**
```bash
npm install
npm run dev
```

## 🎯 **WHAT YOU'LL GET**

✅ **1000+ Real Jobs** from multiple sources  
✅ **AI-Powered Resume Analysis** with OpenAI  
✅ **Advanced Location Search** with GPS  
✅ **Professional Authentication** with NextAuth  
✅ **Enterprise Performance** with Redis  

## 🔒 **SECURITY CHECKLIST**

- [ ] `.env.local` is in `.gitignore`
- [ ] No API keys in any committed files
- [ ] `API_KEYS_SECURE.md` is not tracked by Git
- [ ] All documentation uses placeholder text

## 🚨 **NEVER DO THIS**

❌ Don't commit `.env.local`  
❌ Don't put real API keys in documentation  
❌ Don't share keys in public repositories  
❌ Don't use the same keys across projects  

## 🎉 **YOU'RE READY!**

Your job portal will work with real APIs once you add your keys to `.env.local`!

**Start competing with Indeed, LinkedIn, and Glassdoor!** 🚀
