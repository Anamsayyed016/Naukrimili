#!/usr/bin/env python3
"""
Simple test script for Gemini API
"""

import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_gemini_direct():
    """Test Gemini API directly"""
    
    # Configure Gemini API
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ GEMINI_API_KEY not found in environment")
        return False
    
    print(f"🔍 Testing API key: {api_key[:10]}...{api_key[-4:]} (length: {len(api_key)})")
    
    try:
        genai.configure(api_key=api_key.strip())  # Remove any whitespace
        
        # Try different model versions
        models_to_try = ['gemini-pro', 'gemini-1.5-flash']
        
        for model_name in models_to_try:
            try:
                print(f"🔄 Testing {model_name}...")
                model = genai.GenerativeModel(model_name)
                
                # Test simple prompt
                prompt = "Say hello and confirm you can process text."
                
                response = model.generate_content(prompt)
                
                print(f"✅ {model_name} Response:")
                print(response.text[:200] + "..." if len(response.text) > 200 else response.text)
                print()
                
                # Now test with resume data
                resume_prompt = "Extract name and email from: John Doe, Software Engineer, john@email.com"
                resume_response = model.generate_content(resume_prompt)
                
                print(f"✅ Resume extraction test:")
                print(resume_response.text)
                
                return True
                
            except Exception as model_error:
                print(f"⚠️ {model_name} failed: {model_error}")
                continue
        
        print("❌ All models failed")
        return False
        
    except Exception as e:
        print(f"❌ Gemini API configuration error: {e}")
        
        # Provide troubleshooting tips
        if "API_KEY_INVALID" in str(e):
            print("\n🔧 Troubleshooting tips:")
            print("1. Verify your API key is correct")
            print("2. Check if API key has proper permissions")
            print("3. Ensure Generative AI API is enabled in Google Cloud Console")
            print("4. Try generating a new API key at https://makersuite.google.com/app/apikey")
        
        return False

if __name__ == "__main__":
    print("🚀 Testing Gemini API directly")
    print("=" * 50)
    
    if test_gemini_direct():
        print("\n✅ Gemini API is working correctly!")
    else:
        print("\n❌ Gemini API test failed!")
