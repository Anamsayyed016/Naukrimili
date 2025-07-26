from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

# Create FastAPI router
router = APIRouter(prefix="/jobs", tags=["jobs"])

# Pydantic models for request/response validation
class JobApplication(BaseModel):
    name: str
    email: str
    resume: str
    cover_letter: Optional[str] = ""

class JobResponse(BaseModel):
    success: bool
    job: Optional[Dict[str, Any]] = None
    jobs: Optional[List[Dict[str, Any]]] = None
    total: Optional[int] = None
    message: Optional[str] = None
    error: Optional[str] = None
    query: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None
    application_id: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None

# In-memory job storage (replace with database in production)
jobs_db = [
    {
        "id": "1",
        "title": "Senior Software Engineer",
        "company": "Tech Corp",
        "location": "Mumbai, India",
        "job_type": "full-time",
        "salary": "₹15-25 LPA",
        "description": "Looking for an experienced software engineer with expertise in Python and React.",
        "requirements": ["Python", "React", "5+ years experience"],
        "posted_date": "2024-07-20",
        "featured": True,
        "applications": []
    },
    {
        "id": "2",
        "title": "Frontend Developer",
        "company": "StartupXYZ",
        "location": "Bangalore, India",
        "job_type": "full-time",
        "salary": "₹8-15 LPA",
        "description": "Join our team to build amazing user interfaces using modern web technologies.",
        "requirements": ["JavaScript", "React", "CSS", "2+ years experience"],
        "posted_date": "2024-07-22",
        "featured": False,
        "applications": []
    },
    {
        "id": "3",
        "title": "Data Scientist",
        "company": "Analytics Pro",
        "location": "Delhi, India",
        "job_type": "full-time",
        "salary": "₹12-20 LPA",
        "description": "Work with large datasets and machine learning models to derive business insights.",
        "requirements": ["Python", "Machine Learning", "SQL", "3+ years experience"],
        "posted_date": "2024-07-21",
        "featured": True,
        "applications": []
    }
]

# User saved jobs (replace with database in production)
user_saved_jobs = []

@router.get("/", response_model=JobResponse)
async def search_jobs(
    q: Optional[str] = Query(None, description="Search query"),
    location: Optional[str] = Query(None, description="Location filter"),
    jobType: Optional[str] = Query(None, description="Job type filter"),
    limit: int = Query(10, description="Number of jobs to return")
):
    """Search for jobs with query and filters"""
    try:
        query = q.lower() if q else ""
        location_filter = location.lower() if location else ""
        job_type_filter = jobType.lower() if jobType else ""
        
        # Filter jobs based on search criteria
        filtered_jobs = []
        
        for job in jobs_db:
            match = True
            
            # Text search in title, company, description
            if query:
                searchable_text = f"{job['title']} {job['company']} {job['description']}".lower()
                if query not in searchable_text:
                    match = False
            
            # Location filter
            if location_filter and location_filter not in job['location'].lower():
                match = False
            
            # Job type filter
            if job_type_filter and job_type_filter != job['job_type']:
                match = False
            
            if match:
                filtered_jobs.append(job)
        
        # Apply limit
        filtered_jobs = filtered_jobs[:limit]
        
        return JobResponse(
            success=True,
            jobs=filtered_jobs,
            total=len(filtered_jobs),
            query=query,
            filters={
                "location": location_filter,
                "job_type": job_type_filter,
                "limit": limit
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching jobs: {str(e)}")

@router.get("/featured/list", response_model=JobResponse)
async def get_featured_jobs(limit: int = Query(10, description="Number of featured jobs to return")):
    """Get featured/recommended jobs"""
    try:
        # Filter featured jobs
        featured_jobs = [job for job in jobs_db if job.get('featured', False)]
        
        # Apply limit
        featured_jobs = featured_jobs[:limit]
        
        return JobResponse(
            success=True,
            jobs=featured_jobs,
            total=len(featured_jobs)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching featured jobs: {str(e)}")

@router.get("/saved/list", response_model=JobResponse)
async def get_saved_jobs():
    """Get user's saved jobs"""
    try:
        saved_jobs = [job for job in jobs_db if job['id'] in user_saved_jobs]
        
        return JobResponse(
            success=True,
            jobs=saved_jobs,
            total=len(saved_jobs)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching saved jobs: {str(e)}")

@router.get("/{job_id}", response_model=JobResponse)
async def get_job_by_id(job_id: str):
    """Get specific job details by ID"""
    try:
        job = next((j for j in jobs_db if j['id'] == job_id), None)
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return JobResponse(
            success=True,
            job=job
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching job: {str(e)}")

@router.post("/{job_id}/apply", response_model=JobResponse)
async def apply_for_job(job_id: str, application_data: JobApplication):
    """Submit job application"""
    try:
        # Find the job
        job = next((j for j in jobs_db if j['id'] == job_id), None)
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Create application record
        application = {
            "id": str(uuid.uuid4()),
            "job_id": job_id,
            "applicant_name": application_data.name,
            "applicant_email": application_data.email,
            "resume": application_data.resume,
            "cover_letter": application_data.cover_letter,
            "applied_date": datetime.now().isoformat(),
            "status": "submitted"
        }
        
        # Add to job applications
        job['applications'].append(application)
        
        return JobResponse(
            success=True,
            message="Application submitted successfully",
            application_id=application['id'],
            job_title=job['title'],
            company=job['company']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting application: {str(e)}")

@router.post("/{job_id}/save", response_model=JobResponse)
async def save_job(job_id: str):
    """Save job to user's favorites"""
    try:
        # Find the job
        job = next((j for j in jobs_db if j['id'] == job_id), None)
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Check if already saved
        if job_id in user_saved_jobs:
            raise HTTPException(status_code=400, detail="Job already saved")
        
        # Save the job
        user_saved_jobs.append(job_id)
        
        return JobResponse(
            success=True,
            message="Job saved successfully",
            job_title=job['title'],
            company=job['company']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving job: {str(e)}")


@router.delete("/{job_id}/unsave", response_model=JobResponse)
async def unsave_job(job_id: str):
    """Remove job from user's favorites"""
    try:
        if job_id not in user_saved_jobs:
            raise HTTPException(status_code=400, detail="Job not in saved list")
        
        user_saved_jobs.remove(job_id)
        
        return JobResponse(
            success=True,
            message="Job removed from saved list"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing saved job: {str(e)}")
