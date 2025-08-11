"""
Configuration settings for the FastAPI application
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_debug: bool = False
    api_reload: bool = False
    
    # Database Configuration
    database_type: str = "mysql"  # mysql, postgresql, or mongodb
    database_url: Optional[str] = None
    
    # MySQL Configuration
    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_user: str = "root"
    mysql_password: str = ""
    mysql_database: str = "jobportal"
    
    # PostgreSQL Configuration
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_user: str = "postgres"
    postgres_password: str = ""
    postgres_database: str = "jobportal"
    
    # MongoDB Configuration
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_database: str = "jobportal"
    
    # Redis Configuration
    redis_url: str = "redis://localhost:6379/0"
    redis_password: Optional[str] = None
    cache_ttl: int = 300  # 5 minutes
    
    # Security Configuration
    secret_key: str = "your-super-secret-key-change-this-in-production"
    access_token_expire_minutes: int = 30
    algorithm: str = "HS256"
    
    # CORS Configuration
    allowed_origins: List[str] = ["http://localhost:3000", "https://localhost:3000"]
    allowed_methods: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allowed_headers: List[str] = ["*"]
    
    # Rate Limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 60  # seconds
    
    # External APIs
    google_search_enabled: bool = True
    google_cx_id: Optional[str] = None
    google_api_key: Optional[str] = None
    
    # Logging Configuration
    log_level: str = "INFO"
    log_format: str = "json"
    
    # Job Search Configuration
    default_results_per_page: int = 20
    max_results_per_page: int = 100
    search_timeout: int = 30  # seconds
    
    # Geographic Configuration
    default_country: str = "IN"
    supported_countries: List[str] = ["IN", "US", "GB", "AE"]
    
    # Sample Data Configuration
    load_sample_data: bool = True
    sample_data_count: int = 100
    
    @property
    def database_url_constructed(self) -> str:
        """Construct database URL if not provided"""
        if self.database_url:
            return self.database_url
        
        if self.database_type == "mysql":
            return f"mysql+aiomysql://{self.mysql_user}:{self.mysql_password}@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}"
        elif self.database_type == "postgresql":
            return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_database}"
        elif self.database_type == "mongodb":
            return self.mongodb_url
        else:
            raise ValueError(f"Unsupported database type: {self.database_type}")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

# Global settings instance
settings = Settings()
