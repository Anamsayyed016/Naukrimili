"""
Rate limiting middleware for FastAPI
"""

import time
from typing import Dict, Tuple, List
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiting middleware"""
    
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, List[float]] = {}
    
    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = self._get_client_ip(request)
        
        # Check rate limit
        if self._is_rate_limited(client_ip):
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later.",
                headers={"Retry-After": str(self.window_seconds)}
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        remaining_requests = self._get_remaining_requests(client_ip)
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining_requests)
        response.headers["X-RateLimit-Reset"] = str(int(time.time()) + self.window_seconds)
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request"""
        # Check for forwarded headers first
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to client host
        return request.client.host if request.client else "unknown"
    
    def _is_rate_limited(self, client_ip: str) -> bool:
        """Check if client has exceeded rate limit"""
        current_time = time.time()
        
        # Initialize if not exists
        if client_ip not in self.requests:
            self.requests[client_ip] = []
        
        # Clean old requests outside window
        cutoff_time = current_time - self.window_seconds
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if req_time > cutoff_time
        ]
        
        # Check if limit exceeded
        if len(self.requests[client_ip]) >= self.max_requests:
            return True
        
        # Add current request
        self.requests[client_ip].append(current_time)
        return False
    
    def _get_remaining_requests(self, client_ip: str) -> int:
        """Get remaining requests for client"""
        if client_ip not in self.requests:
            return self.max_requests
        
        current_requests = len(self.requests[client_ip])
        return max(0, self.max_requests - current_requests)

def rate_limit_middleware(max_requests: int = 100, window_seconds: int = 60):
    """Factory function to create rate limit middleware"""
    def create_middleware(app):
        return RateLimitMiddleware(app, max_requests, window_seconds)
    return create_middleware
