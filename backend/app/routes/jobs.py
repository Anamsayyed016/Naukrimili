from flask import Blueprint, request, jsonify
from app.utils.job_filters import get_nearby_jobs, get_location_stats
from typing import Tuple

jobs_bp = Blueprint('jobs', __name__)

def parse_coordinates(lat: str, lon: str) -> Tuple[float, float] | None:
    """Convert string coordinates to float tuple in (longitude, latitude) format"""
    try:
        return (float(lon), float(lat))
    except (ValueError, TypeError):
        return None

@jobs_bp.route('/api/jobs/nearby', methods=['GET'])
def nearby_jobs():
    """
    Get jobs near a specific location with optional filters.
    
    Query Parameters:
        lat: Latitude (required)
        lon: Longitude (required)
        radius: Search radius in kilometers (optional, default: 30)
        min_salary: Minimum salary in LPA (optional)
        max_salary: Maximum salary in LPA (optional)
        job_type: Type of job (optional)
        experience: Experience level (optional)
        skills: Comma-separated list of required skills (optional)
    
    Example:
        /api/jobs/nearby?lat=19.0760&lon=72.8777&radius=30&min_salary=5&max_salary=15&job_type=Full+Time&experience=Mid+Level
    """
    try:
        # Get and validate coordinates
        lat = request.args.get('lat')
        lon = request.args.get('lon')
        
        if not lat or not lon:
            return jsonify({
                'error': 'Latitude and longitude are required'
            }), 400
            
        coords = parse_coordinates(lat, lon)
        if not coords:
            return jsonify({
                'error': 'Invalid coordinates format'
            }), 400

        # Get radius parameter
        try:
            radius_km = float(request.args.get('radius', 30))
        except ValueError:
            radius_km = 30

        # Build filters
        filters = {}
        
        # Salary filter
        min_salary = request.args.get('min_salary')
        max_salary = request.args.get('max_salary')
        if min_salary and max_salary:
            try:
                filters['salary'] = [
                    float(min_salary) * 100000,  # Convert LPA to annual
                    float(max_salary) * 100000
                ]
            except ValueError:
                pass

        # Job type filter
        job_type = request.args.get('job_type')
        if job_type:
            filters['jobType'] = job_type

        # Experience level filter
        experience = request.args.get('experience')
        if experience:
            filters['experienceLevel'] = experience

        # Skills filter
        skills = request.args.get('skills')
        if skills:
            filters['skills'] = [s.strip() for s in skills.split(',')]

        # Get jobs and location stats
        jobs = get_nearby_jobs(coords, radius_km, filters)
        stats = get_location_stats(coords, radius_km)

        return jsonify({
            'jobs': jobs,
            'stats': stats,
            'meta': {
                'location': {
                    'latitude': float(lat),
                    'longitude': float(lon)
                },
                'radius_km': radius_km,
                'total_results': len(jobs),
                'filters_applied': filters
            }
        })

    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

# Example usage in Python code:
"""
# Using requests library
import requests

response = requests.get(
    'http://localhost:5000/api/jobs/nearby',
    params={
        'lat': 19.0760,
        'lon': 72.8777,
        'radius': 30,
        'min_salary': 5,
        'max_salary': 15,
        'job_type': 'Full Time',
        'experience': 'Mid Level',
        'skills': 'python,javascript,react'
    }
)

jobs_data = response.json()
"""
