from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
router = APIRouter(prefix="/ats", tags=["ats"])

class ATSRequest(BaseModel):
    resume_text: str
    job_description: str

@router.post("/score")
def ats_score(data: ATSRequest):
    prompt = f"""
You are an Applicant Tracking System (ATS). Match the candidate resume with the job description.

Resume:
{data.resume_text}

Job Description:
{data.job_description}

Give:
1. ATS Score out of 100
2. Brief summary of why it matched or didn’t.
Return in JSON format.
"""
    try:
        model = genai.GenerativeModel("gemini-pro")
        response = model.generate_content(prompt)
        # Try to parse the response as JSON
        try:
            return json.loads(response.text)
        except Exception:
            return {"raw_response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 