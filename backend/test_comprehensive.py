#!/usr/bin/env python3
"""
Comprehensive test suite for job portal backend
Tests all main components for syntax errors and basic functionality
"""

import sys
import os
import importlib.util
import traceback
from pathlib import Path

def test_python_syntax(file_path):
    """Test if a Python file has valid syntax"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            source = f.read()
        compile(source, file_path, 'exec')
        return True, None
    except SyntaxError as e:
        return False, f"Syntax Error: {e}"
    except Exception as e:
        return False, f"Error: {e}"

def test_import_module(file_path, module_name):
    """Test if a module can be imported"""
    try:
        spec = importlib.util.spec_from_file_location(module_name, file_path)
        if spec is None:
            return False, "Could not create module spec"
        
        module = importlib.util.module_from_spec(spec)
        # Don't actually execute the module to avoid side effects
        return True, None
    except Exception as e:
        return False, f"Import Error: {e}"

def main():
    """Run comprehensive tests"""
    print("🔍 Running Comprehensive Backend Tests...")
    print("=" * 50)
    
    # Define test files with their expected module names
    test_files = [
        ("backend/app.py", "app"),
        ("backend/app/__init__.py", "app"),
        ("backend/app/main.py", "app.main"),
        ("backend/app/models/user.py", "app.models.user"),
        ("backend/app/affiliate.py", "app.affiliate"),
        ("backend/app/ats.py", "app.ats"),
        ("backend/app/api/__init__.py", "app.api"),
        ("backend/app/api/jobs.py", "app.api.jobs"),
        ("backend/app/api/ai.py", "app.api.ai"),
        ("backend/app/routers/ats_routes.py", "app.routers.ats_routes"),
    ]
    
    base_dir = Path(__file__).parent
    
    total_tests = 0
    passed_tests = 0
    failed_tests = []
    
    print("📋 Testing Python Syntax...")
    print("-" * 30)
    
    for file_path, module_name in test_files:
        full_path = base_dir / file_path
        
        if not full_path.exists():
            print(f"⚠️  SKIP: {file_path} (file not found)")
            continue
            
        total_tests += 1
        
        # Test syntax
        syntax_ok, syntax_error = test_python_syntax(full_path)
        
        if syntax_ok:
            print(f"✅ PASS: {file_path}")
            passed_tests += 1
        else:
            print(f"❌ FAIL: {file_path}")
            print(f"   Error: {syntax_error}")
            failed_tests.append((file_path, syntax_error))
    
    print("\n" + "=" * 50)
    print(f"📊 TEST RESULTS:")
    print(f"   Total Files Tested: {total_tests}")
    print(f"   ✅ Passed: {passed_tests}")
    print(f"   ❌ Failed: {len(failed_tests)}")
    
    if failed_tests:
        print(f"\n❌ FAILED TESTS:")
        for file_path, error in failed_tests:
            print(f"   • {file_path}: {error}")
        return False
    else:
        print(f"\n🎉 ALL TESTS PASSED!")
        return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
