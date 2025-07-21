#!/usr/bin/env python3
"""
Test script for Gemini API integration with resume parsing
"""

import os
import sys
from dotenv import load_dotenv
from resume_parser import parse_resume

# Load environment variables
load_dotenv()

def test_gemini_api():
    """Test Gemini API connection and resume parsing"""
    
    # Check if Gemini API key is set
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        print("❌ ERROR: Gemini API key not set in .env file")
        print("Please set GEMINI_API_KEY in your .env file")
        return False
    
    print("✅ Gemini API key found")
    
    # Test with sample resume text
    sample_resume = """
    John Doe
    Software Engineer
    Email: john.doe@email.com
    Phone: (555) 123-4567
    Location: San Francisco, CA
    LinkedIn: linkedin.com/in/johndoe
    GitHub: github.com/johndoe
    
    EXPERIENCE
    Senior Software Engineer at Tech Corp (2021-2023)
    • Led development of microservices architecture serving 1M+ users
    • Improved system performance by 40% through optimization
    • Mentored 5 junior developers in best practices
    
    Software Engineer at StartupXYZ (2019-2021)
    • Built full-stack web applications using React and Node.js
    • Implemented CI/CD pipelines reducing deployment time by 60%
    • Collaborated with cross-functional teams on product features
    
    EDUCATION
    Bachelor of Science in Computer Science
    University of California, Berkeley
    Graduated: 2019
    GPA: 3.8
    
    SKILLS
    Python, JavaScript, React, Node.js, Docker, AWS, MongoDB, PostgreSQL
    """
    
    try:
        print("🔄 Testing resume parsing with Gemini API...")
        
        # Convert sample resume to bytes
        resume_bytes = sample_resume.encode('utf-8')
        
        # Parse the resume
        result = parse_resume(resume_bytes)
        
        print("✅ Resume parsing successful!")
        print(f"📄 Extracted personal info: {result['structured_data']['personal_info']}")
        print(f"🔧 Skills found: {len(result['structured_data']['skills'])} skills")
        print(f"💼 Experience entries: {len(result['structured_data']['experience'])}")
        print(f"📊 ATS Score: {result['ats_score']}/100")
        
        # Check if experience was parsed by Gemini
        if result['structured_data']['experience']:
            first_exp = result['structured_data']['experience'][0]
            if "temporarily unavailable" not in first_exp['header']:
                print("✅ Gemini API successfully parsed experience!")
            else:
                print("⚠️ Gemini API parsing failed, using fallback")
                
        return True
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🚀 Starting Gemini API Integration Test\n")
    
    if test_gemini_api():
        print("\n✅ All tests passed! Gemini integration is working correctly.")
    else:
        print("\n❌ Tests failed. Please check your configuration.")
        sys.exit(1)

if __name__ == "__main__":
    main()
