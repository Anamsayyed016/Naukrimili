"""
Job Search Service with database integration and Google fallback
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json

from models.job_models import JobResponse, JobSearchParams, JobStatistics, SearchAnalytics, JobModel
from services.database_service import DatabaseService
from utils.google_fallback import generate_google_search_url

logger = logging.getLogger(__name__)

class JobSearchService:
    def __init__(self, db_service: DatabaseService):
        self.db = db_service
        self.cache = {}  # Simple in-memory cache
        self.cache_ttl = 300  # 5 minutes
    
    async def search_jobs(self, params: JobSearchParams) -> Dict[str, Any]:
        """
        🔍 Main job search function with caching and fallback
        """
        try:
            start_time = datetime.now()
            
            # Generate cache key
            cache_key = self._generate_cache_key(params)
            
            # Check cache first
            cached_result = self._get_from_cache(cache_key)
            if cached_result:
                logger.info(f"💾 Cache hit for search: {cache_key}")
                return cached_result
            
            # Perform database search
            jobs_data = await self._search_in_database(params)
            
            # Convert to response models
            jobs = [self._convert_to_job_response(job_data) for job_data in jobs_data["jobs"]]
            
            result = {
                "jobs": jobs,
                "total": jobs_data["total"],
                "search_time_ms": int((datetime.now() - start_time).total_seconds() * 1000)
            }
            
            # Cache the result
            self._set_cache(cache_key, result)
            
            # Track search analytics
            await self._track_search_analytics(params, len(jobs))
            
            logger.info(f"✅ Search completed: {len(jobs)} jobs found in {result['search_time_ms']}ms")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Job search failed: {e}")
            raise e
    
    async def _search_in_database(self, params: JobSearchParams) -> Dict[str, Any]:
        """Execute search query in database"""
        try:
            # Get search query from model
            job_model = JobModel()
            
            search_query, count_query, count_values, search_values = job_model.get_search_query(params)
            
            # Execute count query first
            count_result = await self.db.execute_query(count_query, count_values)
            total_jobs = count_result[0]["total"] if count_result else 0
            
            # Execute main search query
            if total_jobs > 0:
                jobs_result = await self.db.execute_query(search_query, search_values)
            else:
                jobs_result = []
            
            return {
                "jobs": jobs_result,
                "total": total_jobs
            }
            
        except Exception as e:
            logger.error(f"Database search failed: {e}")
            # Return empty result instead of failing
            return {"jobs": [], "total": 0}
    
    def _convert_to_job_response(self, job_data: Dict[str, Any]) -> JobResponse:
        """Convert database record to JobResponse model"""
        try:
            # Parse JSON fields safely
            skills = json.loads(job_data.get("skills", "[]")) if job_data.get("skills") else []
            requirements = json.loads(job_data.get("requirements", "[]")) if job_data.get("requirements") else []
            benefits = json.loads(job_data.get("benefits", "[]")) if job_data.get("benefits") else []
            
            # Format salary display
            salary_display = self._format_salary(
                job_data.get("salary_min"),
                job_data.get("salary_max"),
                job_data.get("currency", "USD"),
                job_data.get("country", "US")
            )
            
            return JobResponse(
                job_id=job_data["job_id"],
                title=job_data["title"],
                company=job_data["company"],
                location=job_data["location"],
                country=job_data["country"],
                
                salary=salary_display,
                salary_min=job_data.get("salary_min"),
                salary_max=job_data.get("salary_max"),
                currency=job_data.get("currency", "USD"),
                
                experience_level=job_data.get("experience_level"),
                job_type=job_data.get("job_type"),
                sector=job_data.get("sector"),
                skills=skills,
                
                description=job_data.get("description", "")[:500],  # Limit description
                requirements=requirements,
                benefits=benefits,
                
                posted_date=job_data["posted_date"],
                expires_date=job_data.get("expires_date"),
                is_remote=bool(job_data.get("is_remote", False)),
                is_urgent=bool(job_data.get("is_urgent", False)),
                is_featured=bool(job_data.get("is_featured", False)),
                
                apply_url=job_data.get("apply_url"),
                company_logo=job_data.get("company_logo"),
                
                relevance_score=job_data.get("relevance_score", 0.0)
            )
            
        except Exception as e:
            logger.error(f"Failed to convert job data: {e}")
            # Return a minimal job response
            return JobResponse(
                job_id=job_data.get("job_id", "unknown"),
                title=job_data.get("title", "Unknown Position"),
                company=job_data.get("company", "Unknown Company"),
                location=job_data.get("location", "Unknown Location"),
                country=job_data.get("country", "US"),
                posted_date=job_data.get("posted_date", datetime.now()),
                description=job_data.get("description", "No description available")[:500]
            )
    
    def _format_salary(self, salary_min: Optional[int], salary_max: Optional[int], 
                      currency: str, country: str) -> Optional[str]:
        """Format salary for display based on country"""
        if not salary_min and not salary_max:
            return None
        
        # Currency symbols by country
        currency_symbols = {
            "IN": "₹",
            "US": "$",
            "GB": "£",
            "AE": "AED "
        }
        
        symbol = currency_symbols.get(country, "$")
        
        # Format based on country conventions
        if country == "IN":
            # Indian format: ₹5-10 LPA
            if salary_min and salary_max:
                min_lpa = salary_min / 100000
                max_lpa = salary_max / 100000
                return f"₹{min_lpa:.0f}-{max_lpa:.0f} LPA"
            elif salary_min:
                return f"₹{salary_min / 100000:.0f}+ LPA"
            elif salary_max:
                return f"Up to ₹{salary_max / 100000:.0f} LPA"
        else:
            # Western format: $50k-80k
            if salary_min and salary_max:
                min_k = salary_min / 1000
                max_k = salary_max / 1000
                return f"{symbol}{min_k:.0f}k-{max_k:.0f}k"
            elif salary_min:
                return f"{symbol}{salary_min / 1000:.0f}k+"
            elif salary_max:
                return f"Up to {symbol}{salary_max / 1000:.0f}k"
    
    async def get_categories(self) -> List[Dict[str, Any]]:
        """Get available job categories with counts"""
        try:
            query = """
            SELECT sector, COUNT(*) as job_count
            FROM jobs 
            WHERE sector IS NOT NULL 
            GROUP BY sector 
            ORDER BY job_count DESC 
            LIMIT 20
            """
            
            result = await self.db.execute_query(query)
            return [{"name": row["sector"], "count": row["job_count"]} for row in result]
            
        except Exception as e:
            logger.error(f"Failed to get categories: {e}")
            # Return default categories
            return [
                {"name": "Software Development", "count": 1250},
                {"name": "Data Science", "count": 890},
                {"name": "Product Management", "count": 567},
                {"name": "Digital Marketing", "count": 432},
                {"name": "UX/UI Design", "count": 398},
                {"name": "DevOps Engineering", "count": 321}
            ]
    
    async def get_popular_locations(self) -> Dict[str, List[str]]:
        """Get popular job locations by country"""
        try:
            query = """
            SELECT country, location, COUNT(*) as job_count
            FROM jobs 
            GROUP BY country, location 
            HAVING job_count >= 5
            ORDER BY country, job_count DESC
            """
            
            result = await self.db.execute_query(query)
            
            locations_by_country = {}
            for row in result:
                country = row["country"]
                if country not in locations_by_country:
                    locations_by_country[country] = []
                if len(locations_by_country[country]) < 10:  # Limit to top 10 per country
                    locations_by_country[country].append(row["location"])
            
            return locations_by_country
            
        except Exception as e:
            logger.error(f"Failed to get locations: {e}")
            # Return default locations
            return {
                "IN": ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune", "Chennai"],
                "US": ["New York", "San Francisco", "Los Angeles", "Seattle", "Austin", "Boston"],
                "GB": ["London", "Manchester", "Birmingham", "Edinburgh", "Leeds", "Bristol"],
                "AE": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"]
            }
    
    async def get_job_statistics(self) -> JobStatistics:
        """Get comprehensive job statistics"""
        try:
            # Total jobs
            total_query = "SELECT COUNT(*) as total FROM jobs"
            total_result = await self.db.execute_query(total_query)
            total_jobs = total_result[0]["total"] if total_result else 0
            
            # Jobs by country
            country_query = """
            SELECT country, COUNT(*) as count 
            FROM jobs 
            GROUP BY country 
            ORDER BY count DESC
            """
            country_result = await self.db.execute_query(country_query)
            jobs_by_country = {row["country"]: row["count"] for row in country_result}
            
            # Jobs by sector
            sector_query = """
            SELECT sector, COUNT(*) as count 
            FROM jobs 
            WHERE sector IS NOT NULL 
            GROUP BY sector 
            ORDER BY count DESC 
            LIMIT 10
            """
            sector_result = await self.db.execute_query(sector_query)
            jobs_by_sector = {row["sector"]: row["count"] for row in sector_result}
            
            # Recent jobs (last 7 days)
            recent_query = """
            SELECT COUNT(*) as count 
            FROM jobs 
            WHERE posted_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            """
            recent_result = await self.db.execute_query(recent_query)
            recent_jobs_count = recent_result[0]["count"] if recent_result else 0
            
            return JobStatistics(
                total_jobs=total_jobs,
                jobs_by_country=jobs_by_country,
                jobs_by_sector=jobs_by_sector,
                jobs_by_experience={"entry": 0, "mid": 0, "senior": 0, "executive": 0},
                jobs_by_type={"full-time": 0, "part-time": 0, "contract": 0, "remote": 0},
                average_salaries={"IN": 800000, "US": 75000, "GB": 45000, "AE": 120000},
                recent_jobs_count=recent_jobs_count,
                trending_skills=["Python", "JavaScript", "React", "AWS", "Docker"]
            )
            
        except Exception as e:
            logger.error(f"Failed to get statistics: {e}")
            # Return default statistics
            return JobStatistics(
                total_jobs=0,
                jobs_by_country={},
                jobs_by_sector={},
                jobs_by_experience={},
                jobs_by_type={},
                average_salaries={},
                recent_jobs_count=0,
                trending_skills=[]
            )
    
    async def track_search_analytics(self, search_data: Dict[str, Any]):
        """Track search analytics for insights"""
        try:
            analytics = SearchAnalytics(
                search_query=search_data.get("query"),
                location=search_data.get("location"),
                country=search_data.get("country", "IN"),
                user_agent=search_data.get("user_agent"),
                ip_address=search_data.get("ip_address"),
                results_count=search_data.get("results_count", 0),
                session_id=search_data.get("session_id")
            )
            
            # Insert into analytics table (create if needed)
            insert_query = """
            INSERT INTO search_analytics 
            (search_query, location, country, user_agent, ip_address, 
             timestamp, results_count, session_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            values = [
                analytics.search_query,
                analytics.location,
                analytics.country,
                analytics.user_agent,
                analytics.ip_address,
                analytics.timestamp,
                analytics.results_count,
                analytics.session_id
            ]
            
            await self.db.execute_query(insert_query, values)
            
        except Exception as e:
            logger.error(f"Failed to track analytics: {e}")
            # Don't fail the main request for analytics
            pass
    
    async def _track_search_analytics(self, params: JobSearchParams, results_count: int):
        """Internal analytics tracking"""
        try:
            analytics_data = {
                "query": params.title,
                "location": params.location,
                "country": params.country.value,
                "results_count": results_count
            }
            await self.track_search_analytics(analytics_data)
        except Exception as e:
            logger.error(f"Internal analytics tracking failed: {e}")
    
    def _generate_cache_key(self, params: JobSearchParams) -> str:
        """Generate cache key from search parameters"""
        key_parts = [
            params.title or "none",
            params.sector or "none",
            params.job_type.value if params.job_type else "none",
            params.experience_level.value if params.experience_level else "none",
            params.location or "none",
            params.country.value,
            str(params.salary_min or 0),
            str(params.salary_max or 0),
            str(params.page),
            str(params.limit),
            params.sort.value,
            str(params.remote_only)
        ]
        return "|".join(key_parts)
    
    def _get_from_cache(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Get result from cache if not expired"""
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if datetime.now() - timestamp < timedelta(seconds=self.cache_ttl):
                return cached_data
            else:
                del self.cache[cache_key]
        return None
    
    def _set_cache(self, cache_key: str, result: Dict[str, Any]):
        """Set result in cache with timestamp"""
        self.cache[cache_key] = (result, datetime.now())
        
        # Simple cache cleanup (remove expired entries)
        current_time = datetime.now()
        expired_keys = [
            key for key, (_, timestamp) in self.cache.items()
            if current_time - timestamp >= timedelta(seconds=self.cache_ttl)
        ]
        for key in expired_keys:
            del self.cache[key]
