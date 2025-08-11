"""
Mock database service for when database drivers are not available
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class MockDatabaseService:
    """Mock database service for development/testing without database dependencies"""
    
    def __init__(self, db_type: str = "mock"):
        self.db_type = "mock"
        self.connected = False
        self.mock_data = []
        
    async def connect(self):
        """Mock database connection"""
        logger.info("🔧 Using mock database service (no database drivers installed)")
        self.connected = True
        await self._load_mock_data()
        return True
    
    async def disconnect(self):
        """Mock disconnect"""
        self.connected = False
        logger.info("🔌 Mock database disconnected")
    
    async def health_check(self):
        """Mock health check"""
        return {
            "status": "healthy",
            "type": "mock",
            "connected": self.connected,
            "records": len(self.mock_data)
        }
    
    async def execute_query(self, query: str, values: Optional[List[Any]] = None):
        """Mock query execution"""
        logger.info(f"Mock query: {query[:100]}...")
        
        # Simple mock responses based on query type
        if "COUNT(*)" in query.upper():
            return [{"total": len(self.mock_data)}]
        elif "SELECT" in query.upper():
            return self.mock_data[:20]  # Return first 20 mock jobs
        else:
            return []
    
    async def insert_documents(self, collection: str, documents: List[Dict[str, Any]]):
        """Mock document insertion"""
        logger.info(f"Mock insert: {len(documents)} documents to {collection}")
        self.mock_data.extend(documents)
        return True
    
    async def initialize_database(self):
        """Mock database initialization"""
        logger.info("🏗️ Mock database initialized")
        return True
    
    async def _load_mock_data(self):
        """Load mock job data"""
        mock_jobs = [
            {
                "job_id": f"mock-job-{i}",
                "title": f"Software Engineer {i}",
                "company": f"Tech Company {i}",
                "location": "Mumbai, India" if i % 4 == 0 else "Bangalore, India" if i % 4 == 1 else "Delhi, India" if i % 4 == 2 else "Hyderabad, India",
                "country": "IN",
                "salary": "₹8-15 LPA",
                "salary_min": 800000 + (i * 50000),
                "salary_max": 1500000 + (i * 100000),
                "currency": "INR",
                "experience_level": ["entry", "mid", "senior"][i % 3],
                "job_type": "full-time",
                "sector": ["Software Development", "Data Science", "DevOps", "Product Management"][i % 4],
                "skills": ["Python", "JavaScript", "React", "Node.js"][i % 4:],
                "description": f"Exciting opportunity for a Software Engineer {i} to join our dynamic team...",
                "requirements": ["Bachelor's degree", "2+ years experience", "Strong programming skills"],
                "benefits": ["Health insurance", "Flexible hours", "Remote work"],
                "posted_date": datetime.now(),
                "expires_date": None,
                "is_remote": i % 3 == 0,
                "is_urgent": i % 5 == 0,
                "is_featured": i % 7 == 0,
                "apply_url": f"https://example.com/jobs/mock-job-{i}",
                "company_logo": None,
                "relevance_score": 0.8 + (i % 10) * 0.02
            }
            for i in range(1, 51)  # 50 mock jobs
        ]
        
        self.mock_data = mock_jobs
        logger.info(f"📊 Loaded {len(mock_jobs)} mock jobs")

# Function to create appropriate database service
def create_database_service(db_type: str = "mysql") -> Any:
    """Factory function to create database service.
    Returns a real DatabaseService only for supported types (mysql, postgresql, mongodb) when
    corresponding drivers are installed; otherwise returns MockDatabaseService.
    """
    normalized = (db_type or "").lower()
    if normalized not in ("mysql", "postgresql", "mongodb"):
        logger.info(f"🔧 Using mock database service (type '{db_type}' not in ['mysql','postgresql','mongodb'])")
        return MockDatabaseService("mock")
    try:
        if normalized == "mysql":
            try:
                import aiomysql  # noqa: F401
            except ImportError:
                raise ImportError("aiomysql not available")
        elif normalized == "postgresql":
            try:
                import asyncpg  # noqa: F401
            except ImportError:
                raise ImportError("asyncpg not available")
        else:  # mongodb
            try:
                import motor  # noqa: F401
                import pymongo  # noqa: F401
            except ImportError:
                raise ImportError("motor/pymongo not available")
        from .database_service import DatabaseService
        return DatabaseService(normalized)
    except ImportError as e:
        logger.warning(f"Database dependencies not available for {normalized} ({e}). Falling back to mock.")
        return MockDatabaseService(normalized)
