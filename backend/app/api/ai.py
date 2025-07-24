from flask import Blueprint, request, jsonify, current_app
import openai
from typing import Dict, Any, Optional, List
import json
import os
from functools import wraps
import logging
import time
from http import HTTPStatus

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ai_blueprint = Blueprint('ai', __name__)

def validate_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = os.getenv('OPENAI_API_KEY')
        logger.info(f"API Key status: {'Present' if api_key else 'Missing'}")
        if not api_key:
            logger.error("OpenAI API key not found")
            return jsonify({"error": "API configuration error: Missing API key"}), HTTPStatus.INTERNAL_SERVER_ERROR
        try:
            # Test the API key by creating a simple completion
            client = openai.OpenAI(api_key=api_key)
            client.models.list()
            logger.info("API key validated successfully")
        except Exception as e:
            logger.error(f"API key validation failed: {str(e)}")
            return jsonify({"error": f"API configuration error: {str(e)}"}), HTTPStatus.INTERNAL_SERVER_ERROR
        return f(*args, **kwargs)
    return decorated_function

def rate_limit(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Simple rate limiting using time delay
        time.sleep(1)  # Ensure at least 1 second between requests
        return f(*args, **kwargs)
    return decorated_function

def parse_ai_response(response: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse the OpenAI response into structured resume data with validation
    """
    if not response or 'choices' not in response:
        logger.error("Invalid response format from OpenAI")
        raise ValueError("Invalid AI response format")
        
    try:
        content = response.choices[0].message.content
        # Attempt to parse if response is in JSON format
        return json.loads(content)
    except (IndexError, AttributeError, TypeError) as e:
        logger.error(f"Error accessing response content: {str(e)}")
        raise ValueError("Invalid response structure")
    except json.JSONDecodeError:
        # If not JSON, parse the text response into sections
        sections = content.split('\n\n')
        resume_data = {
            "summary": "",
            "skills": [],
            "experience": [],
            "education": []
        }
        
        current_section = None
        for section in sections:
            if "Professional Summary" in section:
                current_section = "summary"
                resume_data["summary"] = section.split("\n", 1)[1] if "\n" in section else ""
            elif "Skills" in section:
                current_section = "skills"
                skills_text = section.split("\n", 1)[1] if "\n" in section else ""
                resume_data["skills"] = [skill.strip() for skill in skills_text.split(",")]
            elif "Experience" in section:
                current_section = "experience"
                resume_data["experience"].append(section.split("\n", 1)[1] if "\n" in section else "")
            elif "Education" in section:
                current_section = "education"
                resume_data["education"].append(section.split("\n", 1)[1] if "\n" in section else "")
        
        return resume_data

def calculate_ats_score(response: Dict[str, Any], job_target: str) -> int:
    """
    Calculate ATS score based on various factors including job relevance
    Args:
        response: OpenAI API response
        job_target: Target job position
    Returns:
        Integer score between 0 and 100
    """
    try:
        content = response.choices[0].message.content.lower()
        job_target = job_target.lower()
        score = 0
        
        # Base score for required sections
        if "professional summary" in content or "summary" in content:
            score += 15
        if "skills" in content:
            score += 15
        if "experience" in content:
            score += 20
        if "education" in content:
            score += 10
            
        # Job relevance score
        if job_target in content:
            score += 10
            
        # Additional scoring based on content quality
        keywords = ["achievements", "results", "led", "managed", "developed", "implemented"]
        for keyword in keywords:
            if keyword in content:
                score += 1
                
        return min(score, 100)
                
    except Exception as e:
        logger.error(f"Error calculating ATS score: {str(e)}")
        return 0
    for keyword in keywords:
        if keyword in content:
            score += 1
    
    # Cap the score at 100
    return min(score, 100)

@ai_blueprint.route('/resume/ai-generate', methods=['POST'])
@validate_api_key
@rate_limit
def ai_generate_resume():
    """
    Generate an ATS-optimized resume using AI
    
    Expects: 
    {
        "linkedin_url": "...", 
        "job_target": "Software Engineer",
        "years_of_experience": "5" // optional
    }
    
    Returns: 
    {
        "form_data": {
            "summary": "...",
            "skills": ["..."],
            "experience": ["..."],
            "education": ["..."]
        },
        "ats_score": 85,
        "improvement_suggestions": ["..."]
    }
    """
    try:
        # Input validation
        data = request.get_json()
        if not data:
            logger.warning("No JSON data in request")
            return jsonify({"error": "Invalid request format"}), HTTPStatus.BAD_REQUEST
            
        if 'job_target' not in data:
            logger.warning("Missing job_target in request")
            return jsonify({
                "error": "Missing required field: job_target"
            }), HTTPStatus.BAD_REQUEST
            
        # Validate job_target format
        job_target = data['job_target'].strip()
        if not job_target or len(job_target) < 2:
            return jsonify({
                "error": "Invalid job_target: Must be at least 2 characters"
            }), HTTPStatus.BAD_REQUEST

        # Configure OpenAI
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            logger.error("OpenAI API key not found in environment")
            return jsonify({"error": "API configuration error: API key not found"}), HTTPStatus.INTERNAL_SERVER_ERROR
            
        client = openai.OpenAI(api_key=api_key)
        logger.info("OpenAI client initialized successfully")
        ai_response = client.chat.completions.create(
            model="gpt-4",
            messages=[{
                "role": "system",
                "content": f"""
                Generate a professional resume for {data['job_target']} role with the following sections:
                1. Professional Summary (2-3 sentences highlighting key qualifications)
                2. Skills Section (10-15 relevant technical and soft skills, ATS optimized)
                3. Work Experience (3 most relevant positions with accomplishment-focused bullets)
                4. Education (relevant degrees and certifications)
                
                Format the response in a way that clearly separates each section.
                Include specific achievements and metrics where possible.
                Optimize for ATS systems by incorporating relevant keywords.
                """
            }]
        )

        # Parse the AI response and calculate ATS score
        try:
            form_data = parse_ai_response(ai_response)
            ats_score = calculate_ats_score(ai_response, data['job_target'])
            
            # Generate improvement suggestions
            improvement_suggestions = []
            if ats_score < 70:
                improvement_suggestions.append("Consider adding more specific achievements and metrics")
            if ats_score < 80:
                improvement_suggestions.append("Try including more industry-specific keywords")
            if "skills" in form_data and len(form_data["skills"]) < 10:
                improvement_suggestions.append("Add more relevant technical and soft skills")

            return jsonify({
                "form_data": form_data,
                "ats_score": ats_score,
                "improvement_suggestions": improvement_suggestions
            })
        except ValueError as ve:
            logger.error(f"Error processing AI response: {str(ve)}")
            return jsonify({"error": "Failed to process AI response"}), HTTPStatus.INTERNAL_SERVER_ERROR

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

# Test endpoint to verify API configuration
@ai_blueprint.route('/test', methods=['GET'])
@validate_api_key
def test_api():
    """
    Test endpoint to verify API configuration
    """
    return jsonify({"status": "ok", "message": "API configuration is valid"})

# Register error handlers
@ai_blueprint.errorhandler(400)
def handle_bad_request(e):
    return jsonify({"error": "Bad Request"}), 400

@ai_blueprint.errorhandler(500)
def handle_server_error(e):
    return jsonify({"error": "Internal Server Error"}), 500
