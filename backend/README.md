# Job Portal FastAPI Backend

A production-ready FastAPI backend for the dynamic job search portal with real-time search, database integration, Google fallback, and location-based filtering.

## 🚀 Features

- **Real-time Job Search**: Dynamic search with multiple filters
- **Database Integration**: Support for both MySQL and MongoDB
- **Google Search Fallback**: Automatic fallback to Google/LinkedIn/Indeed when no results found
- **Location Intelligence**: Smart location validation and suggestions for multiple countries
- **Caching System**: Redis-based caching for improved performance
- **Rate Limiting**: Built-in API rate limiting and security
- **Analytics Tracking**: User activity and search analytics
- **Production Ready**: Comprehensive error handling and logging

## 📋 Prerequisites

- Python 3.11+
- MySQL 8.0+ or MongoDB 4.4+
- Redis 6.0+
- NGINX (for production)

## 🔧 Quick Setup (Development)

### 1. Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Start Services

```bash
# Start Redis (if not running)
redis-server

# Start MySQL (if not running)
sudo systemctl start mysql
```

### 4. Run Backend

```bash
# Development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or with auto-reload
python -m uvicorn main:app --reload
```

### 5. Test API

```bash
curl http://localhost:8000/health
curl "http://localhost:8000/api/jobs/search?q=developer&location=Mumbai&country=IN"
```

## 🌐 Production Deployment (Hostinger KVM 2)

### Option 1: Automated Deployment (Recommended)

```powershell
# Windows PowerShell
.\deploy-hostinger-backend.ps1 -ServerIP "your.server.ip" -Username "your-username" -Domain "your-domain.com"
```

```bash
# Linux/Mac
chmod +x deploy-hostinger-backend.sh
./deploy-hostinger-backend.sh
```

### Option 2: Manual Deployment

1. **Upload Files**
   ```bash
   scp -r backend/ user@your-server:/home/user/jobportal-backend/
   ```

2. **SSH to Server**
   ```bash
   ssh user@your-server
   cd /home/user/jobportal-backend
   ```

3. **Run Deployment Script**
   ```bash
   chmod +x deploy-hostinger-backend.sh
   ./deploy-hostinger-backend.sh
   ```

4. **Configure SSL**
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

## 📊 API Endpoints

### Health Check
```
GET /health
```

### Job Search
```
GET /api/jobs/search
```

**Parameters:**
- `q` (optional): Search query
- `location` (optional): Job location
- `country` (optional): Country code (IN, US, GB, AE)
- `job_type` (optional): full_time, part_time, contract, internship
- `experience_level` (optional): entry, mid, senior, executive
- `remote` (optional): true/false
- `salary_min` (optional): Minimum salary
- `salary_max` (optional): Maximum salary
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Results per page (default: 20, max: 100)

**Example:**
```bash
curl "http://localhost:8000/api/jobs/search?q=python+developer&location=Mumbai&country=IN&job_type=full_time&experience_level=mid&page=1&per_page=20"
```

**Response:**
```json
{
  "jobs": [
    {
      "id": "job-123",
      "title": "Senior Python Developer",
      "company": "TechCorp Inc",
      "location": "Mumbai, India",
      "description": "Join our team...",
      "salary_formatted": "₹15-25 LPA",
      "time_ago": "2 hours ago",
      "redirect_url": "https://example.com/job/123",
      "is_remote": false,
      "job_type": "full_time",
      "skills": ["Python", "Django", "PostgreSQL"]
    }
  ],
  "total": 150,
  "page": 1,
  "per_page": 20,
  "total_pages": 8,
  "has_google_fallback": false,
  "google_fallback_urls": []
}
```

## 🗄️ Database Configuration

### MySQL Setup
```sql
CREATE DATABASE jobportal;
CREATE USER 'jobportal_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON jobportal.* TO 'jobportal_user'@'localhost';
FLUSH PRIVILEGES;
```

### MongoDB Setup
```javascript
use jobportal
db.createUser({
  user: "jobportal_user",
  pwd: "your_password",
  roles: ["readWrite"]
})
```

### Environment Variables
```env
# Database Configuration
DATABASE_TYPE=mysql  # or mongodb
DATABASE_URL=mysql+aiomysql://jobportal_user:your_password@localhost:3306/jobportal

# For MongoDB
MONGODB_URL=mongodb://jobportal_user:your_password@localhost:27017
MONGODB_DATABASE=jobportal

# Redis Configuration
REDIS_URL=redis://localhost:6379/0
CACHE_TTL=300

# Security
SECRET_KEY=your-super-secret-key-here
ALLOWED_ORIGINS=["http://localhost:3000", "https://your-domain.com"]
```

## 🌍 Supported Countries

The API supports job searches in:
- 🇮🇳 **India (IN)**: Mumbai, Delhi, Bangalore, Hyderabad, Pune, Chennai, etc.
- 🇺🇸 **United States (US)**: New York, San Francisco, Los Angeles, Chicago, Seattle, etc.
- 🇬🇧 **United Kingdom (GB)**: London, Manchester, Birmingham, Edinburgh, Leeds, etc.
- 🇦🇪 **UAE (AE)**: Dubai, Abu Dhabi, Sharjah, Ajman, etc.

## 🚦 Rate Limiting

- **Default**: 100 requests per minute per IP
- **Burst**: Up to 20 requests in quick succession
- **Headers**: Rate limit info included in response headers

## 📈 Monitoring & Logging

### View Logs
```bash
# Application logs
tail -f /home/user/jobportal-backend/backend/logs/app.log

# System service logs
sudo journalctl -u jobportal-backend -f

# NGINX logs
sudo tail -f /var/log/nginx/access.log
```

### Health Monitoring
```bash
# Check service status
sudo systemctl status jobportal-backend

# Check API health
curl http://localhost:8000/health
```

## 🔒 Security Features

- **CORS Protection**: Configurable allowed origins
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Pydantic model validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Response headers
- **SSL/TLS**: HTTPS encryption (in production)

## 🛠️ Development

### Running Tests
```bash
pip install pytest pytest-asyncio
pytest
```

### Code Quality
```bash
pip install black flake8 mypy
black .
flake8 .
mypy .
```

### Database Migrations
```bash
# Initialize sample data
python -c "from services.database_service import DatabaseService; import asyncio; asyncio.run(DatabaseService().initialize_database())"
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check MySQL service
   sudo systemctl status mysql
   
   # Check connection
   mysql -u jobportal_user -p jobportal
   ```

2. **Redis Connection Failed**
   ```bash
   # Check Redis service
   sudo systemctl status redis
   
   # Test connection
   redis-cli ping
   ```

3. **API Not Responding**
   ```bash
   # Check service status
   sudo systemctl status jobportal-backend
   
   # Check logs
   sudo journalctl -u jobportal-backend -f
   ```

4. **NGINX Issues**
   ```bash
   # Test configuration
   sudo nginx -t
   
   # Reload configuration
   sudo systemctl reload nginx
   ```

### Debug Mode
```bash
# Run with debug logging
LOG_LEVEL=DEBUG uvicorn main:app --reload
```

## 📞 Support

- **Documentation**: Visit `/docs` endpoint for interactive API docs
- **Logs**: Check application and system logs for errors
- **Health Check**: Use `/health` endpoint to verify service status

## 🔄 Updates & Maintenance

### Update Backend
```bash
# Pull latest code
git pull origin main

# Update dependencies
pip install -r requirements.txt

# Restart service
sudo systemctl restart jobportal-backend
```

### Database Backup
```bash
# MySQL backup
mysqldump -u jobportal_user -p jobportal > backup_$(date +%Y%m%d).sql

# MongoDB backup
mongodump --db jobportal --out backup_$(date +%Y%m%d)
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**🚀 Ready to deploy? Use the automated deployment scripts for quickest setup!**
