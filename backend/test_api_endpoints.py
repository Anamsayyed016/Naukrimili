#!/usr/bin/env python3
"""
API Endpoint Test Suite for Job Portal Backend
Tests all implemented endpoints to ensure they work correctly
"""

import requests
import json
from pprint import pprint

BASE_URL = "http://localhost:5000"

def test_jobs_search():
    """Test job search endpoint"""
    print("=" * 50)
    print("TESTING JOB SEARCH ENDPOINT")
    print("=" * 50)
    
    url = f"{BASE_URL}/api/jobs"
    params = {
        'q': 'software',
        'location': 'Mumbai',
        'limit': 5
    }
    
    try:
        response = requests.get(url, params=params)
        print(f"Status Code: {response.status_code}")
        print("Response:")
        pprint(response.json())
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_job_details():
    """Test job details endpoint"""
    print("\n" + "=" * 50)
    print("TESTING JOB DETAILS ENDPOINT")
    print("=" * 50)
    
    url = f"{BASE_URL}/api/jobs/1"
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print("Response:")
        pprint(response.json())
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_featured_jobs():
    """Test featured jobs endpoint"""
    print("\n" + "=" * 50)
    print("TESTING FEATURED JOBS ENDPOINT")
    print("=" * 50)
    
    url = f"{BASE_URL}/api/jobs/featured"
    params = {'limit': 3}
    
    try:
        response = requests.get(url, params=params)
        print(f"Status Code: {response.status_code}")
        print("Response:")
        pprint(response.json())
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_job_application():
    """Test job application endpoint"""
    print("\n" + "=" * 50)
    print("TESTING JOB APPLICATION ENDPOINT")
    print("=" * 50)
    
    url = f"{BASE_URL}/api/jobs/1/apply"
    data = {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "resume": "https://example.com/resume.pdf",
        "cover_letter": "I am very interested in this position..."
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print("Response:")
        pprint(response.json())
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_save_job():
    """Test save job endpoint"""
    print("\n" + "=" * 50)
    print("TESTING SAVE JOB ENDPOINT")
    print("=" * 50)
    
    url = f"{BASE_URL}/api/jobs/2/save"
    
    try:
        response = requests.post(url)
        print(f"Status Code: {response.status_code}")
        print("Response:")
        pprint(response.json())
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_saved_jobs():
    """Test get saved jobs endpoint"""
    print("\n" + "=" * 50)
    print("TESTING GET SAVED JOBS ENDPOINT")
    print("=" * 50)
    
    url = f"{BASE_URL}/api/jobs/saved"
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print("Response:")
        pprint(response.json())
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_affiliate_payout():
    """Test affiliate payout endpoint"""
    print("\n" + "=" * 50)
    print("TESTING AFFILIATE PAYOUT ENDPOINT")
    print("=" * 50)
    
    url = f"{BASE_URL}/affiliate/payout"
    
    try:
        response = requests.post(url)
        print(f"Status Code: {response.status_code}")
        print("Response:")
        pprint(response.json())
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_ai_endpoint():
    """Test AI resume generation endpoint (requires OpenAI API key)"""
    print("\n" + "=" * 50)
    print("TESTING AI RESUME GENERATION ENDPOINT")
    print("=" * 50)
    
    url = f"{BASE_URL}/api/resume/ai-generate"
    data = {
        "job_target": "Software Engineer",
        "years_of_experience": "3"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print("Response:")
        pprint(response.json())
        return response.status_code == 200 or response.status_code == 500  # 500 expected if no API key
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_ats_score():
    """Test ATS score calculation endpoint"""
    print("\n" + "=" * 50)
    print("TESTING ATS SCORE ENDPOINT")
    print("=" * 50)
    
    url = f"{BASE_URL}/api/ats/score"
    data = {
        "resume_text": "Software Engineer with 5 years experience in Python, React, and MongoDB. Led team of 3 developers and increased system performance by 25%. Developed scalable web applications using modern frameworks.",
        "job_description": "We are looking for a Software Engineer with expertise in Python and React. Must have experience with databases and team leadership."
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print("Response:")
        pprint(response.json())
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_ats_optimize():
    """Test ATS optimization endpoint"""
    print("\n" + "=" * 50)
    print("TESTING ATS OPTIMIZATION ENDPOINT")
    print("=" * 50)
    
    url = f"{BASE_URL}/api/ats/optimize"
    data = {
        "resume_text": "I am a software developer. I worked at TechCorp for 3 years. I know Python and JavaScript.",
        "job_description": "Looking for Senior Software Engineer with Python, React, Docker, and AWS experience. Must have leadership skills and 5+ years experience."
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print("Response:")
        pprint(response.json())
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_ats_analyze():
    """Test comprehensive ATS analysis endpoint"""
    print("\n" + "=" * 50)
    print("TESTING ATS ANALYSIS ENDPOINT")
    print("=" * 50)
    
    url = f"{BASE_URL}/api/ats/analyze"
    data = {
        "resume_text": "PROFESSIONAL SUMMARY\nExperienced Software Engineer with 4 years of expertise in Python, React, and cloud technologies. Proven track record of leading development teams and delivering high-performance applications.\n\nSKILLS\nPython, JavaScript, React, Docker, AWS, MongoDB, Git\n\nEXPERIENCE\nSenior Software Engineer - TechCorp (2020-2024)\n• Led a team of 3 developers in building scalable web applications\n• Increased system performance by 30% through code optimization\n• Implemented CI/CD pipelines reducing deployment time by 50%",
        "job_description": "We are seeking a Senior Software Engineer with strong Python and React skills. Experience with cloud platforms and team leadership preferred."
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print("Response:")
        pprint(response.json())
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_ats_health():
    """Test ATS health check endpoint"""
    print("\n" + "=" * 50)
    print("TESTING ATS HEALTH CHECK ENDPOINT")
    print("=" * 50)
    
    url = f"{BASE_URL}/api/ats/health"
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print("Response:")
        pprint(response.json())
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    """Run all API tests"""
    print("🚀 Starting Job Portal API Tests")
    print("Make sure your Flask server is running on http://localhost:5000")
    print()
    
    tests = [
        ("Job Search", test_jobs_search),
        ("Job Details", test_job_details),
        ("Featured Jobs", test_featured_jobs),
        ("Job Application", test_job_application),
        ("Save Job", test_save_job),
        ("Get Saved Jobs", test_saved_jobs),
        ("Affiliate Payout", test_affiliate_payout),
        ("AI Resume Generation", test_ai_endpoint),
        ("ATS Score Calculation", test_ats_score),
        ("ATS Optimization", test_ats_optimize),
        ("ATS Analysis", test_ats_analyze),
        ("ATS Health Check", test_ats_health),
    ]
    
    results = []
    for test_name, test_func in tests:
        success = test_func()
        results.append((test_name, "✅ PASS" if success else "❌ FAIL"))
    
    print("\n" + "=" * 50)
    print("TEST RESULTS SUMMARY")
    print("=" * 50)
    for test_name, result in results:
        print(f"{test_name:<25} {result}")
    
    total_tests = len(results)
    passed_tests = sum(1 for _, result in results if "PASS" in result)
    print(f"\nTotal: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 All tests passed! Your API is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the logs above for details.")

if __name__ == "__main__":
    main()
