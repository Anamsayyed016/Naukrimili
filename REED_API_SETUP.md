# Reed API Integration Setup Guide

## Overview
This guide will help you set up and use the Reed API for job searching in your job portal application.

## 🔑 Getting Your Reed API Key

1. **Visit Reed Developer Portal**
   - Go to: https://www.reed.co.uk/developers
   - Sign up for a developer account if you don't have one

2. **Create an Application**
   - Log in to your developer account
   - Create a new application
   - Note down your API key (it will look like: `12345678-1234-1234-1234-123456789012`)

3. **Update Environment Configuration**
   - Open your `.env.local` file
   - Replace `your_reed_api_key_here` with your actual API key:
   ```
   REED_API_KEY=12345678-1234-1234-1234-123456789012
   ```

## 🧪 Testing the Integration

Run the test script to verify your setup:

```powershell
node test-reed-api.js
```

This will test:
- ✅ API authentication
- 📋 Fetching specific job (ID: 132)
- 🔍 Job search functionality
- 🏠 Remote job filtering

## 📊 API Endpoints Available

### 1. Get Job by ID
```javascript
const reed = new ReedService();
const job = await reed.getJobById(132);
```

**Example URL**: `https://www.reed.co.uk/api/1.0/jobs/132`

### 2. Search Jobs
```javascript
const results = await reed.searchJobs({
  keywords: 'JavaScript developer',
  locationName: 'London',
  resultsToTake: 10
});
```

**Example URL**: `https://www.reed.co.uk/api/1.0/search?keywords=developer&locationName=London`

## 🛠️ Usage in Your Application

### Basic Job Search
```typescript
import { getReedService } from './lib/reed-service';

const reed = getReedService();

// Search for jobs
const searchResults = await reed.searchFormattedJobs({
  keywords: 'developer',
  locationName: 'London',
  minimumSalary: 50000,
  resultsToTake: 20
});

console.log(`Found ${searchResults.totalResults} jobs`);
searchResults.jobs.forEach(job => {
  console.log(`${job.title} at ${job.company} - ${job.salary}`);
});
```

### Get Specific Job Details
```typescript
const jobDetails = await reed.getFormattedJob(132);
console.log(jobDetails);
// Output includes: title, company, location, salary, description, etc.
```

### Advanced Search Options
```typescript
const advancedSearch = await reed.searchJobs({
  keywords: 'React developer',
  locationName: 'Manchester',
  distanceFromLocation: 20, // miles
  minimumSalary: 40000,
  maximumSalary: 80000,
  permanent: true,
  fullTime: true,
  postedByDirectEmployer: true,
  resultsToTake: 50,
  resultsToSkip: 0 // for pagination
});
```

## 📋 Available Search Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `keywords` | string | Job title or keyword search |
| `locationName` | string | Location (city, postcode, etc.) |
| `distanceFromLocation` | number | Distance from location in miles |
| `permanent` | boolean | Permanent positions only |
| `contract` | boolean | Contract positions only |
| `temp` | boolean | Temporary positions only |
| `partTime` | boolean | Part-time positions only |
| `fullTime` | boolean | Full-time positions only |
| `minimumSalary` | number | Minimum salary filter |
| `maximumSalary` | number | Maximum salary filter |
| `postedByRecruitmentAgency` | boolean | Jobs from recruitment agencies |
| `postedByDirectEmployer` | boolean | Jobs from direct employers |
| `graduate` | boolean | Graduate-level positions |
| `resultsToTake` | number | Number of results to return (max 100) |
| `resultsToSkip` | number | Number of results to skip (for pagination) |

## 🎯 Integration with Existing Job Portal

### Adding to Unified Job Service
Update your `unified-job-service.ts` to include Reed:

```typescript
import { getReedService } from './reed-service';

export class UnifiedJobService {
  private reedService = getReedService();
  
  async searchAllSources(query: string, location?: string) {
    const [adzunaJobs, serpApiJobs, reedJobs] = await Promise.allSettled([
      this.adzunaService.searchJobs(query, location),
      this.serpApiService.searchJobs(query, location),
      this.reedService.searchFormattedJobs({ 
        keywords: query, 
        locationName: location 
      })
    ]);
    
    // Combine results...
  }
}
```

### API Route Integration
Create an API route at `app/api/jobs/reed/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getReedService } from '@/lib/reed-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keywords = searchParams.get('keywords') || '';
    const location = searchParams.get('location') || '';
    
    const reed = getReedService();
    const results = await reed.searchFormattedJobs({
      keywords,
      locationName: location,
      resultsToTake: 20
    });
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Reed API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs from Reed' },
      { status: 500 }
    );
  }
}
```

## 🔒 API Limits and Best Practices

1. **Rate Limits**: Reed API has usage limits - monitor your usage
2. **Caching**: Cache results to reduce API calls
3. **Error Handling**: Always handle API errors gracefully
4. **Pagination**: Use `resultsToSkip` and `resultsToTake` for pagination
5. **Location Flexibility**: Reed works best with UK locations

## 🚀 Next Steps

1. Get your Reed API key from https://www.reed.co.uk/developers
2. Update your `.env.local` with the API key
3. Run the test script: `node test-reed-api.js`
4. Integrate Reed service into your existing job search flows
5. Update your UI to show Reed as a job source

## 🐛 Troubleshooting

### Common Issues

**401 Unauthorized**
- Check your API key is correct
- Ensure API key is properly set in `.env.local`
- Verify the key has the right permissions

**404 Not Found**
- Job ID might not exist
- Check the endpoint URL format

**Rate Limited**
- You've exceeded API limits
- Implement caching and reduce requests

**Network Errors**
- Check internet connection
- Verify Reed API is not down: https://status.reed.co.uk/

### Debug Mode
Set `DEBUG=true` in your environment to see detailed API requests and responses.

## 📖 Reed API Documentation
- Official Docs: https://www.reed.co.uk/developers/jobseeker
- API Reference: https://www.reed.co.uk/developers/jobseeker/api-reference
- Support: https://www.reed.co.uk/developers/support
