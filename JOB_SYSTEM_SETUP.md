# 🚀 Job Portal - Multi-Country Job System Setup Guide

## 📋 Overview

This guide will help you set up the new unified job system that fetches real jobs from multiple countries (India, USA, UK, UAE, and more) using external APIs.

## 🔧 **What's Been Fixed**

### ✅ **Issues Resolved:**
1. **Removed duplicate/conflicting job hooks** - Eliminated `useRealTimeJobSearch` and `useEnhancedJobSearch`
2. **Cleaned up conflicting API routes** - Removed `[jobId]` and `id` directories
3. **Created unified job system** - Single API that combines database and external jobs
4. **Added multi-country support** - Jobs from India, USA, UK, UAE, Canada, Australia, etc.
5. **Integrated external job providers** - Adzuna, JSearch, Google Jobs

### 🆕 **New Features:**
- **Unified Jobs API** (`/api/jobs/unified`) - Combines database + external jobs
- **Multi-Country Import** (`/api/jobs/import-multi-country`) - Fetches real jobs from 20+ countries
- **Smart Job Aggregation** - Combines jobs from multiple sources
- **Country-specific job queries** - Optimized searches for each country

## 🚀 **Quick Start**

### **1. Set Environment Variables**

Create a `.env.local` file in your project root with these API keys:

```bash
# External Job Provider APIs

# Adzuna API (Free tier available)
ADZUNA_APP_ID=your_adzuna_app_id_here
ADZUNA_APP_KEY=your_adzuna_app_key_here

# RapidAPI (JSearch, Google Jobs)
RAPIDAPI_KEY=your_rapidapi_key_here

# Optional: Additional providers
GOOGLE_JOBS_API_KEY=AIzaSyDYhmLEfBFlowxKZQ4qHZOkbq0NLSqOCoY
LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret_here
```

### **2. Get API Keys**

#### **Adzuna API (Free)**
1. Go to [Adzuna API](https://developer.adzuna.com/)
2. Sign up for free account
3. Create new application
4. Get `APP_ID` and `APP_KEY`

#### **RapidAPI (JSearch + Google Jobs)**
1. Go to [RapidAPI](https://rapidapi.com/)
2. Sign up for free account
3. Subscribe to:
   - [JSearch API](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch/)
   - [Google Jobs API](https://rapidapi.com/letscrape-6bRBa3QguO5/api/google-jobs-api/)
4. Get your API key

### **3. Test the System**

Run the test script to verify everything is working:

```bash
# Test the job import system
node scripts/test-job-import.js
```

### **4. Import Jobs from Multiple Countries**

```bash
# Import jobs from India, USA, UK, UAE
curl -X POST http://localhost:3000/api/jobs/import-multi-country \
  -H "Content-Type: application/json" \
  -d '{
    "countries": ["IN", "US", "UK", "AE"],
    "maxJobsPerCountry": 100
  }'
```

## 🌍 **Supported Countries**

| Code | Country | Adzuna | JSearch | Google Jobs |
|------|---------|---------|----------|-------------|
| IN | India | ✅ | ✅ | ✅ |
| US | United States | ✅ | ✅ | ✅ |
| UK | United Kingdom | ✅ | ✅ | ✅ |
| AE | UAE | ✅ | ✅ | ✅ |
| CA | Canada | ✅ | ✅ | ✅ |
| AU | Australia | ✅ | ✅ | ✅ |
| DE | Germany | ✅ | ✅ | ✅ |
| FR | France | ✅ | ✅ | ✅ |
| IT | Italy | ✅ | ✅ | ✅ |
| ES | Spain | ✅ | ✅ | ✅ |
| NL | Netherlands | ✅ | ✅ | ✅ |
| BE | Belgium | ✅ | ✅ | ✅ |
| AT | Austria | ✅ | ✅ | ✅ |
| PL | Poland | ✅ | ✅ | ✅ |
| SG | Singapore | ✅ | ✅ | ✅ |
| MX | Mexico | ✅ | ✅ | ✅ |
| NZ | New Zealand | ✅ | ✅ | ✅ |
| ZA | South Africa | ✅ | ✅ | ✅ |
| BR | Brazil | ✅ | ✅ | ✅ |

## 🔌 **API Endpoints**

### **1. Unified Jobs API**
```
GET /api/jobs/unified
```
**Parameters:**
- `query` - Job search query
- `location` - Job location
- `country` - Country code (IN, US, UK, AE, etc.)
- `source` - 'all', 'db', or 'external'
- `includeExternal` - true/false
- `page` - Page number
- `limit` - Jobs per page

**Example:**
```bash
curl "http://localhost:3000/api/jobs/unified?country=IN&includeExternal=true&limit=20"
```

### **2. Multi-Country Job Import**
```
POST /api/jobs/import-multi-country
```
**Body:**
```json
{
  "countries": ["IN", "US", "UK", "AE"],
  "queries": ["software developer", "data analyst"],
  "page": 1,
  "location": "Bangalore",
  "radiusKm": 25,
  "maxJobsPerCountry": 100
}
```

### **3. Check Supported Countries**
```
GET /api/jobs/import-multi-country
```

## 🎯 **Usage Examples**

### **Import Jobs from India**
```javascript
const response = await fetch('/api/jobs/import-multi-country', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    countries: ['IN'],
    maxJobsPerCountry: 100
  })
});

const result = await response.json();
console.log(`Imported ${result.summary.totalPersisted} jobs from India`);
```

### **Search Jobs with External Sources**
```javascript
const response = await fetch('/api/jobs/unified?country=IN&includeExternal=true&query=software developer');
const data = await response.json();
console.log(`Found ${data.jobs.length} jobs from ${data.sources.database ? 'database' : ''}${data.sources.external ? ' and external APIs' : ''}`);
```

### **Get Jobs from Specific Country**
```javascript
const response = await fetch('/api/jobs/unified?country=US&source=external');
const data = await response.json();
console.log(`Found ${data.jobs.length} jobs from USA external sources`);
```

## 🔄 **Automated Job Import**

### **Set up Cron Job (Linux/Mac)**
```bash
# Edit crontab
crontab -e

# Import jobs every 6 hours
0 */6 * * * curl -X POST http://localhost:3000/api/jobs/import-multi-country -H "Content-Type: application/json" -d '{"countries": ["IN", "US", "UK", "AE"], "maxJobsPerCountry": 50}'
```

### **Set up Task Scheduler (Windows)**
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger to every 6 hours
4. Action: Start a program
5. Program: `curl.exe`
6. Arguments: `-X POST http://localhost:3000/api/jobs/import-multi-country -H "Content-Type: application/json" -d "{\"countries\": [\"IN\", \"US\", \"UK\", \"AE\"], \"maxJobsPerCountry\": 50}"`

## 🧪 **Testing & Debugging**

### **1. Test Individual APIs**
```bash
# Test Adzuna
curl "https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=YOUR_APP_ID&app_key=YOUR_APP_KEY&what=software developer"

# Test JSearch
curl "https://jsearch.p.rapidapi.com/search?query=software developer&country=IN" \
  -H "X-RapidAPI-Key: YOUR_RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: jsearch.p.rapidapi.com"
```

### **2. Check API Health**
```javascript
const response = await fetch('/api/jobs/import-multi-country');
const data = await response.json();
console.log('API Health:', data);
```

### **3. Monitor Job Sources**
```javascript
const response = await fetch('/api/jobs/unified?country=IN&includeExternal=true');
const data = await response.json();
console.log('Job sources:', data.sources);
console.log('Total jobs:', data.pagination.total);
```

## 🚨 **Troubleshooting**

### **No Jobs Showing**
1. Check API keys in `.env.local`
2. Verify external APIs are working
3. Check database connection
4. Run test script: `node scripts/test-job-import.js`

### **API Rate Limits**
- Adzuna: 1000 requests/day (free tier)
- JSearch: 100 requests/month (free tier)
- Google Jobs: Varies by plan

### **Database Issues**
1. Check Prisma connection
2. Verify database schema
3. Run database migrations

## 📊 **Performance Optimization**

### **1. Caching**
- Jobs are cached in database
- External API calls are minimized
- Consider Redis for additional caching

### **2. Batch Processing**
- Import jobs in batches
- Use pagination for large imports
- Schedule imports during off-peak hours

### **3. API Limits**
- Respect rate limits
- Implement exponential backoff
- Use multiple API keys if available

## 🔮 **Future Enhancements**

### **Planned Features:**
- Job deduplication across sources
- Advanced filtering and sorting
- Job recommendations
- Salary insights
- Company information enrichment
- Job alerts and notifications

### **Additional Providers:**
- LinkedIn Jobs
- Indeed
- Glassdoor
- ZipRecruiter
- Monster
- CareerBuilder

## 📞 **Support**

If you encounter issues:
1. Check the console logs
2. Run the test script
3. Verify API keys
4. Check database connection
5. Review this documentation

## 🎉 **Success!**

Your job portal now supports:
- ✅ Real jobs from 20+ countries
- ✅ Multiple job sources (Adzuna, JSearch, Google Jobs)
- ✅ Unified API for all job operations
- ✅ Automated job import system
- ✅ No duplicate or conflicting code
- ✅ Clean, maintainable architecture

**Next steps:**
1. Set up your API keys
2. Test the system
3. Import jobs from your target countries
4. Monitor and optimize performance
5. Enjoy your multi-country job portal! 🚀
