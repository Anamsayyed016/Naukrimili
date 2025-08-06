#!/usr/bin/env python3
"""
Backend setup and dependency installer
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"📦 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        if e.stdout:
            print(f"stdout: {e.stdout}")
        if e.stderr:
            print(f"stderr: {e.stderr}")
        return False

def main():
    print("🔧 Setting up Job Portal Backend...")
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Step 1: Create virtual environment
    if not Path("venv").exists():
        if not run_command(f"{sys.executable} -m venv venv", "Creating virtual environment"):
            print("❌ Failed to create virtual environment")
            return False
    else:
        print("✅ Virtual environment already exists")
    
    # Step 2: Determine activation script
    if os.name == 'nt':  # Windows
        activate_script = "venv\\Scripts\\activate.bat"
        python_exec = "venv\\Scripts\\python.exe"
        pip_exec = "venv\\Scripts\\pip.exe"
    else:  # Linux/Mac
        activate_script = "venv/bin/activate"
        python_exec = "venv/bin/python"
        pip_exec = "venv/bin/pip"
    
    # Step 3: Upgrade pip
    if not run_command(f"{python_exec} -m pip install --upgrade pip", "Upgrading pip"):
        print("⚠️ Pip upgrade failed, continuing...")
    
    # Step 4: Install core dependencies
    core_packages = [
        "fastapi==0.104.1",
        "uvicorn[standard]==0.24.0", 
        "pydantic==2.5.0",
        "pydantic-settings==2.1.0"
    ]
    
    for package in core_packages:
        if not run_command(f"{pip_exec} install {package}", f"Installing {package}"):
            print(f"⚠️ Failed to install {package}, but continuing...")
    
    # Step 5: Install database drivers (optional)
    database_packages = [
        "aiomysql==0.2.0",
        "motor==3.3.2", 
        "pymongo==4.6.0"
    ]
    
    print("\n🗄️ Installing database drivers...")
    for package in database_packages:
        if not run_command(f"{pip_exec} install {package}", f"Installing {package}"):
            print(f"⚠️ Database package {package} failed - will use mock database")
    
    # Step 6: Install additional dependencies
    additional_packages = [
        "redis==5.0.1",
        "httpx==0.25.2",
        "python-dotenv==1.0.0",
        "email-validator==2.1.0",
        "python-dateutil==2.8.2"
    ]
    
    print("\n🔧 Installing additional packages...")
    for package in additional_packages:
        if not run_command(f"{pip_exec} install {package}", f"Installing {package}"):
            print(f"⚠️ Optional package {package} failed")
    
    # Step 7: Create .env file if it doesn't exist
    if not Path(".env").exists():
        print("\n⚙️ Creating .env configuration...")
        with open(".env", "w") as f:
            f.write("""# Database Configuration
DATABASE_TYPE=mock
DATABASE_URL=sqlite:///./jobs.db

# API Configuration  
API_HOST=0.0.0.0
API_PORT=8000
API_DEBUG=True

# Security
SECRET_KEY=dev-secret-key-change-in-production

# CORS
ALLOWED_ORIGINS=["http://localhost:3000", "https://localhost:3000"]

# Development settings
LOG_LEVEL=INFO
LOAD_SAMPLE_DATA=True
""")
        print("✅ Created .env file")
    
    # Step 8: Test the setup
    print("\n🧪 Testing backend setup...")
    
    # Test imports
    test_commands = [
        (f"{python_exec} -c \"import fastapi; print('FastAPI OK')\"", "FastAPI import"),
        (f"{python_exec} -c \"import uvicorn; print('Uvicorn OK')\"", "Uvicorn import"),
        (f"{python_exec} -c \"import pydantic; print('Pydantic OK')\"", "Pydantic import"),
        (f"{python_exec} -c \"from services.mock_database_service import MockDatabaseService; print('Mock DB OK')\"", "Mock database service")
    ]
    
    all_tests_passed = True
    for command, description in test_commands:
        if not run_command(command, f"Testing {description}"):
            all_tests_passed = False
    
    # Step 9: Final status
    print("\n" + "="*50)
    if all_tests_passed:
        print("🎉 Backend setup completed successfully!")
        print("\n🚀 To start the backend:")
        print(f"   {python_exec} test_server.py")
        print("   or")
        print(f"   {python_exec} -m uvicorn test_server:app --reload")
        print("\n📝 API will be available at: http://localhost:8000")
        print("📚 Documentation at: http://localhost:8000/docs")
    else:
        print("⚠️ Setup completed with some issues")
        print("🔧 You can still run the test server:")
        print(f"   {python_exec} test_server.py")
    
    print("\n💡 For production deployment:")
    print("   Run: python setup_backend.py --production")
    print("   Or use: ./deploy-hostinger-backend.ps1")

if __name__ == "__main__":
    main()
