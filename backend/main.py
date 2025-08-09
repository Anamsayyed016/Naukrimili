"""
FastAPI Backend for Unified Job Portal
Supports dynamic job search with Google fallback
"""

from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List, Dict, Any
import uvicorn
from datetime import datetime, timedelta
import urllib.parse
import logging
import os
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# Local imports
from models.job_models import JobResponse, JobSearchParams, PaginatedJobResponse
from services.job_search_service import JobSearchService
from services.mock_database_service import create_database_service
from utils.location_utils import get_supported_countries, validate_location
from utils.google_fallback import generate_google_search_url
from middleware.rate_limiter import RateLimitMiddleware
from config.settings import Settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Explicitly load .env (ensure relative to this file)
ENV_PATH = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH)
    logging.getLogger(__name__).info(f"Loaded .env from {ENV_PATH}")
else:
    logging.getLogger(__name__).warning(f".env not found at {ENV_PATH}")

# Initialize services after env is loaded
settings = Settings()
db_service = create_database_service(settings.database_type)
job_search_service = JobSearchService(db_service)

# Debug environment dump (safe subset)
logger.info(
    "Env DEBUG -> MYSQL_USER=%s MYSQL_HOST=%s MYSQL_DATABASE=%s DATABASE_TYPE=%s", 
    os.getenv('MYSQL_USER'), os.getenv('MYSQL_HOST'), os.getenv('MYSQL_DATABASE'), os.getenv('DATABASE_TYPE')
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events with graceful DB fallback"""
    global db_service, job_search_service
    logger.info("🚀 Starting Unified Job Portal API...")
    try:
        await db_service.connect()
    except Exception as e:
        # Fallback to mock database so APIs are still testable
        logger.warning(f"⚠️ Primary database startup failed ({e}). Falling back to mock database service.")
        from services.mock_database_service import MockDatabaseService
        db_service = MockDatabaseService()
        await db_service.connect()
        job_search_service = JobSearchService(db_service)
    yield
    logger.info("💤 Shutting down Unified Job Portal API...")
    try:
        await db_service.disconnect()
    except Exception as e:
        logger.warning(f"Database disconnect issue: {e}")

# Initialize FastAPI app
app = FastAPI(
    title="Unified Job Portal API",
    description="Dynamic job search with Google fallback for Naukrimili",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# Configure CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "https://yourdomain.com", # Production domain
        "https://naukrimili.com"  # Your actual domain
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Add rate limiting middleware (in-memory simple)
app.add_middleware(RateLimitMiddleware, max_requests=settings.rate_limit_requests, window_seconds=settings.rate_limit_window)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Unified Job Portal API",
        "status": "active",
        "timestamp": datetime.now().isoformat(),
        "supported_countries": get_supported_countries()
    }

@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    try:
        db_status = await db_service.health_check()
        return {
            "status": "healthy",
            "database": db_status,
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable")

@app.get("/api/jobs/search", response_model=PaginatedJobResponse)
async def search_jobs(
    # Core search parameters
    title: Optional[str] = Query(None, description="Job title or keywords"),
    sector: Optional[str] = Query(None, description="Job sector/category"),
    job_type: Optional[str] = Query(None, description="full-time, part-time, contract, remote"),
    experience_level: Optional[str] = Query(None, description="entry, mid, senior, executive"),
    location: Optional[str] = Query(None, description="City, state, or country"),
    
    # Salary filters
    salary_min: Optional[int] = Query(None, description="Minimum salary", ge=0),
    salary_max: Optional[int] = Query(None, description="Maximum salary", ge=0),
    
    # Pagination
    page: int = Query(1, description="Page number", ge=1),
    limit: int = Query(10, description="Items per page", ge=1, le=100),
    
    # Sorting and additional filters
    sort: Optional[str] = Query("relevance", description="latest, relevance, salary_high, salary_low"),
    country: Optional[str] = Query("IN", description="Country code: IN, US, GB, AE"),
    remote_only: bool = Query(False, description="Show only remote jobs"),
    
    # User context (optional)
    user_lat: Optional[float] = Query(None, description="User latitude for location-based sorting"),
    user_lng: Optional[float] = Query(None, description="User longitude for location-based sorting")
):
    """
    🔍 Dynamic Job Search API with Google Fallback
    
    This endpoint supports:
    - Dynamic filtering by title, sector, experience, location, salary
    - Pagination with configurable limits
    - Location-based results for supported countries
    - Google fallback when no results found
    - Smart sorting by relevance, date, or salary
    """
    
    try:
        # Log search query for analytics
        search_params = {
            "title": title,
            "sector": sector,
            "job_type": job_type,
            "experience_level": experience_level,
            "location": location,
            "salary_min": salary_min,
            "salary_max": salary_max,
            "country": country,
            "remote_only": remote_only,
            "sort": sort
        }
        
        logger.info(f"🔍 Job search request: {search_params}")
        
        # Validate and normalize location
        validated_location = validate_location(location, country, user_lat, user_lng)
        
        # Build search parameters
        search_request = JobSearchParams(
            title=title,
            sector=sector,
            job_type=job_type,
            experience_level=experience_level,
            location=validated_location["normalized_location"],
            country=validated_location["country_code"],
            salary_min=salary_min,
            salary_max=salary_max,
            page=page,
            limit=limit,
            sort=sort,
            remote_only=remote_only,
            user_coordinates=(user_lat, user_lng) if user_lat and user_lng else None
        )
        
        # Perform job search
        search_result = await job_search_service.search_jobs(search_request)
        
        # Check if we need Google fallback
        if search_result["total"] == 0 and (title or location):
            google_url = generate_google_search_url(
                title=title or "jobs",
                location=location or validated_location["normalized_location"],
                job_type=job_type,
                experience_level=experience_level
            )
            
            logger.info(f"🔄 No results found, providing Google fallback: {google_url}")
            
            return PaginatedJobResponse(
                results=[],
                total=0,
                page=page,
                limit=limit,
                total_pages=0,
                redirect_to_google=True,
                google_url=google_url,
                search_params=search_params,
                message="No jobs found in our database. Try searching on Google for more options."
            )
        
        # Calculate total pages
        total_pages = (search_result["total"] + limit - 1) // limit
        
        # Return successful results
        return PaginatedJobResponse(
            results=search_result["jobs"],
            total=search_result["total"],
            page=page,
            limit=limit,
            total_pages=total_pages,
            redirect_to_google=False,
            google_url=None,
            search_params=search_params,
            message=f"Found {search_result['total']} jobs matching your criteria."
        )
        
    except Exception as e:
        logger.error(f"❌ Job search failed: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Job search failed",
                "message": str(e),
                "redirect_to_google": True,
                "google_url": generate_google_search_url(
                    title=title or "jobs",
                    location=location or "India"
                )
            }
        )

@app.get("/api/jobs/categories")
async def get_job_categories():
    """Get available job categories/sectors"""
    try:
        categories = await job_search_service.get_categories()
        return {"categories": categories}
    except Exception as e:
        logger.error(f"Failed to get categories: {e}")
        raise HTTPException(status_code=500, detail="Failed to get categories")

@app.get("/api/jobs/locations")
async def get_popular_locations():
    """Get popular job locations by country"""
    try:
        locations = await job_search_service.get_popular_locations()
        return {"locations": locations}
    except Exception as e:
        logger.error(f"Failed to get locations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get locations")

@app.get("/api/jobs/stats")
async def get_job_stats():
    """Get job statistics for dashboard"""
    try:
        stats = await job_search_service.get_job_statistics()
        return stats
    except Exception as e:
        logger.error(f"Failed to get job stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get statistics")

@app.post("/api/jobs/track-search")
async def track_search_analytics(search_data: Dict[str, Any]):
    """Track user search analytics"""
    try:
        await job_search_service.track_search_analytics(search_data)
        return {"status": "tracked"}
    except Exception as e:
        logger.error(f"Failed to track search: {e}")
        return {"status": "failed", "error": str(e)}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
