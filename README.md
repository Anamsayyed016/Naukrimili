# Job Portal - AI-Powered Resume Parser

A FastAPI-based job portal application that uses AI/NLP to parse resumes, extract structured data, and calculate ATS compatibility scores.

## Features

- **AI-Powered Resume Parsing**: Uses OpenAI GPT-4 and spaCy for intelligent text extraction
- **Multiple File Formats**: Supports PDF and DOCX resume uploads
- **Skills Extraction**: Automatically identifies technical skills from resumes
- **Experience Summarization**: AI-generated summaries of work experience
- **ATS Scoring**: Calculates Applicant Tracking System compatibility scores
- **MongoDB Storage**: Stores parsed resume data with full CRUD operations
- **S3 Integration**: Uploads original resume files to AWS S3
- **RESTful API**: Full REST API with FastAPI and automatic documentation

## Quick Start

### Prerequisites

- Python 3.8+
- MongoDB running locally or connection string
- OpenAI API key
- AWS credentials (for S3 storage)

### Installation

1. **Clone and setup**:
   ```bash
   cd jobportal
   python setup.py
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys
   ```

3. **Start the application**:
   ```bash
   uvicorn main:app --reload
   ```

4. **Access the API**:
   - API Documentation: http://localhost:8000/docs
   - API Base URL: http://localhost:8000

## API Endpoints

### Upload Resume
```http
POST /resumes/upload
Content-Type: multipart/form-data

Parameters:
- user_id (string): User identifier
- job_id (string, optional): Job identifier
- file (file): Resume file (PDF or DOCX)

Response:
{
  "resume_id": "64a1b2c3d4e5f6789012345"
}
```

### Get Latest Resume
```http
GET /resumes/{user_id}/latest

Response:
{
  "userId": "user123",
  "aiData": {
    "skills": ["Python", "JavaScript", "React"],
    "experience": [...]
  },
  "atsScore": 85.5,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Get All Resumes
```http
GET /resumes/{user_id}/all

Response:
{
  "resumes": [...]
}
```

### Update Resume
```http
PUT /resumes/{resume_id}/edit
Content-Type: application/json

{
  "skills": ["Updated", "Skills", "List"],
  "experience": [...]
}
```

### Delete Resume
```http
DELETE /resumes/{resume_id}

Response:
{
  "status": "deleted"
}
```

## Architecture

### Resume Parser Pipeline

1. **File Processing**: Extracts text from PDF/DOCX files
2. **Skills Extraction**: Uses spaCy NLP + keyword matching
3. **Experience Parsing**: GPT-4 summarizes work experience
4. **ATS Scoring**: Calculates compatibility score based on structure
5. **Storage**: Saves to MongoDB with file hash for deduplication

### Data Flow

```
Resume Upload → Text Extraction → AI Processing → Database Storage
                                      ↓
                               S3 File Storage
```

## Configuration

### Environment Variables

```bash
# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# MongoDB
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=naurkrimili

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=naurkrimili-resumes

# App Settings
DEBUG=True
```

## Dependencies

### Core Dependencies
- FastAPI: Web framework
- PyMongo: MongoDB driver
- Boto3: AWS SDK

### AI/NLP Dependencies
- spaCy: NLP processing
- OpenAI: GPT-4 API client
- PyPDF2: PDF text extraction
- python-docx: DOCX text extraction

### Installation
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

## Testing

Run the test suite:
```bash
python test_app.py
```

Tests include:
- Dependency verification
- Resume parser functionality
- FastAPI app initialization
- Basic integration tests

## Development

### Project Structure
```
jobportal/
├── main.py              # FastAPI application
├── resume_parser.py     # AI/NLP resume processing
├── test_app.py         # Test suite
├── setup.py            # Installation script
├── requirements.txt    # Python dependencies
├── .env.example       # Environment template
└── README.md          # This file
```

### Adding New Features

1. **New AI Models**: Update `resume_parser.py` with new model integrations
2. **New File Formats**: Extend `extract_text_from_file()` function
3. **Enhanced Scoring**: Improve ATS scoring logic in `calculate_ats_score()`
4. **API Endpoints**: Add new endpoints to `main.py`

## Troubleshooting

### Common Issues

1. **spaCy Model Missing**:
   ```bash
   python -m spacy download en_core_web_sm
   ```

2. **OpenAI API Errors**:
   - Check your API key in `.env`
   - Verify API quota/billing
   - Handle rate limiting in production

3. **MongoDB Connection**:
   - Ensure MongoDB is running
   - Check connection string in `.env`

4. **S3 Upload Errors**:
   - Verify AWS credentials
   - Check bucket permissions
   - Ensure bucket exists

### Performance Tips

- Use smaller spaCy models for faster processing
- Implement caching for frequently accessed data
- Add request rate limiting
- Use background tasks for heavy AI processing

## License

This project is for educational/development purposes. Update with your actual license.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues and questions:
- Check the test output: `python test_app.py`
- Review FastAPI docs: http://localhost:8000/docs
- Check logs for detailed error messages
