"""
Simplified FastAPI test server for development without dependencies
"""

import asyncio
import logging
from datetime import datetime
from typing import Optional

# Try importing FastAPI, fallback to simple HTTP server
try:
    from fastapi import FastAPI, HTTPException, Query
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse
    FASTAPI_AVAILABLE = True
except ImportError:
    print("FastAPI not available. Please install: pip install fastapi uvicorn")
    FASTAPI_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if FASTAPI_AVAILABLE:
    # Full FastAPI application
    app = FastAPI(
        title="Job Portal API",
        description="Unified Job Portal with FastAPI Backend",
        version="1.0.0"
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "https://localhost:3000"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    @app.get("/")
    async def root():
        """Health check endpoint"""
        return {
            "message": "Job Portal API - Development Mode",
            "status": "active",
            "timestamp": datetime.now().isoformat(),
            "mode": "development"
        }

    @app.get("/health")
    async def health_check():
        """Detailed health check"""
        return {
            "status": "healthy",
            "database": "mock",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0-dev"
        }

    @app.get("/api/jobs/search")
    async def search_jobs(
        q: Optional[str] = Query(None, description="Job title or keywords"),
        location: Optional[str] = Query(None, description="Job location"),
        country: Optional[str] = Query("IN", description="Country code"),
        page: int = Query(1, ge=1, description="Page number"),
        per_page: int = Query(20, ge=1, le=100, description="Results per page")
    ):
        """Mock job search endpoint"""
        try:
            # Generate mock job data
            mock_jobs = []
            for i in range(1, per_page + 1):
                job_id = f"dev-job-{(page-1)*per_page + i}"
                mock_jobs.append({
                    "id": job_id,
                    "title": f"Software Engineer {i}" if not q else f"{q} Specialist {i}",
                    "company": f"Tech Company {i}",
                    "location": location or "Mumbai, India",
                    "description": f"Exciting opportunity for {q or 'Software Engineer'} role...",
                    "salary_formatted": "₹8-15 LPA" if country == "IN" else "$60-90k",
                    "time_ago": f"{i} hours ago",
                    "redirect_url": f"/jobs/{job_id}",
                    "is_remote": i % 3 == 0,
                    "job_type": "full_time",
                    "skills": ["Python", "JavaScript", "React"][:(i % 3) + 1]
                })

            return {
                "jobs": mock_jobs,
                "total": 500,  # Mock total
                "page": page,
                "per_page": per_page,
                "total_pages": 25,
                "has_google_fallback": False,
                "google_fallback_urls": [],
                "search_time_ms": 50,
                "message": "Development mode - mock data"
            }

        except Exception as e:
            logger.error(f"Search error: {e}")
            return JSONResponse(
                status_code=500,
                content={"error": "Search failed", "message": str(e)}
            )

    if __name__ == "__main__":
        try:
            import uvicorn
            print("🚀 Starting FastAPI development server...")
            print("📝 API will be available at: http://localhost:8000")
            print("📚 Documentation available at: http://localhost:8000/docs")
            print("🔍 Health check: http://localhost:8000/health")
            print("🛑 Press Ctrl+C to stop the server")
            
            uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
        except ImportError:
            print("❌ Uvicorn not available. Please install: pip install uvicorn")
            print("💡 Or run: python -m uvicorn test_server:app --reload")

else:
    # Fallback to simple HTTP server
    import http.server
    import socketserver
    import json
    from urllib.parse import urlparse, parse_qs

    class JobPortalHandler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == "/" or self.path == "/health":
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {
                    "message": "Job Portal API - Simple HTTP Mode",
                    "status": "active",
                    "timestamp": datetime.now().isoformat()
                }
                self.wfile.write(json.dumps(response).encode())
            
            elif self.path.startswith("/api/jobs/search"):
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                # Parse query parameters
                parsed_url = urlparse(self.path)
                params = parse_qs(parsed_url.query)
                
                # Generate mock response
                response = {
                    "jobs": [
                        {
                            "id": "simple-job-1",
                            "title": "Software Engineer",
                            "company": "Tech Company",
                            "location": "Mumbai, India",
                            "description": "Exciting software engineering role...",
                            "salary_formatted": "₹8-15 LPA",
                            "time_ago": "2 hours ago",
                            "redirect_url": "/jobs/simple-job-1"
                        }
                    ],
                    "total": 1,
                    "page": 1,
                    "per_page": 20,
                    "message": "Simple HTTP mode - limited functionality"
                }
                self.wfile.write(json.dumps(response).encode())
            
            else:
                self.send_response(404)
                self.end_headers()

    if __name__ == "__main__":
        PORT = 8000
        with socketserver.TCPServer(("", PORT), JobPortalHandler) as httpd:
            print(f"🚀 Starting simple HTTP server on port {PORT}")
            print(f"📝 API available at: http://localhost:{PORT}")
            print("🛑 Press Ctrl+C to stop the server")
            httpd.serve_forever()
