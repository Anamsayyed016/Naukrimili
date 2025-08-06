"""
Database service for MySQL/MongoDB connection and operations
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
import os
from contextlib import asynccontextmanager

# Import database drivers with error handling
try:
    import aiomysql
    AIOMYSQL_AVAILABLE = True
except ImportError:
    print("Warning: aiomysql not installed. MySQL functionality will be limited.")
    AIOMYSQL_AVAILABLE = False

try:
    import pymongo
    from motor.motor_asyncio import AsyncIOMotorClient
    MONGODB_AVAILABLE = True
except ImportError:
    print("Warning: pymongo/motor not installed. MongoDB functionality will be limited.")
    MONGODB_AVAILABLE = False

logger = logging.getLogger(__name__)

class DatabaseService:
    def __init__(self, db_type: str = "mysql"):
        self.db_type = db_type.lower()
        self.connection = None
        self.pool = None
        self.mongo_client = None
        self.mongo_db = None
        
        # Database configuration from environment
        self.config = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load database configuration from environment variables"""
        if self.db_type == "mysql":
            return {
                "host": os.getenv("MYSQL_HOST", "localhost"),
                "port": int(os.getenv("MYSQL_PORT", 3306)),
                "user": os.getenv("MYSQL_USER", "jobportal"),
                "password": os.getenv("MYSQL_PASSWORD", "password"),
                "database": os.getenv("MYSQL_DATABASE", "jobportal"),
                "charset": "utf8mb4",
                "autocommit": True
            }
        else:  # MongoDB
            return {
                "host": os.getenv("MONGO_HOST", "localhost"),
                "port": int(os.getenv("MONGO_PORT", 27017)),
                "database": os.getenv("MONGO_DATABASE", "jobportal"),
                "username": os.getenv("MONGO_USERNAME"),
                "password": os.getenv("MONGO_PASSWORD"),
                "auth_database": os.getenv("MONGO_AUTH_DB", "admin")
            }
    
    async def connect(self):
        """Establish database connection"""
        try:
            if self.db_type == "mysql":
                if not AIOMYSQL_AVAILABLE:
                    logger.error("aiomysql not available. Please install: pip install aiomysql")
                    return False
                await self._connect_mysql()
            else:
                if not MONGODB_AVAILABLE:
                    logger.error("MongoDB drivers not available. Please install: pip install motor pymongo")
                    return False
                await self._connect_mongodb()
            
            # Initialize database schema
            await self._initialize_schema()
            
            logger.info(f"✅ {self.db_type.upper()} database connected successfully")
            
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            raise e
    
    async def _connect_mysql(self):
        """Connect to MySQL database"""
        try:
            # Create connection pool
            self.pool = await aiomysql.create_pool(
                host=self.config["host"],
                port=self.config["port"],
                user=self.config["user"],
                password=self.config["password"],
                db=self.config["database"],
                charset=self.config["charset"],
                autocommit=self.config["autocommit"],
                minsize=5,
                maxsize=20
            )
            
        except Exception as e:
            logger.error(f"MySQL connection failed: {e}")
            raise e
    
    async def _connect_mongodb(self):
        """Connect to MongoDB database"""
        try:
            # Build connection string
            if self.config["username"] and self.config["password"]:
                connection_string = (
                    f"mongodb://{self.config['username']}:{self.config['password']}"
                    f"@{self.config['host']}:{self.config['port']}"
                    f"/{self.config['auth_database']}"
                )
            else:
                connection_string = f"mongodb://{self.config['host']}:{self.config['port']}"
            
            self.mongo_client = AsyncIOMotorClient(connection_string)
            self.mongo_db = self.mongo_client[self.config["database"]]
            
            # Test connection
            await self.mongo_client.admin.command('ping')
            
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
            raise e
    
    async def disconnect(self):
        """Close database connections"""
        try:
            if self.db_type == "mysql" and self.pool:
                self.pool.close()
                await self.pool.wait_closed()
            elif self.db_type == "mongodb" and self.mongo_client:
                self.mongo_client.close()
            
            logger.info(f"🔐 {self.db_type.upper()} database disconnected")
            
        except Exception as e:
            logger.error(f"Database disconnect failed: {e}")
    
    async def health_check(self) -> Dict[str, Any]:
        """Check database health"""
        try:
            if self.db_type == "mysql":
                async with self.pool.acquire() as conn:
                    async with conn.cursor() as cursor:
                        await cursor.execute("SELECT 1")
                        result = await cursor.fetchone()
                        return {"status": "healthy", "type": "mysql", "test_query": bool(result)}
            else:
                await self.mongo_client.admin.command('ping')
                return {"status": "healthy", "type": "mongodb", "ping": "success"}
                
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {"status": "unhealthy", "error": str(e)}
    
    async def execute_query(self, query: str, params: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
        """Execute SQL query and return results"""
        if self.db_type != "mysql":
            raise ValueError("execute_query only supports MySQL")
        
        try:
            async with self.pool.acquire() as conn:
                async with conn.cursor(aiomysql.DictCursor) as cursor:
                    await cursor.execute(query, params or [])
                    
                    # Handle different query types
                    if query.strip().upper().startswith(('INSERT', 'UPDATE', 'DELETE')):
                        await conn.commit()
                        return [{"affected_rows": cursor.rowcount}]
                    else:
                        result = await cursor.fetchall()
                        return list(result) if result else []
                        
        except Exception as e:
            logger.error(f"Query execution failed: {query[:100]}... Error: {e}")
            raise e
    
    async def execute_mongodb_query(self, collection: str, operation: str, **kwargs) -> Any:
        """Execute MongoDB operations"""
        if self.db_type != "mongodb":
            raise ValueError("execute_mongodb_query only supports MongoDB")
        
        try:
            coll = self.mongo_db[collection]
            
            if operation == "find":
                cursor = coll.find(kwargs.get("filter", {}))
                if kwargs.get("limit"):
                    cursor = cursor.limit(kwargs["limit"])
                if kwargs.get("skip"):
                    cursor = cursor.skip(kwargs["skip"])
                if kwargs.get("sort"):
                    cursor = cursor.sort(kwargs["sort"])
                return await cursor.to_list(length=None)
                
            elif operation == "find_one":
                return await coll.find_one(kwargs.get("filter", {}))
                
            elif operation == "insert_one":
                result = await coll.insert_one(kwargs["document"])
                return {"inserted_id": str(result.inserted_id)}
                
            elif operation == "insert_many":
                result = await coll.insert_many(kwargs["documents"])
                return {"inserted_ids": [str(id) for id in result.inserted_ids]}
                
            elif operation == "update_one":
                result = await coll.update_one(kwargs["filter"], kwargs["update"])
                return {"modified_count": result.modified_count}
                
            elif operation == "delete_one":
                result = await coll.delete_one(kwargs["filter"])
                return {"deleted_count": result.deleted_count}
                
            elif operation == "count_documents":
                return await coll.count_documents(kwargs.get("filter", {}))
                
            elif operation == "aggregate":
                cursor = coll.aggregate(kwargs["pipeline"])
                return await cursor.to_list(length=None)
                
            else:
                raise ValueError(f"Unsupported MongoDB operation: {operation}")
                
        except Exception as e:
            logger.error(f"MongoDB query failed: {operation} on {collection}. Error: {e}")
            raise e
    
    async def _initialize_schema(self):
        """Initialize database schema and sample data"""
        try:
            if self.db_type == "mysql":
                await self._initialize_mysql_schema()
            else:
                await self._initialize_mongodb_schema()
                
        except Exception as e:
            logger.error(f"Schema initialization failed: {e}")
            # Don't fail startup for schema errors
            pass
    
    async def _initialize_mysql_schema(self):
        """Create MySQL tables and indexes"""
        try:
            # Create jobs table
            from models.job_models import JobModel
            job_model = JobModel()
            
            await self.execute_query(job_model.get_create_table_sql())
            
            # Create search analytics table
            analytics_table_sql = """
            CREATE TABLE IF NOT EXISTS search_analytics (
                id INT AUTO_INCREMENT PRIMARY KEY,
                search_query VARCHAR(255),
                location VARCHAR(255),
                country CHAR(2),
                user_agent TEXT,
                ip_address VARCHAR(45),
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                results_count INT DEFAULT 0,
                session_id VARCHAR(100),
                
                INDEX idx_timestamp (timestamp),
                INDEX idx_country (country),
                INDEX idx_session (session_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
            
            await self.execute_query(analytics_table_sql)
            
            # Insert sample data if table is empty
            count_result = await self.execute_query("SELECT COUNT(*) as count FROM jobs")
            if count_result[0]["count"] == 0:
                await self._insert_sample_jobs()
            
            logger.info("✅ MySQL schema initialized")
            
        except Exception as e:
            logger.error(f"MySQL schema initialization failed: {e}")
    
    async def _initialize_mongodb_schema(self):
        """Create MongoDB collections and indexes"""
        try:
            # Create indexes for jobs collection
            await self.mongo_db.jobs.create_index("job_id", unique=True)
            await self.mongo_db.jobs.create_index("country")
            await self.mongo_db.jobs.create_index("sector")
            await self.mongo_db.jobs.create_index("posted_date")
            await self.mongo_db.jobs.create_index([("title", "text"), ("company", "text"), ("description", "text")])
            
            # Create indexes for analytics collection
            await self.mongo_db.search_analytics.create_index("timestamp")
            await self.mongo_db.search_analytics.create_index("country")
            
            # Insert sample data if collection is empty
            count = await self.execute_mongodb_query("jobs", "count_documents")
            if count == 0:
                await self._insert_sample_jobs_mongodb()
            
            logger.info("✅ MongoDB schema initialized")
            
        except Exception as e:
            logger.error(f"MongoDB schema initialization failed: {e}")
    
    async def _insert_sample_jobs(self):
        """Insert sample job data for testing"""
        try:
            sample_jobs = [
                {
                    "job_id": "SAMPLE_001",
                    "title": "Senior React Developer",
                    "company": "TechWave Solutions",
                    "location": "Mumbai, India",
                    "country": "IN",
                    "salary_min": 1200000,
                    "salary_max": 1800000,
                    "currency": "INR",
                    "experience_level": "senior",
                    "job_type": "full-time",
                    "sector": "Software Development",
                    "skills": '["React", "JavaScript", "Node.js", "MongoDB"]',
                    "description": "We are looking for a Senior React Developer to join our dynamic team. You will be responsible for developing user interface components and implementing them following well-known React.js workflows.",
                    "requirements": '["5+ years of React experience", "Strong JavaScript skills", "Experience with REST APIs", "Git proficiency"]',
                    "benefits": '["Health Insurance", "Flexible Hours", "Remote Work", "Learning Budget"]',
                    "posted_date": "2025-08-06 10:00:00",
                    "is_remote": True,
                    "is_urgent": False,
                    "is_featured": True,
                    "apply_url": "https://techwave.com/careers/react-developer"
                },
                {
                    "job_id": "SAMPLE_002",
                    "title": "Data Scientist",
                    "company": "AI Innovations Ltd",
                    "location": "Bangalore, India",
                    "country": "IN",
                    "salary_min": 1000000,
                    "salary_max": 1600000,
                    "currency": "INR",
                    "experience_level": "mid",
                    "job_type": "full-time",
                    "sector": "Data Science",
                    "skills": '["Python", "Machine Learning", "TensorFlow", "SQL"]',
                    "description": "Join our AI team as a Data Scientist. You will work on cutting-edge machine learning projects and help derive insights from large datasets.",
                    "requirements": '["3+ years in Data Science", "Python expertise", "ML/AI experience", "Statistics background"]',
                    "benefits": '["Competitive Salary", "Stock Options", "Health Coverage", "Learning Opportunities"]',
                    "posted_date": "2025-08-05 14:30:00",
                    "is_remote": False,
                    "is_urgent": True,
                    "is_featured": False,
                    "apply_url": "https://aiinnovations.com/jobs/data-scientist"
                },
                {
                    "job_id": "SAMPLE_003",
                    "title": "Product Manager",
                    "company": "Digital Dynamics",
                    "location": "Delhi, India",
                    "country": "IN",
                    "salary_min": 1500000,
                    "salary_max": 2500000,
                    "currency": "INR",
                    "experience_level": "senior",
                    "job_type": "full-time",
                    "sector": "Product Management",
                    "skills": '["Product Strategy", "Agile", "Analytics", "Leadership"]',
                    "description": "We are seeking an experienced Product Manager to lead our product development initiatives and drive growth.",
                    "requirements": '["5+ years Product Management", "Technical background", "Leadership experience", "Analytical skills"]',
                    "benefits": '["High Salary", "Equity", "Flexible Work", "Team Leadership"]',
                    "posted_date": "2025-08-04 09:15:00",
                    "is_remote": True,
                    "is_urgent": False,
                    "is_featured": True,
                    "apply_url": "https://digitaldynamics.com/careers/product-manager"
                }
            ]
            
            for job in sample_jobs:
                insert_query = """
                INSERT IGNORE INTO jobs 
                (job_id, title, company, location, country, salary_min, salary_max, currency,
                 experience_level, job_type, sector, skills, description, requirements, benefits,
                 posted_date, is_remote, is_urgent, is_featured, apply_url)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                values = [
                    job["job_id"], job["title"], job["company"], job["location"], job["country"],
                    job["salary_min"], job["salary_max"], job["currency"], job["experience_level"],
                    job["job_type"], job["sector"], job["skills"], job["description"],
                    job["requirements"], job["benefits"], job["posted_date"], job["is_remote"],
                    job["is_urgent"], job["is_featured"], job["apply_url"]
                ]
                
                await self.execute_query(insert_query, values)
            
            logger.info(f"✅ Inserted {len(sample_jobs)} sample jobs")
            
        except Exception as e:
            logger.error(f"Failed to insert sample jobs: {e}")
    
    async def _insert_sample_jobs_mongodb(self):
        """Insert sample job data for MongoDB"""
        try:
            sample_jobs = [
                {
                    "job_id": "SAMPLE_001",
                    "title": "Senior React Developer",
                    "company": "TechWave Solutions",
                    "location": "Mumbai, India",
                    "country": "IN",
                    "salary_min": 1200000,
                    "salary_max": 1800000,
                    "currency": "INR",
                    "experience_level": "senior",
                    "job_type": "full-time",
                    "sector": "Software Development",
                    "skills": ["React", "JavaScript", "Node.js", "MongoDB"],
                    "description": "We are looking for a Senior React Developer to join our dynamic team.",
                    "requirements": ["5+ years of React experience", "Strong JavaScript skills"],
                    "benefits": ["Health Insurance", "Flexible Hours", "Remote Work"],
                    "posted_date": "2025-08-06T10:00:00Z",
                    "is_remote": True,
                    "is_urgent": False,
                    "is_featured": True,
                    "apply_url": "https://techwave.com/careers/react-developer"
                }
                # Add more sample jobs as needed
            ]
            
            await self.execute_mongodb_query("jobs", "insert_many", documents=sample_jobs)
            logger.info(f"✅ Inserted {len(sample_jobs)} sample jobs to MongoDB")
            
        except Exception as e:
            logger.error(f"Failed to insert sample jobs to MongoDB: {e}")
