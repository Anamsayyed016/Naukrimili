# Adzuna API Setup Instructions

## Overview
Your job portal now integrates with the Adzuna API to provide real-time job search functionality. This integration includes job search, salary statistics, job categories, and more.

## Getting Started

### 1. Get Adzuna API Credentials

1. Visit [Adzuna Developer Portal](https://developer.adzuna.com/)
2. Sign up for a free developer account
3. Create a new application
4. Copy your **App ID** and **API Key**

### 2. Configure Environment Variables

Add your Adzuna credentials to your environment files:

**In `.env` and `.env.local`:**
```env
# Adzuna API Configuration
ADZUNA_APP_ID=your_actual_app_id_here
ADZUNA_API_KEY=your_actual_api_key_here
```

### 3. Supported Countries

The API supports job searches in the following countries:
- `us` - United States
- `gb` - United Kingdom  
- `au` - Australia
- `ca` - Canada
- `de` - Germany
- `fr` - France
- `in` - India
- `sg` - Singapore
- And more...

## Features Available

### 🔍 Job Search
- Search by keywords, job title, skills, or company
- Filter by location
- Filter by job type (full-time, part-time, contract)
- Filter by salary range
- Sort by relevance, date, or salary

### 💰 Salary Information
- Salary ranges for jobs
- Salary histogram analysis
- Currency formatting based on country

### 📊 Job Categories
- Browse jobs by category (IT, Healthcare, Finance, etc.)
- Category-based filtering

### 🏢 Company Information
- Top hiring companies
- Company-specific job searches

### 📍 Location Features
- Geographic location search
- Distance-based filtering

## API Endpoints

Your application now includes these API endpoints:

- `GET /api/jobs/search` - Search for jobs
- `GET /api/jobs/categories` - Get job categories
- `GET /api/jobs/[jobId]` - Get specific job details
- `GET /api/jobs/salary-stats` - Get salary statistics

## Usage Examples

### Search Jobs
```typescript
// Search for JavaScript jobs in New York
const response = await fetch('/api/jobs/search?what=javascript&where=new york');
const data = await response.json();
```

### Get Categories
```typescript
// Get all job categories
const response = await fetch('/api/jobs/categories');
const { categories } = await response.json();
```

### Salary Filtering
```typescript
// Search for jobs with salary between $50k-$100k
const response = await fetch('/api/jobs/search?what=developer&salary_min=50000&salary_max=100000');
```

## Component Usage

### Enhanced Job Search Component
The main job search interface is available as `<EnhancedJobSearch />`:

```tsx
import EnhancedJobSearch from '../components/EnhancedJobSearch';

export default function JobsPage() {
  return (
    <EnhancedJobSearch 
      initialQuery="developer"
      initialLocation="san francisco"
    />
  );
}
```

### Job Search Widget
For simpler search forms, use `<JobSearchWidget />`:

```tsx
import JobSearchWidget from '../components/JobSearchWidget';

export default function HomePage() {
  return (
    <JobSearchWidget 
      location="New York"
      onSearch={(params) => {
        console.log('Search params:', params);
      }}
    />
  );
}
```

## Rate Limits

Adzuna API has rate limits:
- Free tier: 1,000 calls/month
- Check your usage on the Adzuna developer portal

## Error Handling

The integration includes comprehensive error handling:
- API credential validation
- Network error handling  
- Graceful fallbacks for missing data
- User-friendly error messages

## Troubleshooting

### Common Issues

1. **"Adzuna API credentials are not configured" error**
   - Make sure `ADZUNA_APP_ID` and `ADZUNA_API_KEY` are set in your environment files
   - Restart your development server after adding credentials

2. **No jobs returned**
   - Check if your search terms are too specific
   - Verify the country code in your API configuration
   - Check API rate limits

3. **CORS errors**
   - API calls should go through your Next.js API routes, not directly to Adzuna

### Testing Your Setup

1. Add your API credentials
2. Restart your development server: `npm run dev`
3. Navigate to `/jobs`
4. Try searching for "developer" jobs
5. Check the browser console for any errors

## Development Notes

- The integration uses App Router API routes
- TypeScript types are included for all API responses  
- Components support both light and dark mode
- Search results include bookmarking functionality
- Salary information is formatted automatically

## Production Deployment

Before deploying:
1. Ensure environment variables are set on your hosting platform
2. Test API functionality in production environment
3. Monitor API usage through Adzuna dashboard
4. Consider upgrading to paid Adzuna plan if needed

## Support

For issues with:
- Adzuna API: Check [Adzuna Developer Docs](https://developer.adzuna.com/docs)
- Integration code: Check the console for error messages and verify your environment setup
