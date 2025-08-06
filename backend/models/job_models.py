"""
Pydantic models for job search API
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from enum import Enum

class JobType(str, Enum):
    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    CONTRACT = "contract"
    FREELANCE = "freelance"
    INTERNSHIP = "internship"
    REMOTE = "remote"

class ExperienceLevel(str, Enum):
    ENTRY = "entry"
    MID = "mid"
    SENIOR = "senior"
    EXECUTIVE = "executive"

class SortOptions(str, Enum):
    RELEVANCE = "relevance"
    LATEST = "latest"
    SALARY_HIGH = "salary_high"
    SALARY_LOW = "salary_low"

class CountryCode(str, Enum):
    INDIA = "IN"
    USA = "US"
    UK = "GB"
    UAE = "AE"

class JobResponse(BaseModel):
    """Single job listing response model"""
    job_id: str = Field(..., description="Unique job identifier")
    title: str = Field(..., description="Job title")
    company: str = Field(..., description="Company name")
    location: str = Field(..., description="Job location")
    country: str = Field(..., description="Country code")
    
    # Salary information
    salary: Optional[str] = Field(None, description="Formatted salary string")
    salary_min: Optional[int] = Field(None, description="Minimum salary")
    salary_max: Optional[int] = Field(None, description="Maximum salary")
    currency: str = Field("USD", description="Salary currency")
    
    # Job details
    experience_level: Optional[str] = Field(None, description="Required experience level")
    job_type: Optional[str] = Field(None, description="Employment type")
    sector: Optional[str] = Field(None, description="Job sector/category")
    skills: List[str] = Field(default_factory=list, description="Required skills")
    
    # Description and requirements
    description: Optional[str] = Field(None, description="Job description")
    requirements: List[str] = Field(default_factory=list, description="Job requirements")
    benefits: List[str] = Field(default_factory=list, description="Job benefits")
    
    # Meta information
    posted_date: datetime = Field(..., description="Job posting date")
    expires_date: Optional[datetime] = Field(None, description="Job expiry date")
    is_remote: bool = Field(False, description="Is remote position")
    is_urgent: bool = Field(False, description="Is urgent hiring")
    is_featured: bool = Field(False, description="Is featured job")
    
    # Application details
    apply_url: Optional[str] = Field(None, description="Direct application URL")
    company_logo: Optional[str] = Field(None, description="Company logo URL")
    
    # Search relevance
    relevance_score: Optional[float] = Field(None, description="Search relevance score")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class JobSearchParams(BaseModel):
    """Job search parameters model"""
    title: Optional[str] = None
    sector: Optional[str] = None
    job_type: Optional[JobType] = None
    experience_level: Optional[ExperienceLevel] = None
    location: Optional[str] = None
    country: CountryCode = CountryCode.INDIA
    
    salary_min: Optional[int] = Field(None, ge=0)
    salary_max: Optional[int] = Field(None, ge=0)
    
    page: int = Field(1, ge=1)
    limit: int = Field(10, ge=1, le=100)
    sort: SortOptions = SortOptions.RELEVANCE
    remote_only: bool = False
    
    user_coordinates: Optional[Tuple[float, float]] = None
    
    @field_validator('salary_max')
    @classmethod
    def validate_salary_range(cls, v, info):
        if v is not None and info.data.get('salary_min') is not None:
            if v < info.data['salary_min']:
                raise ValueError('salary_max must be greater than salary_min')
        return v

class PaginatedJobResponse(BaseModel):
    """Paginated job search response"""
    results: List[JobResponse] = Field(..., description="List of job results")
    total: int = Field(..., description="Total number of jobs found")
    page: int = Field(..., description="Current page number")
    limit: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total number of pages")
    
    # Google fallback
    redirect_to_google: bool = Field(False, description="Should redirect to Google")
    google_url: Optional[str] = Field(None, description="Google search URL")
    
    # Additional metadata
    search_params: Optional[Dict[str, Any]] = Field(None, description="Search parameters used")
    message: Optional[str] = Field(None, description="Response message")
    search_time_ms: Optional[int] = Field(None, description="Search execution time")
    
    # Analytics data
    suggested_searches: List[str] = Field(default_factory=list, description="Suggested search terms")
    popular_locations: List[str] = Field(default_factory=list, description="Popular job locations")
    trending_sectors: List[str] = Field(default_factory=list, description="Trending job sectors")

class JobStatistics(BaseModel):
    """Job statistics for dashboard"""
    total_jobs: int
    jobs_by_country: Dict[str, int]
    jobs_by_sector: Dict[str, int]
    jobs_by_experience: Dict[str, int]
    jobs_by_type: Dict[str, int]
    average_salaries: Dict[str, float]
    recent_jobs_count: int
    trending_skills: List[str]

class SearchAnalytics(BaseModel):
    """Search analytics tracking model"""
    search_query: Optional[str] = None
    location: Optional[str] = None
    country: str = "IN"
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    results_count: int = 0
    user_clicked: bool = False
    session_id: Optional[str] = None

class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    message: str
    status_code: int
    timestamp: datetime = Field(default_factory=datetime.now)
    redirect_to_google: bool = False
    google_url: Optional[str] = None

# Database models (for ORM)
class JobModel:
    """Database job model for SQLAlchemy/MongoDB"""
    
    def __init__(self):
        self.table_name = "jobs"
        self.required_fields = [
            "job_id", "title", "company", "location", "country",
            "posted_date", "description"
        ]
        self.optional_fields = [
            "salary", "salary_min", "salary_max", "currency",
            "experience_level", "job_type", "sector", "skills",
            "requirements", "benefits", "expires_date", "is_remote",
            "is_urgent", "is_featured", "apply_url", "company_logo"
        ]
    
    def get_create_table_sql(self):
        """Generate CREATE TABLE SQL for MySQL"""
        return """
        CREATE TABLE IF NOT EXISTS jobs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            job_id VARCHAR(100) UNIQUE NOT NULL,
            title VARCHAR(255) NOT NULL,
            company VARCHAR(255) NOT NULL,
            location VARCHAR(255) NOT NULL,
            country CHAR(2) NOT NULL,
            
            salary VARCHAR(100),
            salary_min INT,
            salary_max INT,
            currency CHAR(3) DEFAULT 'USD',
            
            experience_level ENUM('entry', 'mid', 'senior', 'executive'),
            job_type ENUM('full-time', 'part-time', 'contract', 'freelance', 'internship', 'remote'),
            sector VARCHAR(100),
            skills JSON,
            
            description TEXT,
            requirements JSON,
            benefits JSON,
            
            posted_date DATETIME NOT NULL,
            expires_date DATETIME,
            is_remote BOOLEAN DEFAULT FALSE,
            is_urgent BOOLEAN DEFAULT FALSE,
            is_featured BOOLEAN DEFAULT FALSE,
            
            apply_url TEXT,
            company_logo VARCHAR(500),
            
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            INDEX idx_title (title),
            INDEX idx_location (location),
            INDEX idx_country (country),
            INDEX idx_sector (sector),
            INDEX idx_experience (experience_level),
            INDEX idx_job_type (job_type),
            INDEX idx_posted_date (posted_date),
            INDEX idx_salary (salary_min, salary_max),
            FULLTEXT(title, company, description)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
    
    def get_search_query(self, params: JobSearchParams):
        """Generate dynamic search query"""
        conditions = ["1=1"]  # Base condition
        values = []
        
        # Country filter (always applied for supported countries)
        conditions.append("country = %s")
        values.append(params.country.value)
        
        # Title/keyword search
        if params.title:
            conditions.append("(MATCH(title, company, description) AGAINST (%s IN NATURAL LANGUAGE MODE) OR title LIKE %s)")
            values.extend([params.title, f"%{params.title}%"])
        
        # Sector filter
        if params.sector:
            conditions.append("sector = %s")
            values.append(params.sector)
        
        # Job type filter
        if params.job_type:
            conditions.append("job_type = %s")
            values.append(params.job_type.value)
        
        # Experience level filter
        if params.experience_level:
            conditions.append("experience_level = %s")
            values.append(params.experience_level.value)
        
        # Location filter
        if params.location:
            conditions.append("location LIKE %s")
            values.append(f"%{params.location}%")
        
        # Salary filters
        if params.salary_min:
            conditions.append("(salary_min >= %s OR salary_max >= %s)")
            values.extend([params.salary_min, params.salary_min])
        
        if params.salary_max:
            conditions.append("(salary_max <= %s OR salary_min <= %s)")
            values.extend([params.salary_max, params.salary_max])
        
        # Remote filter
        if params.remote_only:
            conditions.append("is_remote = TRUE")
        
        # Build ORDER BY clause
        order_by = "posted_date DESC"  # Default
        if params.sort == SortOptions.RELEVANCE and params.title:
            order_by = "MATCH(title, company, description) AGAINST (%s IN NATURAL LANGUAGE MODE) DESC, posted_date DESC"
            values.append(params.title)
        elif params.sort == SortOptions.SALARY_HIGH:
            order_by = "salary_max DESC, salary_min DESC"
        elif params.sort == SortOptions.SALARY_LOW:
            order_by = "salary_min ASC, salary_max ASC"
        elif params.sort == SortOptions.LATEST:
            order_by = "posted_date DESC"
        
        # Pagination
        offset = (params.page - 1) * params.limit
        
        query = f"""
        SELECT * FROM jobs 
        WHERE {' AND '.join(conditions)}
        ORDER BY {order_by}
        LIMIT %s OFFSET %s
        """
        
        values.extend([params.limit, offset])
        
        # Count query for total results
        count_query = f"""
        SELECT COUNT(*) as total FROM jobs 
        WHERE {' AND '.join(conditions)}
        """
        
        return query, count_query, values[:-2], values  # Remove limit/offset for count
