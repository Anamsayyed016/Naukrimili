import os
from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId, json_util
import json
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
jwt = JWTManager(app)

# Import and register blueprints
from app.api.jobs import jobs_bp
from app.api.ai import ai_blueprint
from app.routers.ats_routes import ats_bp
app.register_blueprint(jobs_bp, url_prefix='/api')
app.register_blueprint(ai_blueprint, url_prefix='/api')
app.register_blueprint(ats_bp, url_prefix='/api')

# Import affiliate routes (they use @app decorator directly)
from app import affiliate

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
client = MongoClient(MONGO_URI)
db = client.naukrimili
jobs_collection = db.jobs

# Initialize sample data if collection is empty
if jobs_collection.count_documents({}) == 0:
    jobs_collection.insert_many([
        {
            "title": "Software Engineer",
            "company": "TechCorp",
            "location": "Mumbai, India",
            "type": "Full-time",
            "description": "We are looking for a Software Engineer with 3+ years of experience in Python and React.",
            "salary": "15-20 LPA",
            "skills": ["Python", "React", "MongoDB"],
            "experience": "3-5 years",
            "posted_date": datetime.utcnow(),
            "status": "active"
        },
        {
            "title": "Product Manager",
            "company": "InnovateX",
            "location": "Bangalore, India",
            "type": "Full-time",
            "description": "Seeking an experienced Product Manager to lead our flagship product development.",
            "salary": "25-35 LPA",
            "skills": ["Product Management", "Agile", "Strategy"],
            "experience": "5-8 years",
            "posted_date": datetime.utcnow(),
            "status": "active"
        }
    ])

@app.route('/api/jobs')
def get_jobs():
    try:
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        search = request.args.get('search', '')
        location = request.args.get('location', '')
        job_type = request.args.get('type', '')
        experience = request.args.get('experience', '')
        
        # Build query
        query = {"status": "active"}
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"company": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
        if location:
            query["location"] = {"$regex": location, "$options": "i"}
        if job_type:
            query["type"] = job_type
        if experience:
            query["experience"] = experience
            
        # Calculate skip value for pagination
        skip = (page - 1) * per_page
        
        # Get total count for pagination
        total_jobs = jobs_collection.count_documents(query)
        
        # Get paginated and filtered results
        jobs = jobs_collection.find(query).sort("posted_date", -1).skip(skip).limit(per_page)
        
        # Convert ObjectId to string and format dates
        jobs_list = []
        for job in jobs:
            job['_id'] = str(job['_id'])
            job['posted_date'] = job['posted_date'].strftime('%Y-%m-%d')
            jobs_list.append(job)
        
        return jsonify({
            "status": "success",
            "message": "Jobs fetched successfully",
            "data": {
                "jobs": jobs_list,
                "pagination": {
                    "current_page": page,
                    "per_page": per_page,
                    "total_jobs": total_jobs,
                    "total_pages": (total_jobs + per_page - 1) // per_page
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
