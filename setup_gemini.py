#!/usr/bin/env python3
"""
Setup script for Gemini API integration
"""

import os
import subprocess
import sys
from dotenv import load_dotenv

def install_dependencies():
    """Install required Python packages"""
    print("📦 Installing required dependencies...")
    
    packages = [
        "google-generativeai==0.3.2",
        "python-dotenv==1.0.0",
        "PyPDF2==3.0.1",
        "python-docx==1.1.0",
        "fastapi==0.104.1",
        "uvicorn==0.24.0"
    ]
    
    for package in packages:
        try:
            print(f"   Installing {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"   ✅ {package} installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"   ❌ Failed to install {package}: {e}")
            return False
    
    return True

def setup_environment():
    """Setup environment variables"""
    print("🔧 Setting up environment variables...")
    
    env_file = ".env"
    if not os.path.exists(env_file):
        print(f"❌ {env_file} not found")
        return False
    
    # Load current environment
    load_dotenv()
    
    # Check if Gemini API key is set
    current_key = os.getenv("GEMINI_API_KEY")
    if not current_key or current_key == "your_gemini_api_key_here":
        print("⚠️  Gemini API key not set in .env file")
        print("Please follow these steps:")
        print("1. Go to https://makersuite.google.com/app/apikey")
        print("2. Create a new API key")
        print("3. Update your .env file with: GEMINI_API_KEY=your_actual_api_key")
        return False
    
    print("✅ Gemini API key found in .env file")
    return True

def test_integration():
    """Test the integration"""
    print("🧪 Testing integration...")
    
    try:
        # Import and test the resume parser
        from resume_parser import parse_resume
        
        # Test with minimal content
        test_content = "John Doe\nSoftware Engineer\njohn@email.com\n(555) 123-4567"
        test_bytes = test_content.encode('utf-8')
        
        result = parse_resume(test_bytes)
        
        if result and 'structured_data' in result:
            print("✅ Integration test passed")
            return True
        else:
            print("❌ Integration test failed - no structured data returned")
            return False
            
    except Exception as e:
        print(f"❌ Integration test failed: {str(e)}")
        return False

def main():
    """Main setup function"""
    print("🚀 Gemini API Integration Setup")
    print("=" * 50)
    
    steps = [
        ("Installing dependencies", install_dependencies),
        ("Setting up environment", setup_environment),
        ("Testing integration", test_integration)
    ]
    
    for step_name, step_func in steps:
        print(f"\n{step_name}...")
        if not step_func():
            print(f"❌ Setup failed at: {step_name}")
            sys.exit(1)
    
    print("\n🎉 Setup completed successfully!")
    print("\nNext steps:")
    print("1. Make sure your Gemini API key is set in .env file")
    print("2. Run: python test_gemini_integration.py")
    print("3. Start your FastAPI server: uvicorn main:app --reload --port 8000")
    print("4. Start your Next.js frontend: npm run dev")

if __name__ == "__main__":
    main()
