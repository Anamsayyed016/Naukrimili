#!/usr/bin/env python3
"""
Simple test server for debugging upload issues
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv
from resume_parser import parse_resume

# Load environment variables
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "message": "Test Job Portal API is running", 
        "gemini_enabled": True,
        "endpoints": ["/", "/test-upload"]
    }

@app.post("/test-upload")
async def test_upload(file: UploadFile = File(...)):
    """Test upload endpoint"""
    try:
        print(f"🚀 Received file upload: {file.filename}")
        print(f"📁 File content type: {file.content_type}")
        print(f"📏 File size: {file.size if hasattr(file, 'size') else 'unknown'}")
        
        # Read file content
        file_content = await file.read()
        print(f"📊 Actual file size: {len(file_content)} bytes")
        
        # Test AI parsing
        ai_data = parse_resume(file_content)
        print(f"✅ AI parsing completed")
        
        return {
            "success": True,
            "message": "File uploaded and processed successfully!",
            "file_info": {
                "filename": file.filename,
                "content_type": file.content_type,
                "size": len(file_content)
            },
            "parsed_data": {
                "personal_info": ai_data["structured_data"]["personal_info"],
                "skills_count": len(ai_data["structured_data"]["skills"]),
                "experience_count": len(ai_data["structured_data"]["experience"]),
                "ats_score": ai_data["ats_score"]
            }
        }
        
    except Exception as e:
        print(f"❌ Upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/resumes/upload")
async def upload_resume(file: UploadFile = File(...)):
    """Main upload endpoint (same as test but with proper response format)"""
    try:
        print(f"🚀 Resume upload: {file.filename}")
        
        # Read file content
        file_content = await file.read()
        
        # AI Parsing
        ai_data = parse_resume(file_content)
        
        # Generate a unique ID
        from datetime import datetime
        resume_id = f"resume_{int(datetime.utcnow().timestamp() * 1000)}"
        
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
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        }
        
        return {
            "success": True,
            "message": "Resume uploaded and processed successfully",
            "resume": resume
        }
        
    except Exception as e:
        print(f"❌ Resume upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Test Server...")
    print("📡 Server will run on: http://localhost:8000")
    print("🔗 Endpoints available:")
    print("   GET  / - Health check")
    print("   POST /test-upload - Test file upload")
    print("   POST /resumes/upload - Main resume upload")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
