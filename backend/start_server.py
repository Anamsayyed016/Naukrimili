#!/usr/bin/env python3
"""
Job Portal Backend Startup Script
Starts the Flask server with proper configuration
"""

import os
import sys
from pathlib import Path

def setup_environment():
    """Setup environment variables and dependencies"""
    print("🔧 Setting up environment...")
    
    # Add current directory to Python path
    current_dir = Path(__file__).parent.absolute()
    sys.path.insert(0, str(current_dir))
    
    # Check for .env file
    env_file = current_dir / '.env'
    if not env_file.exists():
        print("⚠️  .env file not found. Creating a basic one...")
        with open(env_file, 'w') as f:
            f.write("""# Job Portal Backend Environment Variables
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here
MONGO_URI=mongodb://localhost:27017
OPENAI_API_KEY=your-openai-api-key-here
""")
        print("✅ Created .env file. Please update it with your actual values.")
    
    # Check requirements
    try:
        import flask
        import flask_cors
        import pymongo
        print("✅ Required packages found")
    except ImportError as e:
        print(f"❌ Missing required package: {e}")
        print("Run: pip install flask flask-cors pymongo python-dotenv openai")
        return False
    
    return True

def start_server():
    """Start the Flask development server"""
    print("🚀 Starting Job Portal Backend Server...")
    print("📍 Server will run on: http://localhost:5000")
    print("📚 API Documentation available at: http://localhost:5000/api")
    print("\n🔍 Available Endpoints:")
    print("   GET  /api/jobs - Search jobs")
    print("   GET  /api/jobs/<id> - Get job details")
    print("   GET  /api/jobs/featured - Get featured jobs")
    print("   POST /api/jobs/<id>/apply - Apply for job")
    print("   POST /api/jobs/<id>/save - Save job")
    print("   GET  /api/jobs/saved - Get saved jobs")
    print("   POST /affiliate/payout - Process affiliate payout")
    print("   POST /api/resume/ai-generate - Generate AI resume")
    print("\n⏹️  Press Ctrl+C to stop the server")
    print("=" * 60)
    
    try:
        # Import and run the Flask app
        from app import app
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            use_reloader=True
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped gracefully")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

def main():
    """Main startup function"""
    print("=" * 60)
    print("🏢 JOB PORTAL BACKEND SERVER")
    print("=" * 60)
    
    if not setup_environment():
        print("❌ Environment setup failed. Please fix the issues above.")
        return
    
    start_server()

if __name__ == "__main__":
    main()
