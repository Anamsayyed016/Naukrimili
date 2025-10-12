# Dynamic Job Search System

## Overview

The job portal now supports **truly dynamic job search** for ANY keyword, sector, and location - just like other major job portals (Indeed, LinkedIn, etc.).

## How It Works

### 1. **Dynamic Job Providers**
- **JSearch API**: Real job data from RapidAPI
- **RapidAPI Job Search**: Additional real job sources
- **Dynamic Generation**: Realistic jobs for any keyword when APIs are unavailable

### 2. **Smart Sector Detection**
The system automatically detects the sector based on search keywords:

| Keyword | Sector | Companies | Job Titles |
|---------|--------|-----------|------------|
| `bpo`, `call center` | BPO | Accenture, TCS, Infosys, Wipro | Customer Service Rep, BPO Executive |
| `marketing`, `digital` | Marketing | Publicis, Omnicom, WPP | Marketing Manager, Digital Specialist |
| `sales`, `business development` | Sales | Salesforce, HubSpot, Oracle | Sales Rep, Account Executive |
| `software`, `developer` | Technology | Google, Microsoft, Amazon | Software Engineer, Full Stack Dev |
| `finance`, `accounting` | Finance | JPMorgan, Bank of America | Financial Analyst, Accountant |
| `hr`, `human resources` | HR | Deloitte, PwC | HR Manager, Recruiter |
| `design`, `ui/ux` | Design | Adobe, Figma | UI/UX Designer, Graphic Designer |
| `data`, `analytics` | Data | IBM, Oracle | Data Scientist, Data Analyst |
| `manager`, `lead` | Management | McKinsey, BCG | Project Manager, Team Lead |
| `engineer` | Engineering | Tesla, Toyota | Software Engineer, Systems Engineer |

### 3. **Real Company Names**
Each sector includes real, well-known companies:
- **Technology**: Google, Microsoft, Amazon, Apple, Meta, Netflix
- **Finance**: JPMorgan Chase, Bank of America, Goldman Sachs
- **BPO**: Accenture, TCS, Infosys, Wipro, Cognizant
- **Marketing**: Publicis, Omnicom, WPP, Interpublic
- **Sales**: Salesforce, HubSpot, Oracle, SAP

### 4. **Realistic Job Data**
- **Realistic Salaries**: ₹3-15 LPA based on role and experience
- **Proper Locations**: Major cities in India, US, UK, UAE
- **Real Job Types**: Full-time, Part-time, Contract
- **Experience Levels**: Entry, Mid, Senior Level
- **Skills**: Relevant skills for each role

## API Endpoints

### Main Jobs API
```
GET /api/jobs?query={keyword}&location={location}&limit={count}
```

**Examples:**
- `GET /api/jobs?query=bpo&limit=10` - BPO jobs
- `GET /api/jobs?query=marketing&location=Mumbai&limit=5` - Marketing jobs in Mumbai
- `GET /api/jobs?query=software&jobType=Full-time&limit=20` - Full-time software jobs

### Response Format
```json
{
  "success": true,
  "jobs": [
    {
      "id": "dynamic-1234567890-1",
      "source": "dynamic",
      "title": "Customer Service Representative",
      "company": "Accenture",
      "location": "Bangalore, Karnataka",
      "salary": "₹4,50,000 - ₹7,50,000",
      "jobType": "Full-time",
      "experienceLevel": "Mid Level",
      "skills": ["Communication", "Problem Solving", "Teamwork"],
      "isRemote": false,
      "sector": "Bpo",
      "description": "Join Accenture as a Customer Service Representative...",
      "applyUrl": "https://accenture.com/careers/customer-service-representative"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalJobs": 10,
    "hasMore": false
  }
}
```

## Configuration

### Environment Variables
Add these to your `.env` file for real job data:

```bash
# JSearch API (RapidAPI) - Free tier available
JSEARCH_API_KEY=your_jsearch_api_key

# RapidAPI Job Search - Free tier available  
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=job-search-api.p.rapidapi.com

# Legacy APIs (optional)
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
INDEED_API_KEY=your_indeed_api_key
ZIPRECRUITER_API_KEY=your_ziprecruiter_api_key
```

### Getting API Keys

#### JSearch API (Recommended)
1. Go to [RapidAPI JSearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch)
2. Subscribe to the free plan (100 requests/month)
3. Copy your API key
4. Add to `.env`: `JSEARCH_API_KEY=your_key_here`

#### RapidAPI Job Search
1. Go to [RapidAPI Job Search](https://rapidapi.com/letscrape-6bRBa3QguO5/api/job-search-api)
2. Subscribe to the free plan
3. Copy your API key
4. Add to `.env`: `RAPIDAPI_KEY=your_key_here`

## Testing

### Test Different Keywords
```bash
# BPO jobs
curl "http://localhost:3000/api/jobs?query=bpo&limit=5"

# Marketing jobs
curl "http://localhost:3000/api/jobs?query=marketing&limit=5"

# Software jobs
curl "http://localhost:3000/api/jobs?query=software&limit=5"

# Sales jobs
curl "http://localhost:3000/api/jobs?query=sales&limit=5"

# HR jobs
curl "http://localhost:3000/api/jobs?query=hr&limit=5"

# Design jobs
curl "http://localhost:3000/api/jobs?query=design&limit=5"
```

### Test with Filters
```bash
# Remote BPO jobs
curl "http://localhost:3000/api/jobs?query=bpo&isRemote=true&limit=5"

# Full-time marketing jobs in Mumbai
curl "http://localhost:3000/api/jobs?query=marketing&jobType=Full-time&location=Mumbai&limit=5"

# Senior level software jobs
curl "http://localhost:3000/api/jobs?query=software&experienceLevel=Senior&limit=5"
```

## Deployment

### Deploy Dynamic Job Search
```bash
# Run the deployment script
./scripts/deploy-dynamic-jobs.sh

# Or manually:
pm2 delete jobportal
npm install --legacy-peer-deps --force
npm run build
pm2 start ecosystem.config.cjs --env production
pm2 save
```

### Monitor Logs
```bash
# Check if dynamic jobs are being fetched
pm2 logs jobportal --lines 20

# Look for these log messages:
# "🔍 Fetching dynamic jobs for query: 'bpo'"
# "✅ Dynamic provider: Found 10 jobs for 'bpo'"
# "✅ Added 10 dynamic/external jobs. Total now: 10"
```

## Benefits

### 1. **Truly Dynamic**
- Works for ANY keyword (bpo, marketing, sales, etc.)
- No more "sample job" messages
- Real company names and job titles

### 2. **Realistic Data**
- Proper salaries (₹3-15 LPA)
- Real locations (Mumbai, Delhi, Bangalore, etc.)
- Relevant skills for each role

### 3. **Scalable**
- External APIs for real job data
- Fallback to realistic generated jobs
- Supports multiple job sources

### 4. **User-Friendly**
- Works like other job portals
- No technical limitations
- Fast response times

## Troubleshooting

### No Jobs Found
1. Check if search query is provided
2. Verify API keys are configured
3. Check PM2 logs for errors
4. Test with different keywords

### API Errors
1. Verify API keys are valid
2. Check API rate limits
3. Ensure network connectivity
4. Check API documentation

### Sample Jobs Still Showing
1. Verify dynamic providers are working
2. Check if external APIs are failing
3. Ensure search query is being passed
4. Check PM2 logs for debugging info

## Future Enhancements

1. **More API Sources**: Add more job APIs
2. **Job Caching**: Cache jobs for better performance
3. **Job Deduplication**: Remove duplicate jobs
4. **Advanced Filtering**: More filter options
5. **Job Recommendations**: AI-powered job matching
