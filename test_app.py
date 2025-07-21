import os
import sys

def test_basic_imports():
    """Test basic imports without dependencies"""
    try:
        import fastapi
        print("✓ FastAPI available")
    except ImportError:
        print("✗ FastAPI not installed")
        return False
    
    try:
        import pymongo
        print("✓ PyMongo available")
    except ImportError:
        print("✗ PyMongo not installed")
        return False
    
    return True

def test_ai_dependencies():
    """Test AI/NLP dependencies"""
    missing_deps = []
    
    try:
        import spacy
        print("✓ spaCy available")
    except ImportError:
        missing_deps.append("spacy")
        print("✗ spaCy not installed")
    
    try:
        import openai
        print("✓ OpenAI available")
    except ImportError:
        missing_deps.append("openai")
        print("✗ OpenAI not installed")
    
    try:
        import PyPDF2
        print("✓ PyPDF2 available")
    except ImportError:
        missing_deps.append("PyPDF2")
        print("✗ PyPDF2 not installed")
    
    try:
        import docx
        print("✓ python-docx available")
    except ImportError:
        missing_deps.append("python-docx")
        print("✗ python-docx not installed")
    
    return missing_deps

def test_resume_parser():
    """Test resume parser functionality"""
    try:
        from resume_parser import parse_resume
        
        # Test with sample text content
        sample_text = b"""John Doe
john.doe@email.com
(555) 123-4567

EXPERIENCE
Software Engineer at Tech Corp (2020-2023)
- Developed web applications using Python and JavaScript
- Worked with AWS and MongoDB
- Led team of 5 developers

EDUCATION
Bachelor of Computer Science
University of Technology, 2020

SKILLS
Python, JavaScript, React, AWS, MongoDB, Docker
"""
        
        result = parse_resume(sample_text)
        print("✓ Resume parser working")
        print(f"  - File hash: {result['file_hash'][:10]}...")
        print(f"  - ATS Score: {result['ats_score']}")
        print(f"  - Skills found: {len(result['structured_data']['skills'])}")
        print(f"  - Experience sections: {len(result['structured_data']['experience'])}")
        
        return True
    except Exception as e:
        print(f"✗ Error in resume parser: {e}")
        return False

def test_app_import():
    """Test FastAPI app import"""
    try:
        from main import app
        print("✓ FastAPI app imported successfully")
        return True
    except Exception as e:
        print(f"✗ Error importing FastAPI app: {e}")
        return False

if __name__ == "__main__":
    print("=== Testing Job Portal Application ===")
    print()
    
    print("1. Testing basic dependencies...")
    basic_ok = test_basic_imports()
    print()
    
    print("2. Testing AI/NLP dependencies...")
    missing_ai_deps = test_ai_dependencies()
    print()
    
    print("3. Testing FastAPI app...")
    app_ok = test_app_import()
    print()
    
    if basic_ok and not missing_ai_deps and app_ok:
        print("4. Testing resume parser...")
        parser_ok = test_resume_parser()
        print()
        
        if parser_ok:
            print("🎉 All tests passed! Your application is ready.")
            print("\nTo run the server:")
            print("  uvicorn main:app --reload")
        else:
            print("⚠️  Resume parser needs attention, but basic app should work.")
    else:
        print("❌ Some dependencies are missing.")
        if missing_ai_deps:
            print(f"\nTo install missing AI dependencies:")
            print(f"  pip install {' '.join(missing_ai_deps)}")
        
        if not basic_ok:
            print("\nTo install basic dependencies:")
            print("  pip install -r requirements.txt")
        
        print("\nOr install all dependencies:")
        print("  pip install -r requirements.txt")
        
        if missing_ai_deps and 'spacy' in missing_ai_deps:
            print("\nAfter installing spacy, download the language model:")
            print("  python -m spacy download en_core_web_sm")
            print("  python -m spacy download en_core_web_lg  # Optional, larger model")
