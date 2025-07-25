from typing import List, Tuple
from pymongo import GEOSPHERE
from app import db
from bson import ObjectId

def setup_geo_indexes():
    """
    Sets up the geospatial indexes required for location-based queries.
    Should be called when the application starts.
    """
    try:
        db.jobs.create_index([("location", GEOSPHERE)])
        print("Geospatial index created successfully")
    except Exception as e:
        print(f"Error creating geospatial index: {e}")

def get_nearby_jobs(user_coords: Tuple[float, float], radius_km: float = 50, 
                   filters: dict = None) -> List[dict]:
    """
    Finds jobs within the specified radius of the user's location.
    
    Args:
        user_coords: Tuple of (longitude, latitude)
        radius_km: Search radius in kilometers
        filters: Additional filters like salary range, job type, etc.
    
    Returns:
        List of jobs matching the criteria
    """
    try:
        # Base query with geospatial filter
        query = {
            "location": {
                "$nearSphere": {
                    "$geometry": {
                        "type": "Point",
                        "coordinates": user_coords
                    },
                    "$maxDistance": radius_km * 1000  # Convert to meters
                }
            },
            "isActive": True
        }

        # Apply additional filters if provided
        if filters:
            if filters.get('salary'):
                min_salary, max_salary = filters['salary']
                query["salary.max"] = {"$gte": min_salary}
                query["salary.min"] = {"$lte": max_salary}
            
            if filters.get('jobType'):
                query["jobType"] = filters['jobType']
            
            if filters.get('experienceLevel'):
                query["experienceLevel"] = filters['experienceLevel']
            
            if filters.get('skills'):
                query["requiredSkills"] = {
                    "$all": filters['skills']
                }

        # Execute query with projection
        jobs = db.jobs.find(
            query,
            {
                "title": 1,
                "company": 1,
                "location": 1,
                "salary": 1,
                "jobType": 1,
                "description": 1,
                "postedDate": 1,
                "distance": {
                    "$round": [{
                        "$divide": [
                            {"$distance": {
                                "from": {
                                    "type": "Point",
                                    "coordinates": user_coords
                                },
                                "to": "$location",
                                "spherical": True
                            }},
                            1000  # Convert meters to kilometers
                        ]
                    }, 1]
                }
            }
        ).limit(100)  # Limit results for performance

        return list(jobs)

    except Exception as e:
        print(f"Error in get_nearby_jobs: {e}")
        return []

def format_job_location(latitude: float, longitude: float, address: str = None) -> dict:
    """
    Formats location data for storage in MongoDB.
    
    Args:
        latitude: Location latitude
        longitude: Location longitude
        address: Optional human-readable address
    
    Returns:
        Formatted location object for MongoDB storage
    """
    location = {
        "type": "Point",
        "coordinates": [longitude, latitude]
    }
    
    if address:
        location["address"] = address
    
    return location

def get_location_stats(location: Tuple[float, float], radius_km: float = 50) -> dict:
    """
    Gets statistics about jobs in a specific area.
    
    Args:
        location: Tuple of (longitude, latitude)
        radius_km: Radius to analyze in kilometers
    
    Returns:
        Dictionary containing location statistics
    """
    try:
        pipeline = [
            {
                "$geoNear": {
                    "near": {
                        "type": "Point",
                        "coordinates": location
                    },
                    "distanceField": "distance",
                    "maxDistance": radius_km * 1000,
                    "spherical": True,
                    "query": {"isActive": True}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "totalJobs": {"$sum": 1},
                    "avgSalary": {"$avg": "$salary.max"},
                    "jobTypes": {"$addToSet": "$jobType"},
                    "companies": {"$addToSet": "$company"}
                }
            }
        ]
        
        result = list(db.jobs.aggregate(pipeline))
        
        if not result:
            return {
                "totalJobs": 0,
                "avgSalary": 0,
                "uniqueCompanies": 0,
                "jobTypes": []
            }
            
        stats = result[0]
        return {
            "totalJobs": stats["totalJobs"],
            "avgSalary": round(stats["avgSalary"], 2),
            "uniqueCompanies": len(stats["companies"]),
            "jobTypes": stats["jobTypes"]
        }
        
    except Exception as e:
        print(f"Error in get_location_stats: {e}")
        return {
            "totalJobs": 0,
            "avgSalary": 0,
            "uniqueCompanies": 0,
            "jobTypes": []
        }
