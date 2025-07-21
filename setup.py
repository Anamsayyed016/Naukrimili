#!/usr/bin/env python3
"""
Setup script for Job Portal Application
Installs all required dependencies and downloads spaCy language models
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"   Error: {e.stderr}")
        return False

def main():
    """Main setup function"""
    print("🚀 Setting up Job Portal Application")
    print("=" * 50)
    
    # Install Python dependencies
    if not run_command("pip install -r requirements.txt", "Installing Python dependencies"):
        print("❌ Failed to install dependencies. Please check your Python/pip installation.")
        return False
    
    # Download spaCy language models
    print("\n📚 Downloading spaCy language models...")
    
    # Try to download the large model first, fallback to small if it fails
    if not run_command("python -m spacy download en_core_web_lg", "Downloading large English model"):
        print("⚠️  Large model download failed, trying small model...")
        if not run_command("python -m spacy download en_core_web_sm", "Downloading small English model"):
            print("❌ Failed to download any spaCy language model.")
            return False
    
    # Create .env file from example if it doesn't exist
    if not os.path.exists('.env'):
        if os.path.exists('.env.example'):
            print("\n📄 Creating .env file from template...")
            with open('.env.example', 'r') as src, open('.env', 'w') as dst:
                dst.write(src.read())
            print("✅ .env file created. Please update it with your actual API keys.")
        else:
            print("⚠️  No .env.example found. You'll need to create .env manually.")
    
    # Run tests
    print("\n🧪 Running tests...")
    if run_command("python test_app.py", "Running application tests"):
        print("\n🎉 Setup completed successfully!")
        print("\n📋 Next steps:")
        print("1. Update .env file with your actual API keys")
        print("2. Start MongoDB: mongod")
        print("3. Run the application: uvicorn main:app --reload")
        print("4. Visit http://localhost:8000/docs to see the API documentation")
        return True
    else:
        print("\n⚠️  Setup completed but tests failed. Check the error messages above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
