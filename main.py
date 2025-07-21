from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import ObjectId
import boto3
import os
from datetime import datetime
from resume_parser import parse_resume  # Your AI module
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection with error handling
try:
    client = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"), serverSelectionTimeoutMS=5000)
    # Test the connection
    client.admin.command('ping')
    db = client[os.getenv("DATABASE_NAME", "naurkrimili")]
    print("MongoDB connected successfully")
except Exception as e:
    print(f"MongoDB connection failed: {e}")
    client = None
    db = None

# S3 client (optional for development)
try:
    s3 = boto3.client('s3')
except Exception as e:
    print(f"S3 client not configured: {e}")
    s3 = None

# Helper function to convert MongoDB documents to JSON-serializable format
def convert_mongo_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if doc is None:
        return None
    
    # Convert ObjectId to string
    if "_id" in doc and isinstance(doc["_id"], ObjectId):
        doc["_id"] = str(doc["_id"])
    
    # Convert datetime objects to ISO strings
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
    
    return doc

@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "message": "Job Portal API is running", 
        "gemini_enabled": True,
        "mongodb_connected": client is not None
    }

@app.post("/resumes/upload")
async def upload_resume(
    file: UploadFile = File(...)
):
    """Parse and store resume with AI extraction"""
    
    try:
        print(f"Received file upload: {file.filename}")
        
        # Read file content
        file_content = await file.read()
        print(f"File size: {len(file_content)} bytes")
        
        # Generate a unique ID for this upload
        resume_id = f"resume_{int(datetime.utcnow().timestamp() * 1000)}"
        
        # AI Parsing (skip S3 upload for now in development)
        ai_data = parse_resume(file_content)
        print(f"AI parsing completed. Skills found: {len(ai_data['structured_data']['skills'])}")
        
        # Create resume object
        resume = {
            "id": resume_id,
            "originalFile": {
                "filename": file.filename,
                "size": len(file_content),
                "hash": ai_data["file_hash"]
            },
            "aiData": ai_data["structured_data"],
            "userEdits": {},
            "atsScore": {"overall": ai_data["ats_score"]},
            "processing": {"status": "completed"},
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        # Store in database (optional for development)
        if db is not None:
            try:
                result = db.resumes.insert_one(resume)
                print(f"Resume stored in database with ID: {result.inserted_id}")
                # Convert the inserted document to JSON-serializable format
                resume["_id"] = str(result.inserted_id)
            except Exception as db_error:
                print(f"Database error (continuing anyway): {db_error}")
        else:
            print("MongoDB not available, skipping database storage")
        
        # Convert datetime objects to ISO strings for JSON response
        resume["createdAt"] = resume["createdAt"].isoformat()
        resume["updatedAt"] = resume["updatedAt"].isoformat()
        
        return {
            "success": True,
            "message": "Resume uploaded and processed successfully",
            "resume": resume
        }
        
    except Exception as e:
        print(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")

@app.put("/resumes/{resume_id}/edit")
async def update_resume(
    resume_id: str,
    edits: dict  # {"skills": ["new", "list"], ...}
):
    """Record manual edits"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    try:
        result = db.resumes.update_one(
            {"_id": ObjectId(resume_id)},
            {"$set": {"userEdits": edits, "updatedAt": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        return {"status": "updated"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating resume: {str(e)}")

@app.get("/resumes/{resume_id}")
async def get_resume_by_id(resume_id: str):
    """Fetch resume by ID"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    try:
        # Try to find by the resume ID field first
        resume = db.resumes.find_one({"id": resume_id})
        
        if not resume:
            # Fallback to ObjectId if not found
            try:
                resume = db.resumes.find_one({"_id": ObjectId(resume_id)})
            except:
                pass
        
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Convert to JSON-serializable format
        resume = convert_mongo_doc(resume)
        
        return {
            "success": True,
            "resume": resume
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching resume: {str(e)}")

@app.get("/resumes/{user_id}/latest")
async def get_resume(user_id: str):
    """Fetch for job application"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    try:
        resume = db.resumes.find_one(
            {"userId": user_id},
            sort=[("createdAt", -1)]
        )
        
        if not resume:
            raise HTTPException(status_code=404, detail="No resume found for user")
        
        # Convert to JSON-serializable format
        resume = convert_mongo_doc(resume)
        return resume
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching resume: {str(e)}")

@app.get("/resumes/{user_id}/all")
async def get_all_resumes(user_id: str):
    """Fetch all resumes for a user"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    try:
        resumes = list(db.resumes.find(
            {"userId": user_id},
            sort=[("createdAt", -1)]
        ))
        
        # Convert all resumes to JSON-serializable format
        resumes = [convert_mongo_doc(resume) for resume in resumes]
        
        return {"resumes": resumes}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching resumes: {str(e)}")

@app.delete("/resumes/{resume_id}")
async def delete_resume(resume_id: str):
    """Delete a resume"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")
    
    try:
        result = db.resumes.delete_one({"_id": ObjectId(resume_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        return {"status": "deleted"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting resume: {str(e)}")
