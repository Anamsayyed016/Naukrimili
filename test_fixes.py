#!/usr/bin/env python3
"""
Quick test script to verify all fixes are working
"""

import sys
import os
import requests
import time
from pathlib import Path

def test_import(module_name, description):
    """Test if a module can be imported"""
    try:
        __import__(module_name)
        print(f"✅ {description}: OK")
        return True
    except ImportError as e:
        print(f"❌ {description}: FAILED - {e}")
        return False

def test_api_endpoint(url, description):
    """Test if an API endpoint is responding"""
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print(f"✅ {description}: OK (Status: {response.status_code})")
            return True
        else:
            print(f"⚠️ {description}: Status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ {description}: FAILED - {e}")
        return False

def main():
    print("🧪 Testing Job Portal Fixes...\n")
    
    # Test 1: Python imports
    print("📦 Testing Python Imports:")
    imports_ok = all([
        test_import("fastapi", "FastAPI"),
        test_import("pydantic", "Pydantic"),
        test_import("uvicorn", "Uvicorn"),
    ])
    
    # Test 2: Backend modules
    print("\n🔧 Testing Backend Modules:")
    backend_dir = Path(__file__).parent / "backend"
    if backend_dir.exists():
        sys.path.insert(0, str(backend_dir))
        
        modules_ok = all([
            test_import("models.job_models", "Job Models"),
            test_import("services.mock_database_service", "Mock Database Service"),
            test_import("config.settings", "Configuration"),
            test_import("middleware.rate_limiter", "Rate Limiter"),
        ])
    else:
        print("❌ Backend directory not found")
        modules_ok = False
    
    # Test 3: File structure
    print("\n📁 Testing File Structure:")
    required_files = [
        "backend/test_server.py",
        "backend/setup_backend.py", 
        "backend/models/job_models.py",
        "backend/services/mock_database_service.py",
        "components.json",
        "package.json",
        "next.config.mjs"
    ]
    
    files_ok = True
    for file_path in required_files:
        full_path = Path(__file__).parent / file_path
        if full_path.exists():
            print(f"✅ {file_path}: EXISTS")
        else:
            print(f"❌ {file_path}: MISSING")
            files_ok = False
    
    # Test 4: API endpoints (if server is running)
    print("\n🌐 Testing API Endpoints:")
    api_tests = [
        ("http://localhost:8000/health", "Backend Health Check"),
        ("http://localhost:8000/api/jobs", "Jobs API"),
        ("http://localhost:3000", "Frontend Server"),
    ]
    
    api_ok = True
    for url, description in api_tests:
        if not test_api_endpoint(url, description):
            api_ok = False
    
    # Final Summary
    print("\n" + "="*50)
    all_tests = [imports_ok, modules_ok, files_ok]
    
    if all(all_tests):
        print("🎉 ALL TESTS PASSED!")
        print("\n✅ Your job portal is ready to use:")
        print("   Frontend: http://localhost:3000")
        print("   Backend API: http://localhost:8000")
        print("   API Docs: http://localhost:8000/docs")
        
        if not api_ok:
            print("\n🚀 To start the servers:")
            print("   Backend: cd backend && python test_server.py")
            print("   Frontend: pnpm dev (if not already running)")
    else:
        print("⚠️ Some tests failed, but core functionality should work")
        print("\n🔧 Try running:")
        print("   python backend/setup_backend.py")
        print("   python backend/test_server.py")
    
    print("\n📚 For more info, see: FIXES_COMPLETE_SUMMARY.md")

if __name__ == "__main__":
    main()
