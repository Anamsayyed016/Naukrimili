# Job Portal - Clean Project Structure

## 📁 Directory Structure

```
jobportal/
├── 📁 config/           # Configuration files
│   └── database.js      # Database connection
├── 📁 models/           # Database models
│   ├── User.js          # User model
│   ├── Job.js           # Job model
│   └── Application.js   # Application model
├── 📁 routes/           # API routes
│   ├── auth.js          # Authentication routes
│   ├── jobs.js          # Job CRUD routes
│   └── applications.js  # Application routes
├── 📁 middleware/       # Express middleware
│   └── auth.js          # Authentication middleware
├── 📁 components/       # React components
│   ├── JobCard.tsx      # Job display component
│   ├── JobSearch.tsx    # Search component
│   └── ...
├── 📁 lib/              # Utility libraries
│   └── api-client.ts    # Frontend API client
├── server.js            # Main server file
└── .env.example         # Environment template
```

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  name: String,
  role: 'jobseeker' | 'employer' | 'admin',
  avatar: String,
  bio: String,
  location: String,
  phone: String,
  skills: [String],
  experience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: String
  }],
  company: {
    name: String,
    website: String,
    industry: String,
    size: String
  },
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Jobs Collection
```javascript
{
  _id: ObjectId,
  title: String,
  company: String,
  location: String,
  description: String,
  requirements: [String],
  benefits: [String],
  skills: [String],
  type: 'full-time' | 'part-time' | 'contract' | 'internship',
  level: 'entry' | 'mid' | 'senior' | 'executive',
  remote: Boolean,
  salary: {
    min: Number,
    max: Number,
    currency: String
  },
  postedBy: ObjectId (ref: User),
  status: 'active' | 'paused' | 'closed',
  views: Number,
  applications: Number,
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Applications Collection
```javascript
{
  _id: ObjectId,
  job: ObjectId (ref: Job),
  applicant: ObjectId (ref: User),
  resume: {
    filename: String,
    url: String,
    uploadedAt: Date
  },
  coverLetter: String,
  status: 'pending' | 'reviewing' | 'shortlisted' | 'interviewed' | 'offered' | 'rejected' | 'withdrawn',
  notes: String,
  interview: {
    scheduled: Boolean,
    date: Date,
    type: 'phone' | 'video' | 'in-person',
    notes: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Jobs
- `GET /api/jobs` - Get jobs with search/filters
- `GET /api/jobs/:id` - Get single job
- `POST /api/jobs` - Create job (auth required)
- `PUT /api/jobs/:id` - Update job (owner only)
- `DELETE /api/jobs/:id` - Delete job (owner only)

### Applications
- `GET /api/applications` - Get user applications
- `POST /api/applications` - Apply to job
- `PUT /api/applications/:id` - Update application status

## 🔧 Key Features

### Backend
- **Clean Architecture**: Separated models, routes, middleware
- **Authentication**: JWT-based with role authorization
- **Validation**: Input validation on all endpoints
- **Error Handling**: Consistent error responses
- **Database**: Optimized MongoDB schema with indexes
- **Security**: CORS, rate limiting, input sanitization

### Frontend
- **TypeScript**: Full type safety
- **Components**: Reusable, clean components
- **API Client**: Centralized API communication
- **State Management**: Simple, predictable state
- **Responsive**: Mobile-first design

## 🚀 Getting Started

### Backend Setup
```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your values

# Start development server
npm run dev
```

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 📝 Code Standards

### Naming Conventions
- **Files**: kebab-case (job-card.tsx)
- **Components**: PascalCase (JobCard)
- **Variables**: camelCase (jobData)
- **Constants**: UPPER_CASE (API_BASE_URL)

### Error Handling
- Always return consistent error format
- Use appropriate HTTP status codes
- Log errors for debugging
- Never expose sensitive information

### Database
- Use meaningful field names
- Add indexes for search fields
- Validate data at schema level
- Use references for relationships

## 🔒 Security

- JWT authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Rate limiting
- Environment variable protection

## 📊 Performance

- Database indexes on search fields
- Pagination for large datasets
- Optimized queries with population
- Frontend component optimization
- API response caching (future)

This structure provides a clean, maintainable, and scalable foundation for the job portal application.