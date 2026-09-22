import sys
from pathlib import Path

# Ensure app directory is always in sys.path
app_dir = Path(__file__).resolve().parent
if str(app_dir) not in sys.path:
    sys.path.insert(0, str(app_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.recipients import router as recipient_router
from api.audience import router as audience_router
from api.segments import router as segment_router
from api.imports import router as import_router
from api.auth import router as auth_router
from api.master import router as master_router
from api.ai import router as ai_router
from api.distribution import router as distribution_router
from api.analytics import router as analytics_router
from database.connection import Base, engine, apply_schema_migrations
import models.admin
import models.audience
import models.master
import models.recipient
import models.segment
import models.campaign

# Create any new tables (e.g. campaigns, campaign_contents, campaign_deliveries, etc.) without altering existing tables
Base.metadata.create_all(bind=engine)
apply_schema_migrations()

app = FastAPI(
    title="AI Multilingual Mass Communication Platform",
    description="Backend API for audience and campaign management",
    version="1.0.0"
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recipient_router)
app.include_router(audience_router)
app.include_router(segment_router)
app.include_router(import_router)
app.include_router(auth_router)
app.include_router(master_router)
app.include_router(ai_router)
app.include_router(distribution_router)
app.include_router(analytics_router)


@app.get("/")
def root():
    return {
        "message": "AI Multilingual Mass Communication Platform API is running"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)