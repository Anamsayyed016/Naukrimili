from flask import request, jsonify, Blueprint
from datetime import datetime
import uuid

# Create jobs blueprint
jobs_bp = Blueprint('jobs', __name__)

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

@jobs_bp.route('/jobs', methods=['GET'])
def search_jobs():
    """Search for jobs with query and filters"""
    try:
        query = request.args.get('q', '').lower()
        location = request.args.get('location', '').lower()
        job_type = request.args.get('jobType', '').lower()
        limit = int(request.args.get('limit', 10))
        
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
            if location and location not in job['location'].lower():
                match = False
            
            # Job type filter
            if job_type and job_type != job['job_type']:
                match = False
            
            if match:
                filtered_jobs.append(job)
        
        # Apply limit
        filtered_jobs = filtered_jobs[:limit]
        
        return jsonify({
            "success": True,
            "jobs": filtered_jobs,
            "total": len(filtered_jobs),
            "query": query,
            "filters": {
                "location": location,
                "job_type": job_type,
                "limit": limit
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error searching jobs: {str(e)}"
        }), 500

@jobs_bp.route('/jobs/<job_id>', methods=['GET'])
def get_job_by_id(job_id):
    """Get specific job details by ID"""
    try:
        job = next((j for j in jobs_db if j['id'] == job_id), None)
        
        if not job:
            return jsonify({
                "success": False,
                "error": "Job not found"
            }), 404
        
        return jsonify({
            "success": True,
            "job": job
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error fetching job: {str(e)}"
        }), 500

@jobs_bp.route('/jobs/featured', methods=['GET'])
def get_featured_jobs():
    """Get featured/recommended jobs"""
    try:
        limit = int(request.args.get('limit', 10))
        
        # Filter featured jobs
        featured_jobs = [job for job in jobs_db if job.get('featured', False)]
        
        # Apply limit
        featured_jobs = featured_jobs[:limit]
        
        return jsonify({
            "success": True,
            "jobs": featured_jobs,
            "total": len(featured_jobs)
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error fetching featured jobs: {str(e)}"
        }), 500

@jobs_bp.route('/jobs/<job_id>/apply', methods=['POST'])
def apply_for_job(job_id):
    """Submit job application"""
    try:
        # Find the job
        job = next((j for j in jobs_db if j['id'] == job_id), None)
        
        if not job:
            return jsonify({
                "success": False,
                "error": "Job not found"
            }), 404
        
        # Get application data
        application_data = request.get_json()
        
        if not application_data:
            return jsonify({
                "success": False,
                "error": "Application data is required"
            }), 400
        
        # Validate required fields
        required_fields = ['name', 'email', 'resume']
        for field in required_fields:
            if field not in application_data:
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400
        
        # Create application record
        application = {
            "id": str(uuid.uuid4()),
            "job_id": job_id,
            "applicant_name": application_data['name'],
            "applicant_email": application_data['email'],
            "resume": application_data['resume'],
            "cover_letter": application_data.get('cover_letter', ''),
            "applied_date": datetime.now().isoformat(),
            "status": "submitted"
        }
        
        # Add to job applications
        job['applications'].append(application)
        
        return jsonify({
            "success": True,
            "message": "Application submitted successfully",
            "application_id": application['id'],
            "job_title": job['title'],
            "company": job['company']
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error submitting application: {str(e)}"
        }), 500

@jobs_bp.route('/jobs/<job_id>/save', methods=['POST'])
def save_job(job_id):
    """Save job to user's favorites"""
    try:
        # Find the job
        job = next((j for j in jobs_db if j['id'] == job_id), None)
        
        if not job:
            return jsonify({
                "success": False,
                "error": "Job not found"
            }), 404
        
        # Check if already saved
        if job_id in user_saved_jobs:
            return jsonify({
                "success": False,
                "error": "Job already saved"
            }), 400
        
        # Save the job
        user_saved_jobs.append(job_id)
        
        return jsonify({
            "success": True,
            "message": "Job saved successfully",
            "job_title": job['title'],
            "company": job['company']
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error saving job: {str(e)}"
        }), 500

@jobs_bp.route('/jobs/saved', methods=['GET'])
def get_saved_jobs():
    """Get user's saved jobs"""
    try:
        saved_jobs = [job for job in jobs_db if job['id'] in user_saved_jobs]
        
        return jsonify({
            "success": True,
            "jobs": saved_jobs,
            "total": len(saved_jobs)
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error fetching saved jobs: {str(e)}"
        }), 500

@jobs_bp.route('/jobs/<job_id>/unsave', methods=['DELETE'])
def unsave_job(job_id):
    """Remove job from user's favorites"""
    try:
        if job_id not in user_saved_jobs:
            return jsonify({
                "success": False,
                "error": "Job not in saved list"
            }), 400
        
        user_saved_jobs.remove(job_id)
        
        return jsonify({
            "success": True,
            "message": "Job removed from saved list"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error removing saved job: {str(e)}"
        }), 500
