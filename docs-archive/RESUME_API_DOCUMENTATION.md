# Resume Management API Documentation

## Overview

The Resume Management API is a comprehensive RESTful service built with **Next.js API routes** that provides AI-powered resume analysis, generation, and management capabilities. This API supports the complete resume lifecycle from creation and analysis to export and sharing.

## Base URL
```
http://localhost:3000/api/resumes
```

## Authentication

The API supports multiple authentication methods:

- **x-user-id Header**: `x-user-id: user-123` (recommended for development)
- **Query Parameter**: `?userId=user-123`
- **JWT Token**: `Authorization: Bearer <token>` (production)
- **Session-based**: Automatic for logged-in users

Some endpoints work without authentication but provide enhanced features when authenticated.

## API Endpoints

### 1. Resume Analysis

**Endpoint**: `POST /api/resumes/analyze`

Analyze resume content for completeness, ATS compatibility, and improvement suggestions.

**Request Body**:
```json
{
  "resumeData": {
    "fullName": "John Doe",
    "contact": {
      "email": "john.doe@example.com",
      "phone": "+1-555-123-4567"
    },
    "summary": "Experienced software developer...",
    "skills": ["JavaScript", "React", "Node.js"]
    // ... other resume fields
  },
  "userId": "user-123"
}
```

**Alternative with raw text**:
```json
{
  "resumeText": "John Doe\\nSoftware Engineer\\nEmail: john@example.com...",
  "userId": "user-123"
}
```

**Response**:
```json
{
  "success": true,
  "analysis": {
    "completeness": 85,
    "atsScore": 78,
    "issues": ["Missing LinkedIn profile"],
    "suggestions": ["Add quantified achievements"],
    "missingFields": ["linkedin"],
    "strengthAreas": ["Technical skills", "Work experience"],
    "weaknessAreas": ["Professional summary length"],
    "duplicateContent": [],
    "conflicts": []
  },
  "enhancedData": {
    // AI-enhanced version of resume data
  }
}
```

**Features**:
- Completeness scoring (0-100%)
- ATS compatibility assessment
- Duplicate content detection
- Date conflict identification
- Personalized improvement suggestions
- AI-enhanced data generation

### 2. AI Resume Generation

**Endpoint**: `POST /api/resumes/generate`

Generate professional, ATS-friendly resumes using AI based on job requirements.

**Request Body**:
```json
{
  "jobDescription": "We are seeking a Senior Frontend Developer...",
  "targetRole": "Senior Frontend Developer",
  "experienceLevel": "senior",
  "industryType": "Technology",
  "preferences": {
    "tone": "professional",
    "length": "detailed",
    "focus": "skills"
  },
  "existingData": {
    "fullName": "Jane Smith",
    "contact": {
      "email": "jane@example.com"
    }
  },
  "userId": "user-123"
}
```

**Response**:
```json
{
  "success": true,
  "resumeData": {
    "fullName": "Jane Smith",
    "contact": {
      "email": "jane@example.com",
      "phone": "+1-555-123-4567",
      "linkedin": "https://linkedin.com/in/janesmith"
    },
    "summary": "Results-driven senior frontend developer...",
    "skills": ["React", "TypeScript", "JavaScript", "CSS"],
    "workExperience": [
      {
        "jobTitle": "Senior Frontend Developer",
        "company": "Tech Innovations",
        "startDate": "2020-01",
        "endDate": "Present",
        "responsibilities": [
          "Led development of React applications",
          "Mentored junior developers"
        ]
      }
    ]
    // ... other generated fields
  },
  "suggestions": [
    "Consider adding specific metrics",
    "Include relevant certifications"
  ],
  "atsOptimizations": [
    "Add 'Agile methodology' keyword",
    "Include years of experience in descriptions"
  ],
  "alternativeVersions": {
    "skillsFocused": { /* skills-focused version */ },
    "experienceFocused": { /* experience-focused version */ }
  }
}
```

**Features**:
- Job description optimization
- Industry-specific customization
- Experience-level appropriate content
- Multiple resume versions
- ATS keyword optimization
- Integration with existing data

### 3. File Upload and Processing

**Endpoint**: `POST /api/resumes/upload`

Upload and process resume files (PDF, DOCX, TXT) with automatic text extraction and parsing.

**Request**: Multipart form data
```
Content-Type: multipart/form-data

file: [Resume file - PDF/DOCX/TXT]
userId: user-123
```

**cURL Example**:
```bash
curl -X POST \\
  -H "x-user-id: user-123" \\
  -F "file=@resume.pdf" \\
  -F "userId=user-123" \\
  http://localhost:3000/api/resumes/upload
```

**Response**:
```json
{
  "success": true,
  "extractedText": "John Doe\\nSoftware Engineer\\nEmail: john@example.com...",
  "parsedData": {
    "fullName": "John Doe",
    "contact": {
      "email": "john@example.com",
      "phone": "+1-555-123-4567"
    },
    "summary": "Experienced software engineer...",
    "skills": ["JavaScript", "React", "Node.js"],
    // ... other parsed fields
  },
  "confidence": 85,
  "issues": ["Could not extract education details"],
  "resumeId": "resume-abc123"
}
```

**Supported Formats**:
- **PDF**: Text extraction (non-OCR)
- **DOCX**: Microsoft Word documents
- **TXT**: Plain text files
- **File Size Limit**: 10MB

**Features**:
- Multi-format file support
- Automatic text extraction
- AI-powered data parsing
- Confidence scoring (0-100%)
- Issue detection and reporting
- Automatic resume saving

### 4. Resume Retrieval

**Endpoint**: `GET /api/resumes/{id}`

Retrieve a specific resume with full details, metadata, and version history.

**Headers**:
```
x-user-id: user-123
```

**Response**:
```json
{
  "success": true,
  "resume": {
    "id": "resume-abc123",
    "userId": "user-123",
    "data": {
      // Complete resume data
    },
    "createdAt": "2025-08-12T10:00:00Z",
    "updatedAt": "2025-08-12T14:30:00Z",
    "version": 3,
    "metadata": {
      "atsScore": 85,
      "completeness": 90,
      "lastAnalyzed": "2025-08-12T14:30:00Z"
    }
  }
}
```

### 5. Resume Update

**Endpoint**: `PUT /api/resumes/{id}`

Update resume data with automatic change tracking and version control.

**Request Body**:
```json
{
  "data": {
    // Updated resume data
  },
  "changeNotes": "Added new skills and updated summary",
  "reanalyze": true
}
```

**Response**:
```json
{
  "success": true,
  "resume": {
    // Updated resume data
  },
  "changes": {
    "fieldsModified": ["summary", "skills"],
    "previousVersion": 2,
    "newVersion": 3
  },
  "analysis": {
    // New analysis if reanalyze=true
  }
}
```

**Features**:
- Automatic change detection
- Version control
- Optional reanalysis
- Change notes tracking

### 6. Resume Export

**Endpoint**: `POST /api/resumes/{id}/export`

Export resumes in multiple formats with customization options.

**Request Body**:
```json
{
  "format": "pdf",
  "template": "modern",
  "customizations": {
    "theme": "blue",
    "layout": "two-column",
    "sections": ["summary", "experience", "skills", "education"]
  }
}
```

**Response**:
```json
{
  "success": true,
  "downloadUrl": "https://your-domain.com/download/resume-abc123.pdf?token=xyz789",
  "fileName": "John_Doe_Resume.pdf",
  "fileSize": 245760,
  "expiresAt": "2025-08-13T12:00:00Z"
}
```

**Export Formats**:
- **PDF**: Professional documents with templates
- **DOCX**: Editable Microsoft Word format
- **JSON**: Structured data format
- **TXT**: Plain text format

**Templates Available**:
- **Modern**: Clean, contemporary design
- **Classic**: Traditional professional format
- **Minimal**: Simple, ATS-friendly design
- **Creative**: Eye-catching with visual elements

### 7. Resume Listing

**Endpoint**: `GET /api/resumes`

List all resumes for a user with pagination, sorting, and filtering.

**Query Parameters**:
```
?page=1&limit=10&sortBy=updatedAt&sortOrder=desc&userId=user-123
```

**Response**:
```json
{
  "success": true,
  "resumes": [
    {
      "id": "resume-abc123",
      "userId": "user-123",
      "fullName": "John Doe",
      "createdAt": "2025-08-12T10:00:00Z",
      "updatedAt": "2025-08-12T14:30:00Z",
      "version": 3,
      "metadata": {
        "atsScore": 85,
        "completeness": 90,
        "lastAnalyzed": "2025-08-12T14:30:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

### 8. Resume Operations

**Endpoint**: `POST /api/resumes`

Perform various resume operations including creation, duplication, and batch analysis.

**Create Resume**:
```json
{
  "action": "create",
  "data": {
    // Resume data
  }
}
```

**Duplicate Resume**:
```json
{
  "action": "duplicate",
  "sourceId": "resume-abc123",
  "modifications": {
    "fullName": "John Doe (Copy)",
    "summary": "Modified summary"
  }
}
```

**Batch Analysis**:
```json
{
  "action": "batch-analyze",
  "resumeIds": ["resume-abc123", "resume-def456"]
}
```

## Data Schema

### ResumeData Structure

```typescript
{
  fullName: string;
  contact: {
    email: string;
    phone?: string;
    address?: string;
    linkedin?: string;
    portfolio?: string;
  };
  summary: string;
  skills: string[];
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    gpa?: string;
    details?: string;
  }>;
  workExperience: Array<{
    jobTitle: string;
    company: string;
    startDate: string;
    endDate: string;
    responsibilities: string[];
    achievements?: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    achievements?: string[];
  }>;
  certifications: string[];
  languages?: Array<{
    language: string;
    proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Native';
  }>;
  awards?: string[];
}
```

## Error Handling

All API responses follow a consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": ["Additional context information"],
    "field": "specific_field_name"
  },
  "timestamp": "2025-08-12T12:00:00Z"
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Invalid input data
- `AUTHENTICATION_REQUIRED`: Missing or invalid authentication
- `RESUME_NOT_FOUND`: Requested resume does not exist
- `ANALYSIS_FAILED`: Resume analysis could not be completed
- `GENERATION_FAILED`: Resume generation encountered an error
- `UPLOAD_FAILED`: File upload or processing failed
- `EXPORT_FAILED`: Resume export could not be completed

## Rate Limits

- **Analysis**: 100 requests per hour per user
- **Generation**: 20 requests per hour per user
- **Upload**: 50 requests per hour per user
- **Export**: 100 requests per hour per user
- **General**: 1000 requests per hour per user

## Testing

Use the provided test script to verify all endpoints:

```bash
node scripts/test-resume-api.js
```

The test script covers:
- ✅ API documentation retrieval
- ✅ Resume analysis (data and text)
- ✅ AI resume generation
- ✅ File upload and processing
- ✅ Resume CRUD operations
- ✅ Export functionality
- ✅ Bulk operations

## Security Features

- Input validation and sanitization
- User authentication and authorization
- Secure file processing
- Rate limiting and abuse prevention
- Audit logging
- Temporary download URLs with expiration

## Integration Examples

### JavaScript/TypeScript
```typescript
const response = await fetch('/api/resumes/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'user-123'
  },
  body: JSON.stringify({
    resumeData: resumeData
  })
});

const result = await response.json();
```

### React Hook Example
```typescript
const useResumeAnalysis = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const analyzeResume = async (resumeData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/resumes/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData })
      });
      const result = await response.json();
      setAnalysis(result.analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return { analysis, loading, analyzeResume };
};
```

## Support

- **Documentation**: Each endpoint provides detailed docs with `?docs=true`
- **Testing**: Comprehensive test suite included
- **Examples**: Real-world usage examples provided
- **Error Handling**: Detailed error messages with specific guidance

For additional support or questions, refer to the individual endpoint documentation or run the test suite to verify functionality.
