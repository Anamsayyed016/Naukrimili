import hashlib
import json
import re
import os
from typing import Dict, Any, List
import google.generativeai as genai
import PyPDF2
import docx
from io import BytesIO
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Gemini client
try:
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key and api_key.strip():
        genai.configure(api_key=api_key)
        client = genai.GenerativeModel('gemini-1.5-flash')  # Use the working model
        print("Gemini client initialized successfully")
    else:
        print("Warning: GEMINI_API_KEY not found or empty in environment")
        client = None
except Exception as e:
    print(f"Warning: Gemini client not initialized: {e}")
    client = None

def extract_text_from_file(file_bytes: bytes) -> str:
    """
    Extract text from PDF, DOCX, or plain text file bytes
    
    Args:
        file_bytes: Binary content of the file
        
    Returns:
        Extracted text content
    """
    try:
        # Try PDF first
        pdf_reader = PyPDF2.PdfReader(BytesIO(file_bytes))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except:
        try:
            # Try DOCX
            doc = docx.Document(BytesIO(file_bytes))
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except:
            try:
                # Try plain text (UTF-8)
                return file_bytes.decode('utf-8')
            except:
                # If all fail, return empty string
                return ""

def generate_file_hash(file_bytes: bytes) -> str:
    """
    Generate SHA256 hash of file content
    
    Args:
        file_bytes: Binary content of the file
        
    Returns:
        SHA256 hash string
    """
    return hashlib.sha256(file_bytes).hexdigest()

def parse_experience(experience_text: str) -> List[Dict[str, Any]]:
    """
    Parse experience text into structured format
    
    Args:
        experience_text: Raw experience text from GPT
        
    Returns:
        List of experience dictionaries
    """
    experiences = []
    
    # Split by job sections (assuming GPT formats with headers)
    job_sections = re.split(r'\n\n+', experience_text.strip())
    
    for section in job_sections:
        if section.strip():
            lines = section.strip().split('\n')
            if lines:
                # First line is usually job title and company
                header = lines[0]
                bullet_points = [line.strip('• -') for line in lines[1:] if line.strip()]
                
                experiences.append({
                    "header": header,
                    "description": bullet_points
                })
    
    return experiences

def calculate_ats_score(text: str) -> float:
    """
    Calculate ATS compatibility score based on resume text
    
    Args:
        text: Resume text content
        
    Returns:
        ATS score (0-100)
    """
    score = 0
    
    # Check for common sections
    sections = ['experience', 'education', 'skills', 'contact']
    for section in sections:
        if section.lower() in text.lower():
            score += 15
    
    # Check for formatting issues
    if len(text) > 500:  # Reasonable length
        score += 10
    
    # Check for email pattern
    if re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text):
        score += 10
    
    # Check for phone pattern
    if re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', text):
        score += 10
    
    # Check for years (experience indicators)
    if re.search(r'\b(19|20)\d{2}\b', text):
        score += 10
    
    return min(score, 100.0)

def extract_personal_info(text: str) -> dict:
    # Enhanced personal info extraction
    personal_info = {
        "full_name": "",
        "email": "",
        "phone": "",
        "location": "",
        "linkedin": "",
        "github": ""
    }
    
    # Simple regex-based extraction
    email_match = re.search(r'([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})', text)
    phone_match = re.search(r'(\+?\d[\d\s\-()]{7,}\d)', text)
    name_match = re.search(r'^([A-Z][a-z]+\s+[A-Z][a-z]+)', text, re.MULTILINE)
    linkedin_match = re.search(r'linkedin\.com/in/([a-zA-Z0-9-]+)', text, re.IGNORECASE)
    github_match = re.search(r'github\.com/([a-zA-Z0-9-]+)', text, re.IGNORECASE)
    
    # Extract location (city, state pattern)
    location_patterns = [
        r'([A-Z][a-z]+,\s*[A-Z]{2})',  # City, ST
        r'([A-Z][a-z]+\s+[A-Z][a-z]+,\s*[A-Z]{2})',  # City Name, ST
        r'([A-Z][a-z]+,\s*[A-Z][a-z]+)',  # City, State
    ]
    
    location = ""
    for pattern in location_patterns:
        location_match = re.search(pattern, text)
        if location_match:
            location = location_match.group(1)
            break
    
    personal_info.update({
        "full_name": name_match.group(1) if name_match else "",
        "email": email_match.group(1) if email_match else "",
        "phone": phone_match.group(1) if phone_match else "",
        "location": location,
        "linkedin": f"https://linkedin.com/in/{linkedin_match.group(1)}" if linkedin_match else "",
        "github": f"https://github.com/{github_match.group(1)}" if github_match else ""
    })
    
    return personal_info

def extract_education_info(text: str) -> List[Dict[str, Any]]:
    """Extract education information from resume text"""
    education_data = []
    
    # Look for common education patterns
    education_patterns = [
        r'([A-Z][a-z\s]+(?:University|College|Institute|School))[\s\n]*([A-Z][a-z\s]+(?:degree|Bachelor|Master|PhD|B\.?[AS]|M\.?[AS]|Ph\.?D\.?))[\s\n]*([12][0-9]{3})?',
        r'([A-Z][a-z\s]+(?:degree|Bachelor|Master|PhD|B\.?[AS]|M\.?[AS]|Ph\.?D\.?))[\s\n]*([A-Z][a-z\s]+(?:University|College|Institute|School))[\s\n]*([12][0-9]{3})?'
    ]
    
    for pattern in education_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if len(match) >= 2:
                education_data.append({
                    "institution": match[0].strip(),
                    "degree": match[1].strip(),
                    "graduation_year": match[2].strip() if len(match) > 2 and match[2] else "",
                    "gpa": ""  # Could add GPA extraction logic here
                })
    
    return education_data[:3]  # Limit to top 3 education entries

def parse_resume(file_bytes: bytes) -> dict:
    """
    Parse resume using AI/NLP techniques
    
    Args:
        file_bytes: Binary content of the resume file
        
    Returns:
        Dictionary containing extracted data
    """
    text = extract_text_from_file(file_bytes)
    
    if not text.strip():
        return {
            "structured_data": {
                "personal_info": {"full_name": "", "email": "", "phone": ""},
                "skills": [],
                "experience": []
            },
            "ats_score": 0.0,
            "file_hash": generate_file_hash(file_bytes)
        }
    
    # Skill Extraction using pattern matching
    skills = set()
    
    # Common technical skills to look for
    common_skills = [
        'python', 'java', 'javascript', 'react', 'node.js', 'sql', 'mongodb', 
        'aws', 'docker', 'kubernetes', 'git', 'html', 'css', 'typescript',
        'angular', 'vue', 'django', 'flask', 'spring', 'postgresql', 'mysql',
        'redis', 'elasticsearch', 'jenkins', 'ci/cd', 'agile', 'scrum',
        'c++', 'c#', '.net', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
        'azure', 'gcp', 'terraform', 'ansible', 'nginx', 'apache', 'linux',
        'windows', 'macos', 'rest', 'api', 'graphql', 'microservices'
    ]
    
    text_lower = text.lower()
    for skill in common_skills:
        if skill in text_lower:
            skills.add(skill.title())
    
    # Also look for additional patterns that might indicate skills
    # Look for programming language patterns
    prog_patterns = [
        r'\b(python|java|javascript|typescript|c\+\+|c#|php|ruby|go|rust|swift|kotlin)\b',
        r'\b(react|angular|vue|django|flask|spring|express|laravel)\b',
        r'\b(aws|azure|gcp|docker|kubernetes|terraform|ansible)\b'
    ]
    
    for pattern in prog_patterns:
        matches = re.findall(pattern, text_lower, re.IGNORECASE)
        for match in matches:
            skills.add(match.title())
    
    skills_list = list(skills)[:20]  # Limit to top 20 skills
    
    # Experience Summarization using Gemini
    if client is not None:
        try:
            prompt = f"""Extract and summarize work experience from this resume into structured format. 
            For each job, provide:
            - Job Title at Company Name (Start Year - End Year)
            - 3 key bullet points of responsibilities/achievements
            
            Resume text:
            {text[:3000]}  # Limit text length to avoid token limits
            
            Format the response as:
            Job Title at Company Name (Years)
            • Bullet point 1
            • Bullet point 2  
            • Bullet point 3
            
            [Next job if any]
            """
            
            response = client.generate_content(prompt)
            experience_summary = response.text
            experience_data = parse_experience(experience_summary)
            
        except Exception as e:
            # Fallback if Gemini API fails
            print(f"Gemini API error: {e}")
            experience_data = [{
                "header": "Experience parsing temporarily unavailable",
                "description": ["Please configure Gemini API key for AI-powered experience parsing"]
            }]
    else:
        # Fallback when Gemini client is not available
        experience_data = [{
            "header": "Experience parsing temporarily unavailable",
            "description": ["Please configure Gemini API key for AI-powered experience parsing"]
        }]
    
    personal_info = extract_personal_info(text)
    
    return {
        "structured_data": {
            "personal_info": personal_info,
            "skills": skills_list,
            "experience": experience_data
        },
        "ats_score": calculate_ats_score(text),
        "file_hash": generate_file_hash(file_bytes)
    }
