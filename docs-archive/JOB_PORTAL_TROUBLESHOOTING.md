# Job Portal API Troubleshooting Guide

## 🚨 Common Issues and Solutions

### Issue 1: No Jobs Found / Empty Results

**Symptoms:**
- API returns `{"success":true,"jobs":[],"total":0}`
- No jobs displayed on the jobs page
- Search results are empty

**Causes & Solutions:**

#### A. Missing API Keys
**Cause:** Environment variables not configured
**Solution:**
1. Run the setup script: `node setup-job-apis.js`
2. Or manually create `.env.local` file:
```env
SERPAPI_KEY=your_serpapi_key_here
ADZUNA_APP_ID=your_adzuna_app_id_here
ADZUNA_API_KEY=your_adzuna_api_key_here
REED_API_KEY=your_reed_api_key_here
DEBUG=true
```

#### B. API Keys Invalid/Expired
**Cause:** API keys are incorrect or expired
**Solution:**
1. Check API key validity at respective developer portals
2. Generate new API keys if needed
3. Update `.env.local` file

#### C. Network Issues
**Cause:** Internet connectivity problems
**Solution:**
1. Check internet connection
2. Verify firewall settings
3. Try accessing API endpoints directly

### Issue 2: Location-Based Search Not Working

**Symptoms:**
- Jobs from wrong locations
- No location-specific results
- Generic results regardless of location

**Solutions:**

#### A. Enhanced Location Handling
The system now automatically enhances Indian city searches:
- `Mumbai` → `Mumbai, India`
- `Delhi` → `Delhi, India`
- `India` → `Mumbai, Delhi, Bangalore, India`

#### B. Supported Indian Cities
The system recognizes these Indian cities:
- Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Pune
- Kolkata, Ahmedabad, Gurgaon, Noida, Kochi, Indore
- Jaipur, Lucknow, Kanpur, Nagpur, Visakhapatnam, Patna
- Vadodara, Ghaziabad, Ludhiana, Agra, Nashik, Faridabad

#### C. Location Format Tips
- Use city names: `Mumbai`, `Delhi`, `Bangalore`
- Use state names: `Maharashtra`, `Karnataka`
- Use generic: `India` (searches across major cities)

### Issue 3: API Rate Limits

**Symptoms:**
- Intermittent failures
- "Rate limit exceeded" errors
- Inconsistent results

**Solutions:**

#### A. SerpApi Limits
- Free plan: 100 searches/month
- Upgrade to paid plan for more searches
- Implement caching (already built-in)

#### B. Adzuna Limits
- Free tier: 1,000 calls/month
- Monitor usage at Adzuna developer portal
- Implement request throttling if needed

#### C. Reed API Limits
- Check Reed developer portal for limits
- Implement proper error handling

### Issue 4: Slow Response Times

**Symptoms:**
- Long loading times
- Timeout errors
- Poor user experience

**Solutions:**

#### A. Caching
- Results are cached for 5 minutes
- Clear cache: `POST /api/jobs/debug` with `{"action":"clearCache"}`
- Check cache stats: `GET /api/jobs/debug`

#### B. API Optimization
- Reduce result limits
- Use specific search terms
- Implement pagination

## 🔧 Debugging Tools

### 1. Debug API Endpoint
```bash
# Check API status and configuration
GET http://localhost:3000/api/jobs/debug

# Test search functionality
GET http://localhost:3000/api/jobs/debug?test=true

# Clear cache
POST http://localhost:3000/api/jobs/debug
Content-Type: application/json
{"action":"clearCache"}

# Test specific search
POST http://localhost:3000/api/jobs/debug
Content-Type: application/json
{"action":"testSearch","params":{"query":"software engineer","location":"Mumbai","limit":5}}
```

### 2. Environment Check
```bash
# Check if environment variables are loaded
node -e "console.log('SERPAPI_KEY:', !!process.env.SERPAPI_KEY)"
node -e "console.log('ADZUNA_APP_ID:', !!process.env.ADZUNA_APP_ID)"
node -e "console.log('REED_API_KEY:', !!process.env.REED_API_KEY)"
```

### 3. Direct API Testing
```bash
# Test main jobs API
curl "http://localhost:3000/api/jobs?q=software%20engineer&location=Mumbai&limit=5"

# Test SerpApi directly
curl "http://localhost:3000/api/jobs/serpapi?q=software%20engineer&location=Mumbai"

# Test Adzuna directly
curl "http://localhost:3000/api/jobs/search?what=software%20engineer&where=Mumbai"
```

## 📊 API Status Monitoring

### Check API Status
```javascript
// In browser console or Node.js
fetch('/api/jobs/debug')
  .then(res => res.json())
  .then(data => console.log('API Status:', data.apiStatus));
```

### Expected Response
```json
{
  "apiStatus": {
    "serpApi": true,
    "adzuna": false,
    "reed": false
  },
  "environment": {
    "SERPAPI_KEY": true,
    "ADZUNA_APP_ID": false,
    "ADZUNA_API_KEY": false,
    "REED_API_KEY": false
  }
}
```

## 🛠️ Setup Instructions

### Quick Setup
1. **Run setup script:**
   ```bash
   node setup-job-apis.js
   ```

2. **Restart development server:**
   ```bash
   npm run dev
   ```

3. **Test the setup:**
   - Visit: `http://localhost:3000/jobs`
   - Check debug endpoint: `http://localhost:3000/api/jobs/debug`

### Manual Setup
1. **Create `.env.local` file:**
   ```env
   SERPAPI_KEY=4e28d11218306cbed8fce998a79a06c28c0d314029913b0aab19bc3e1dcb1ba6
   ADZUNA_APP_ID=your_adzuna_app_id_here
   ADZUNA_API_KEY=your_adzuna_api_key_here
   REED_API_KEY=your_reed_api_key_here
   DEBUG=true
   ```

2. **Get API keys:**
   - SerpApi: https://serpapi.com/
   - Adzuna: https://developer.adzuna.com/
   - Reed: https://www.reed.co.uk/developers

## 🎯 Best Practices

### 1. Search Optimization
- Use specific job titles: `"React Developer"` instead of `"developer"`
- Include location: `"Mumbai"` or `"India"`
- Use relevant keywords: `"JavaScript"`, `"Python"`, `"Data Scientist"`

### 2. Error Handling
- Always check `success` field in API responses
- Handle empty results gracefully
- Provide fallback to sample data

### 3. Performance
- Implement proper caching
- Use pagination for large result sets
- Monitor API usage and limits

### 4. User Experience
- Show loading states during searches
- Display helpful error messages
- Provide search suggestions

## 📞 Support

### Getting Help
1. **Check debug endpoint first:** `/api/jobs/debug`
2. **Review console logs** for detailed error messages
3. **Test individual APIs** to isolate issues
4. **Check API documentation** for service-specific issues

### Common Error Messages
- `"API keys not configured"` → Run setup script
- `"Rate limit exceeded"` → Check API usage limits
- `"Network error"` → Check internet connection
- `"No jobs found"` → Try different search terms

### API Service Status
- SerpApi: https://status.serpapi.com/
- Adzuna: Check developer portal
- Reed: https://status.reed.co.uk/

---

## 🚀 Quick Fix Checklist

- [ ] Environment variables set in `.env.local`
- [ ] Development server restarted
- [ ] Debug endpoint shows API status
- [ ] Test search returns results
- [ ] Location-based search working
- [ ] Error handling implemented
- [ ] Caching working properly

If you're still having issues after going through this guide, please check the console logs and debug endpoint output for specific error messages. 