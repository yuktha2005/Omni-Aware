from fastapi import FastAPI
from api.recipients import router as recipient_router
from api.audience import router as audience_router
from api.segments import router as segment_router
from api.imports import router as import_router
from api.auth import router as auth_router
app = FastAPI(
    title="AI Multilingual Mass Communication Platform",
    description="Backend API for audience and campaign management",
    version="1.0.0"
)

app.include_router(recipient_router)
app.include_router(audience_router)
app.include_router(segment_router)
app.include_router(import_router)
app.include_router(auth_router)
@app.get("/")
def root():
    return {
        "message": "AI Multilingual Mass Communication Platform API is running"
    }