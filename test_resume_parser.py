#!/usr/bin/env python3
"""
Direct test of resume parser with Gemini API
"""

import os
from dotenv import load_dotenv
from resume_parser import parse_resume

# Load environment variables
load_dotenv()

def test_resume_parsing():
    """Test resume parsing with real Gemini API"""
    
    # Sample resume content
    sample_resume = """
    John Doe
    Software Engineer
    Email: john.doe@email.com
    Phone: (555) 123-4567
    Location: San Francisco, CA
    LinkedIn: linkedin.com/in/johndoe
    GitHub: github.com/johndoe
    
    PROFESSIONAL EXPERIENCE
    
    Senior Software Engineer at Tech Corp (2021-2023)
    • Led development of microservices architecture serving 1M+ users
    • Improved system performance by 40% through optimization techniques
    • Mentored 5 junior developers in best practices and code review
    • Implemented CI/CD pipelines using Jenkins and Docker
    
    Software Engineer at StartupXYZ (2019-2021)
    • Built full-stack web applications using React and Node.js
    • Developed REST APIs serving mobile and web clients
    • Implemented real-time features using WebSocket technology
    • Collaborated with cross-functional teams on product features
    
    EDUCATION
    Bachelor of Science in Computer Science
    University of California, Berkeley
    Graduated: 2019
    GPA: 3.8/4.0
    
    TECHNICAL SKILLS
    Programming Languages: Python, JavaScript, TypeScript, Java
    Frameworks: React, Node.js, Django, Flask, Spring Boot
    Databases: MongoDB, PostgreSQL, Redis, MySQL
    Cloud & DevOps: AWS, Docker, Kubernetes, Jenkins, Terraform
    Tools: Git, Linux, Nginx, Apache
    """
    
    print("🚀 Testing Resume Parser with Gemini API")
    print("=" * 60)
    
    try:
        # Convert to bytes
        resume_bytes = sample_resume.encode('utf-8')
        
        print("🔄 Parsing resume...")
        result = parse_resume(resume_bytes)
        
        print("✅ Resume parsed successfully!")
        print("\n📊 Results:")
        print(f"ATS Score: {result['ats_score']}/100")
        
        print(f"\n👤 Personal Information:")
        personal_info = result['structured_data']['personal_info']
        for key, value in personal_info.items():
            print(f"  {key.replace('_', ' ').title()}: {value}")
        
        print(f"\n🔧 Skills ({len(result['structured_data']['skills'])}):")
        for i, skill in enumerate(result['structured_data']['skills'], 1):
            print(f"  {i}. {skill}")
        
        print(f"\n💼 Work Experience ({len(result['structured_data']['experience'])}):")
        for i, exp in enumerate(result['structured_data']['experience'], 1):
            print(f"\n  Job {i}: {exp['header']}")
            for j, desc in enumerate(exp['description'], 1):
                print(f"    {j}. {desc}")
        
        # Check if Gemini AI actually worked
        exp_headers = [exp['header'] for exp in result['structured_data']['experience']]
        if any("temporarily unavailable" in header for header in exp_headers):
            print("\n⚠️  Note: Experience parsing fell back to default (Gemini API may have failed)")
        else:
            print("\n🎉 Gemini AI successfully parsed the experience!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during parsing: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_resume_parsing()
    if success:
        print("\n✅ Resume parsing test completed successfully!")
    else:
        print("\n❌ Resume parsing test failed!")
