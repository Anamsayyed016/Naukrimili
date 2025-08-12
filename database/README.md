# PostgreSQL Database Configuration for Resume Management

## Overview

This document provides setup instructions, configuration guidelines, and best practices for the PostgreSQL database schema designed for the Resume Management API.

## Database Schema Features

### 🏗️ **Core Architecture**
- **JSONB Storage**: Flexible resume data storage with efficient querying
- **Version Control**: Complete audit trail with automatic versioning
- **Full-Text Search**: Advanced search capabilities across resume content
- **AI Integration**: Dedicated tables for analysis results and suggestions
- **Performance Optimized**: Strategic indexing for high-performance queries

### 📊 **Key Tables**

| Table | Purpose | Key Features |
|-------|---------|-------------|
| `resumes` | Core resume storage | JSONB data, metadata, versioning |
| `resume_versions` | Version history | Complete audit trail, change tracking |
| `resume_analyses` | AI analysis results | Scoring, suggestions, job-specific analysis |
| `ai_suggestions` | AI recommendations | Categorized suggestions with tracking |
| `resume_search_index` | Search optimization | Full-text search vectors |
| `resume_shares` | Collaboration | Secure sharing with access controls |
| `resume_exports` | Export tracking | Format management, download analytics |

## Setup Instructions

### 1. Prerequisites

```bash
# Install PostgreSQL 14+
sudo apt-get install postgresql-14 postgresql-contrib-14

# Install required extensions
sudo apt-get install postgresql-14-contrib
```

### 2. Database Creation

```sql
-- Create database
CREATE DATABASE resume_management 
WITH 
    ENCODING 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE template0;

-- Connect to the database
\c resume_management;

-- Create application user
CREATE USER resume_api_user WITH PASSWORD 'your_secure_password';
```

### 3. Schema Deployment

```bash
# Execute the schema file
psql -U postgres -d resume_management -f database/schema.sql

# Verify tables were created
psql -U postgres -d resume_management -c "\dt"
```

### 4. Environment Configuration

Create or update your `.env` file:

```env
# Database Configuration
DATABASE_URL="postgresql://resume_api_user:your_secure_password@localhost:5432/resume_management"
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=resume_management
POSTGRES_USER=resume_api_user
POSTGRES_PASSWORD=your_secure_password

# Connection Pool Settings
POSTGRES_MAX_CONNECTIONS=20
POSTGRES_IDLE_TIMEOUT=30000
POSTGRES_CONNECTION_TIMEOUT=10000
```

## JSONB Schema Structure

### Resume Data Format

The `resumes.data` JSONB column stores resume information in this structure:

```json
{
  "fullName": "John Doe",
  "contact": {
    "email": "john.doe@example.com",
    "phone": "+1-555-123-4567",
    "address": "123 Main St, City, State",
    "linkedin": "https://linkedin.com/in/johndoe",
    "portfolio": "https://johndoe.dev"
  },
  "summary": "Experienced software engineer with 5+ years...",
  "skills": ["JavaScript", "React", "Node.js", "PostgreSQL"],
  "education": [
    {
      "degree": "Bachelor of Science in Computer Science",
      "institution": "University of Technology",
      "year": "2018",
      "gpa": "3.8",
      "details": "Graduated Summa Cum Laude"
    }
  ],
  "workExperience": [
    {
      "jobTitle": "Senior Software Engineer",
      "company": "Tech Innovations Inc.",
      "startDate": "2021-03",
      "endDate": "Present",
      "responsibilities": [
        "Led development of microservices architecture",
        "Mentored junior developers and conducted code reviews"
      ],
      "achievements": [
        "Reduced application load time by 40%",
        "Improved test coverage from 60% to 95%"
      ]
    }
  ],
  "projects": [
    {
      "name": "E-commerce Platform",
      "description": "Built a scalable e-commerce platform...",
      "technologies": ["React", "Node.js", "MongoDB", "AWS"],
      "url": "https://github.com/johndoe/ecommerce",
      "achievements": ["Handled 10,000+ concurrent users"]
    }
  ],
  "certifications": [
    "AWS Certified Solutions Architect",
    "Google Cloud Professional Developer"
  ],
  "languages": [
    {"language": "English", "proficiency": "Native"},
    {"language": "Spanish", "proficiency": "Intermediate"}
  ],
  "awards": [
    "Employee of the Year 2022",
    "Best Innovation Award 2021"
  ]
}
```

### Analysis Data Format

The `resumes.analysis_data` JSONB column stores AI analysis results:

```json
{
  "completeness": 85,
  "atsScore": 78,
  "issues": ["Missing LinkedIn profile", "Limited quantified achievements"],
  "suggestions": [
    "Add more specific metrics to achievements",
    "Include relevant industry keywords"
  ],
  "missingFields": ["linkedin", "portfolio"],
  "strengthAreas": ["Technical skills", "Work experience depth"],
  "weaknessAreas": ["Professional summary length", "Education details"],
  "duplicateContent": [],
  "conflicts": [],
  "keywordAnalysis": {
    "jobRelevantKeywords": ["JavaScript", "React", "Node.js"],
    "missingKeywords": ["TypeScript", "AWS", "Docker"],
    "keywordDensity": 0.12
  },
  "sectionAnalysis": {
    "summary": {"score": 75, "wordCount": 45, "issues": []},
    "skills": {"score": 90, "count": 12, "relevantCount": 8},
    "experience": {"score": 85, "count": 3, "avgDuration": "2.5 years"}
  }
}
```

## Performance Optimization

### 1. JSONB Indexing Strategy

```sql
-- Primary JSONB indexes for common queries
CREATE INDEX CONCURRENTLY idx_resumes_data_gin ON resumes USING GIN (data);

-- Specific field indexes for frequent searches
CREATE INDEX CONCURRENTLY idx_resumes_fullname 
ON resumes USING GIN ((data->>'fullName') gin_trgm_ops);

CREATE INDEX CONCURRENTLY idx_resumes_email 
ON resumes USING GIN ((data->'contact'->>'email') gin_trgm_ops);

-- Skills array index for skill-based searches
CREATE INDEX CONCURRENTLY idx_resumes_skills 
ON resumes USING GIN ((data->'skills'));

-- Compound indexes for complex queries
CREATE INDEX CONCURRENTLY idx_resumes_user_status_updated 
ON resumes(user_id, status, updated_at DESC);
```

### 2. Query Optimization Examples

```sql
-- Efficient skill-based search
SELECT id, data->>'fullName' as name, data->'skills' as skills
FROM resumes 
WHERE data->'skills' ? 'React' 
AND status = 'published';

-- Full-text search across resume content
SELECT r.id, r.data->>'fullName', ts_rank(rsi.search_vector, query) as rank
FROM resumes r
JOIN resume_search_index rsi ON r.id = rsi.resume_id
JOIN plainto_tsquery('english', 'software engineer react') query ON true
WHERE rsi.search_vector @@ query
ORDER BY rank DESC;

-- Experience level filtering
SELECT id, data->>'fullName'
FROM resumes 
WHERE jsonb_array_length(data->'workExperience') >= 3
AND status = 'published';
```

### 3. Maintenance Procedures

```sql
-- Regular maintenance tasks
DO $$
BEGIN
    -- Update table statistics
    ANALYZE resumes;
    ANALYZE resume_versions;
    ANALYZE resume_search_index;
    
    -- Clean up expired exports
    PERFORM cleanup_expired_exports();
    
    -- Archive old versions (keep last 10)
    PERFORM archive_old_versions(10);
END $$;
```

## Security Configuration

### 1. Row Level Security (RLS)

```sql
-- Enable RLS on sensitive tables
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;

-- Create user isolation policy
CREATE POLICY user_data_isolation ON resumes
FOR ALL TO resume_api_user
USING (user_id = current_setting('app.current_user_id')::UUID);
```

### 2. Application Security Setup

```javascript
// Set user context for RLS
await client.query('SET app.current_user_id = $1', [userId]);

// Ensure secure queries
const userResumes = await client.query(`
    SELECT id, title, data, created_at 
    FROM resumes 
    WHERE status = 'published'
    ORDER BY updated_at DESC
`);
```

## Backup and Recovery

### 1. Backup Strategy

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/resume_management"
mkdir -p $BACKUP_DIR

# Full database backup
pg_dump -U postgres -h localhost resume_management > \
    $BACKUP_DIR/resume_management_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/resume_management_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### 2. Point-in-Time Recovery Setup

```sql
-- Enable WAL archiving for PITR
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /backup/wal_archive/%f';
SELECT pg_reload_conf();
```

## Monitoring and Analytics

### 1. Performance Monitoring Queries

```sql
-- Monitor JSONB query performance
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements 
WHERE query LIKE '%data%'
ORDER BY mean_time DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

-- Monitor table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size,
    pg_total_relation_size(tablename::regclass) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;
```

### 2. Usage Analytics Queries

```sql
-- Resume creation trends
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as resumes_created,
    COUNT(DISTINCT user_id) as unique_users
FROM resumes 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date;

-- Popular skills analysis
SELECT 
    skill,
    COUNT(*) as frequency,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM resumes), 2) as percentage
FROM resumes,
LATERAL jsonb_array_elements_text(data->'skills') as skill
WHERE status = 'published'
GROUP BY skill
ORDER BY frequency DESC
LIMIT 20;

-- ATS score distribution
SELECT 
    CASE 
        WHEN ats_score >= 90 THEN '90-100'
        WHEN ats_score >= 80 THEN '80-89'
        WHEN ats_score >= 70 THEN '70-79'
        WHEN ats_score >= 60 THEN '60-69'
        ELSE '0-59'
    END as score_range,
    COUNT(*) as count,
    ROUND(AVG(ats_score), 1) as avg_score
FROM resumes 
WHERE ats_score > 0
GROUP BY score_range
ORDER BY score_range DESC;
```

## Integration with Next.js API

### 1. Database Connection Setup

```typescript
// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export default pool;
```

### 2. Resume Service Database Integration

```typescript
// lib/resume-db-service.ts
import pool from './db';
import { ResumeData, ResumeRecord } from './resume-api-types';

export class ResumeDBService {
  async saveResume(userId: string, data: ResumeData): Promise<ResumeRecord> {
    const client = await pool.connect();
    try {
      await client.query('SET app.current_user_id = $1', [userId]);
      
      const result = await client.query(`
        INSERT INTO resumes (user_id, data, title)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [userId, JSON.stringify(data), data.fullName || 'Untitled Resume']);
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }
  
  async getResume(id: string, userId: string): Promise<ResumeRecord | null> {
    const client = await pool.connect();
    try {
      await client.query('SET app.current_user_id = $1', [userId]);
      
      const result = await client.query(`
        SELECT * FROM resumes 
        WHERE id = $1 AND status != 'deleted'
      `, [id]);
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
}
```

## Best Practices

### 1. JSONB Usage Guidelines

- **Index strategically**: Only index frequently queried fields
- **Validate data**: Always validate JSONB structure before storage
- **Use specific operators**: Prefer `->` and `->>` over general GIN indexes
- **Monitor performance**: Regular analysis of query patterns

### 2. Version Control Best Practices

- **Automatic versioning**: Trigger-based version creation on data changes
- **Selective versioning**: Only version when significant changes occur
- **Version cleanup**: Regular archival of old versions
- **Change tracking**: Detailed logging of modifications

### 3. Search Optimization

- **Full-text vectors**: Maintain search vectors for complex queries
- **Trigram indexes**: Use for partial text matching
- **Composite indexes**: Combine frequently queried fields
- **Regular reindexing**: Periodic index maintenance

### 4. Security Recommendations

- **Row Level Security**: Implement user data isolation
- **Audit logging**: Track all data access and modifications
- **Data encryption**: Consider encrypting sensitive JSONB fields
- **Access controls**: Strict role-based permissions

This database schema provides a robust, scalable foundation for the Resume Management API with optimal performance, security, and maintainability.
