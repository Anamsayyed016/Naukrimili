"""
ATS Router - API endpoints for ATS functionality
"""

from flask import Blueprint, request, jsonify
from app.ats import calculate_ats_score, optimize_resume_for_ats
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ats_bp = Blueprint('ats', __name__)

@ats_bp.route('/ats/score', methods=['POST'])
def get_ats_score():
    """
    Calculate ATS score for a resume against a job description
    
    Expected JSON payload:
    {
        "resume_text": "Resume content here...",
        "job_description": "Job description here..."
    }
    
    Returns:
    {
        "success": true,
        "data": {
            "score": 87,
            "feedback": ["Add more power verbs", "Include metrics"],
            "details": {
                "keyword_match": 75,
                "format_score": 90,
                "content_quality": 85,
                "skills_match": 80
            },
            "timestamp": "2024-07-24T17:25:37Z"
        }
    }
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "error": "Invalid request format. JSON data required."
            }), 400
        
        # Validate required fields
        resume_text = data.get('resume_text', '').strip()
        job_description = data.get('job_description', '').strip()
        
        if not resume_text:
            return jsonify({
                "success": False,
                "error": "resume_text is required"
            }), 400
        
        # Job description is optional - will use generic if not provided
        logger.info(f"Calculating ATS score for resume ({len(resume_text)} chars)")
        
        # Calculate ATS score
        result = calculate_ats_score(resume_text, job_description)
        
        return jsonify({
            "success": True,
            "data": result
        })
        
    except Exception as e:
        logger.error(f"Error calculating ATS score: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500

@ats_bp.route('/ats/optimize', methods=['POST'])
def optimize_resume():
    """
    Get optimization suggestions for a resume
    
    Expected JSON payload:
    {
        "resume_text": "Resume content here...",
        "job_description": "Job description here..."
    }
    
    Returns:
    {
        "success": true,
        "data": {
            "current_score": 75,
            "potential_score": 90,
            "missing_keywords": ["python", "machine learning"],
            "missing_skills": ["tensorflow", "docker"],
            "priority_improvements": [...],
            "formatting_tips": [...]
        }
    }
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "error": "Invalid request format. JSON data required."
            }), 400
        
        # Validate required fields
        resume_text = data.get('resume_text', '').strip()
        job_description = data.get('job_description', '').strip()
        
        if not resume_text:
            return jsonify({
                "success": False,
                "error": "resume_text is required"
            }), 400
        
        if not job_description:
            return jsonify({
                "success": False,
                "error": "job_description is required for optimization"
            }), 400
        
        logger.info(f"Optimizing resume for ATS ({len(resume_text)} chars)")
        
        # Get optimization suggestions
        result = optimize_resume_for_ats(resume_text, job_description)
        
        if "error" in result:
            return jsonify({
                "success": False,
                "error": result["error"]
            }), 500
        
        return jsonify({
            "success": True,
            "data": result
        })
        
    except Exception as e:
        logger.error(f"Error optimizing resume: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500

@ats_bp.route('/ats/analyze', methods=['POST'])
def analyze_resume():
    """
    Comprehensive resume analysis combining score and optimization
    
    Expected JSON payload:
    {
        "resume_text": "Resume content here...",
        "job_description": "Job description here..." (optional)
    }
    
    Returns:
    {
        "success": true,
        "data": {
            "ats_score": {...},
            "optimization": {...},
            "summary": {
                "overall_rating": "Good",
                "key_strengths": [...],
                "top_recommendations": [...]
            }
        }
    }
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "error": "Invalid request format. JSON data required."
            }), 400
        
        # Validate required fields
        resume_text = data.get('resume_text', '').strip()
        job_description = data.get('job_description', '').strip()
        
        if not resume_text:
            return jsonify({
                "success": False,
                "error": "resume_text is required"
            }), 400
        
        # Use generic job description if not provided
        if not job_description:
            job_description = "Looking for experienced professional with relevant skills and achievements"
        
        logger.info(f"Analyzing resume comprehensively ({len(resume_text)} chars)")
        
        # Get ATS score
        ats_result = calculate_ats_score(resume_text, job_description)
        
        # Get optimization suggestions
        optimization_result = optimize_resume_for_ats(resume_text, job_description)
        
        # Generate summary
        score = ats_result.get('score', 0)
        if score >= 80:
            overall_rating = "Excellent"
            key_strengths = ["Strong ATS compatibility", "Well-formatted content", "Good keyword usage"]
        elif score >= 65:
            overall_rating = "Good"
            key_strengths = ["Decent ATS score", "Room for improvement", "Some good practices"]
        elif score >= 50:
            overall_rating = "Fair"
            key_strengths = ["Basic structure present", "Needs significant improvement"]
        else:
            overall_rating = "Needs Improvement"
            key_strengths = ["Major formatting issues", "Low keyword match"]
        
        # Top recommendations from feedback
        top_recommendations = ats_result.get('feedback', [])[:3]
        
        summary = {
            "overall_rating": overall_rating,
            "key_strengths": key_strengths,
            "top_recommendations": top_recommendations
        }
        
        return jsonify({
            "success": True,
            "data": {
                "ats_score": ats_result,
                "optimization": optimization_result,
                "summary": summary
            }
        })
        
    except Exception as e:
        logger.error(f"Error analyzing resume: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500

@ats_bp.route('/ats/health', methods=['GET'])
def health_check():
    """Health check endpoint for ATS service"""
    try:
        # Test basic functionality
        test_resume = "Software Engineer with 5 years experience in Python and React. Led team of 3 developers. Increased performance by 25%."
        test_job = "Looking for Software Engineer with Python experience."
        
        result = calculate_ats_score(test_resume, test_job)
        
        return jsonify({
            "success": True,
            "status": "healthy",
            "message": "ATS service is running correctly",
            "test_score": result.get('score', 0)
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "status": "unhealthy",
            "error": str(e)
        }), 500

# Error handlers
@ats_bp.errorhandler(400)
def handle_bad_request(error):
    return jsonify({
        "success": False,
        "error": "Bad request"
    }), 400

@ats_bp.errorhandler(500)
def handle_internal_error(error):
    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500
