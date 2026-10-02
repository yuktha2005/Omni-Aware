import sys
import os
import logging
import time
from contextlib import asynccontextmanager
from pathlib import Path
from datetime import datetime, timezone

# Ensure app directory is always in sys.path
app_dir = Path(__file__).resolve().parent
if str(app_dir) not in sys.path:
    sys.path.insert(0, str(app_dir))

from dotenv import load_dotenv
env_path = app_dir.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from api.recipients import router as recipient_router
from api.audience import router as audience_router
from api.segments import router as segment_router
from api.imports import router as import_router
from api.auth import router as auth_router
from api.master import router as master_router
from api.ai import router as ai_router
from api.distribution import router as distribution_router
from api.analytics import router as analytics_router
from api.emergency import router as emergency_router
from api.fact_verification import router as fact_verification_router
from api.translation_evaluation import router as translation_evaluation_router
from api.quizzes import router as quizzes_router
from database.connection import Base, engine, apply_schema_migrations
import models.admin
import models.audience
import models.master
import models.recipient
import models.segment
import models.campaign
import models.emergency
import models.fact_verification
import models.quiz
import models.audit

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S"
)
logger = logging.getLogger("app")

# Create any new tables without altering existing tables
Base.metadata.create_all(bind=engine)
apply_schema_migrations()


# ---------------------------------------------------------------------------
# Lifespan — startup validation (modern FastAPI pattern)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app):
    # Startup
    missing = []
    for var in ["DATABASE_URL", "JWT_SECRET_KEY"]:
        if not os.getenv(var):
            missing.append(var)
    if missing:
        logger.warning(
            f"⚠️  Missing required environment variables: {missing}. "
            "Set them in backend/.env before deploying to production."
        )
    else:
        logger.info("✅ All required environment variables are configured.")
    logger.info(f"✅ CORS allowed origins: {ALLOWED_ORIGINS}")
    yield
    # Shutdown (add cleanup here if needed)

# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="AI Multilingual Mass Communication Platform",
    description=(
        "Production-grade backend API for AI-powered multilingual public "
        "awareness and mass communication campaigns."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — uses env var; defaults to localhost dev origins
# ---------------------------------------------------------------------------
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Request Logging Middleware
# ---------------------------------------------------------------------------
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration = round((time.perf_counter() - start) * 1000, 1)
        logger.info(
            f"{request.method} {request.url.path} → {response.status_code} ({duration}ms)"
        )
        return response

app.add_middleware(RequestLoggingMiddleware)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(recipient_router)
app.include_router(audience_router)
app.include_router(segment_router)
app.include_router(import_router)
app.include_router(auth_router)
app.include_router(master_router)
app.include_router(ai_router)
app.include_router(distribution_router)
app.include_router(analytics_router)
app.include_router(emergency_router)
app.include_router(fact_verification_router)
app.include_router(translation_evaluation_router)
app.include_router(quizzes_router)


# ---------------------------------------------------------------------------
# Health Check (for load-balancers / Docker healthchecks)
# ---------------------------------------------------------------------------
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0"
    }


@app.get("/", tags=["System"])
def root():
    return {
        "message": "AI Multilingual Mass Communication Platform API is running",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)