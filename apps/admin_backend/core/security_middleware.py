"""
Enterprise Security Middleware & Defense Utilities
ISA/IEC 62443 & NIST SP 800-53 Compliant Defense Layer
"""
import os
import re
import time
import logging
from typing import Dict, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

logger = logging.getLogger("enterprise_security")

# ==============================================================================
# 1. SLIDING WINDOW RATE LIMITER (In-Memory, DDoS & Credential Stuffing Defense)
# ==============================================================================
class RateLimiter:
    def __init__(self, max_requests: int = 120, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.clients: Dict[str, list] = {}

    def is_allowed(self, client_ip: str, endpoint_type: str = "general") -> Tuple[bool, int]:
        now = time.time()
        key = f"{client_ip}:{endpoint_type}"
        
        # Stricter limit for authentication endpoints (25 req/min)
        limit = 25 if endpoint_type == "auth" else self.max_requests

        if key not in self.clients:
            self.clients[key] = []

        # Retain only timestamps within sliding window
        self.clients[key] = [t for t in self.clients[key] if now - t < self.window_seconds]

        if len(self.clients[key]) >= limit:
            retry_after = int(self.window_seconds - (now - self.clients[key][0]))
            return False, max(1, retry_after)

        self.clients[key].append(now)
        return True, 0

rate_limiter = RateLimiter(max_requests=150, window_seconds=60)


# ==============================================================================
# 2. PATH TRAVERSAL & INPUT SANITIZER
# ==============================================================================
DANGEROUS_PATH_PATTERNS = re.compile(r"(\.\./|\.\.\\|%2e%2e%2f|%2e%2e\/|%2e%2e%5c)", re.IGNORECASE)

def sanitize_filepath(filename: str) -> str:
    """Removes path traversal tokens and restricts to safe alphanumeric and allowed symbols."""
    clean_name = os.path.basename(filename)
    clean_name = DANGEROUS_PATH_PATTERNS.sub("", clean_name)
    clean_name = re.sub(r'[^a-zA-Z0-9_\-\. ]', '', clean_name)
    return clean_name or "unnamed_file"


# ==============================================================================
# 3. ENTERPRISE DEFENSE-GRADE SECURITY MIDDLEWARE
# ==============================================================================
class EnterpriseSecurityMiddleware(BaseHTTPMiddleware):
    """
    Applies Defense-in-Depth Security Headers, Request Size Bounds, and Rate Limiting.
    """
    MAX_BODY_SIZE_BYTES = 50 * 1024 * 1024  # 50MB max upload

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "127.0.0.1"
        path = request.url.path

        # 1. Path Traversal Guard in URL
        if DANGEROUS_PATH_PATTERNS.search(path):
            logger.warning(f"Security Alert: Blocked directory traversal attempt from {client_ip} on path {path}")
            return JSONResponse(
                status_code=400,
                content={"error": "SECURITY_VIOLATION", "detail": "Malicious path sequence detected."}
            )

        # 2. Request Rate Limiting (Strict for Auth routes)
        endpoint_type = "auth" if "/api/auth" in path or "/api/v1/auth" in path else "general"
        allowed, retry_after = rate_limiter.is_allowed(client_ip, endpoint_type)
        if not allowed:
            logger.warning(f"Rate limit exceeded by {client_ip} on {path}")
            return JSONResponse(
                status_code=429,
                content={
                    "error": "RATE_LIMIT_EXCEEDED",
                    "detail": "Too many requests. Please slow down.",
                    "retry_after_seconds": retry_after
                },
                headers={"Retry-After": str(retry_after)}
            )

        # 3. Content Length Boundary Check
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.MAX_BODY_SIZE_BYTES:
            return JSONResponse(
                status_code=413,
                content={"error": "PAYLOAD_TOO_LARGE", "detail": "Request payload exceeds maximum allowed limit (50MB)."}
            )

        # 4. Process Request
        response: Response = await call_next(request)

        # 5. Inject Enterprise Hardening Headers (NIST / OWASP Recommended)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(self), geolocation=()"
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response
