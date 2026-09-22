from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database.connection import get_db
from models.campaign import Campaign, CampaignFeedback
from schemas.analytics import (
    CampaignAnalyticsResponse,
    PlatformOverviewResponse,
    FeedbackSummary
)
from schemas.distribution import (
    EngagementEventCreate,
    FeedbackCreate,
    FeedbackResponse
)
from services.analytics.analytics_service import analytics_service
from services.auth_service import get_current_admin

router = APIRouter(
    prefix="/analytics",
    tags=["Engagement & Analytics Engine"]
)


# =========================================================
# 1. PLATFORM OVERVIEW
# =========================================================
@router.get("/overview", response_model=PlatformOverviewResponse)
def get_platform_overview(
    db: Session = Depends(get_db)
):
    return analytics_service.get_platform_overview(db=db)


# =========================================================
# 2. FULL CAMPAIGN ANALYTICS
# =========================================================
@router.get("/campaigns/{campaign_id}", response_model=CampaignAnalyticsResponse)
def get_campaign_analytics(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    try:
        return analytics_service.get_campaign_analytics(campaign_id=campaign_id, db=db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


# =========================================================
# 3. GRANULAR DRILLDOWN ENDPOINTS
# =========================================================
@router.get("/campaigns/{campaign_id}/delivery")
def get_campaign_delivery_analytics(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    analytics = analytics_service.get_campaign_analytics(campaign_id=campaign_id, db=db)
    return {
        "campaign_id": campaign_id,
        "summary": analytics["summary"],
        "channels": analytics["channels"]
    }


@router.get("/campaigns/{campaign_id}/engagement")
def get_campaign_engagement_analytics(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    analytics = analytics_service.get_campaign_analytics(campaign_id=campaign_id, db=db)
    return {
        "campaign_id": campaign_id,
        "engagement_summary": {
            "total_opened": analytics["summary"]["total_opened"],
            "open_rate": analytics["summary"]["open_rate"],
            "total_clicked": analytics["summary"]["total_clicked"],
            "click_rate": analytics["summary"]["click_rate"],
            "total_responded": analytics["summary"]["total_responded"],
            "response_rate": analytics["summary"]["response_rate"],
            "total_participated": analytics["summary"]["total_participated"],
            "participation_rate": analytics["summary"]["participation_rate"]
        }
    }


@router.get("/campaigns/{campaign_id}/channels")
def get_campaign_channels_analytics(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    analytics = analytics_service.get_campaign_analytics(campaign_id=campaign_id, db=db)
    return {
        "campaign_id": campaign_id,
        "channels": analytics["channels"]
    }


@router.get("/campaigns/{campaign_id}/languages")
def get_campaign_languages_analytics(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    analytics = analytics_service.get_campaign_analytics(campaign_id=campaign_id, db=db)
    return {
        "campaign_id": campaign_id,
        "languages": analytics["languages"]
    }


@router.get("/campaigns/{campaign_id}/audiences")
def get_campaign_audiences_analytics(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    analytics = analytics_service.get_campaign_analytics(campaign_id=campaign_id, db=db)
    return {
        "campaign_id": campaign_id,
        "audiences": analytics["audiences"]
    }


# =========================================================
# 4. AUDIENCE FEEDBACK & SENTIMENT PROCESSING
# =========================================================
@router.post("/campaigns/{campaign_id}/feedbacks", response_model=FeedbackResponse)
def submit_audience_feedback(
    campaign_id: int,
    feedback: FeedbackCreate,
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign #{campaign_id} not found"
        )

    entry = analytics_service.record_feedback(
        campaign_id=campaign_id,
        recipient_id=feedback.recipient_id,
        channel=feedback.channel,
        feedback_text=feedback.feedback_text,
        rating=feedback.rating,
        db=db
    )

    return entry


@router.get("/campaigns/{campaign_id}/feedbacks")
def list_campaign_feedbacks(
    campaign_id: int,
    sentiment: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(CampaignFeedback).filter(CampaignFeedback.campaign_id == campaign_id)
    if sentiment:
        query = query.filter(CampaignFeedback.sentiment == sentiment.lower())

    total = query.count()
    feedbacks = query.order_by(CampaignFeedback.id.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "feedbacks": [
            {
                "id": f.id,
                "recipient_id": f.recipient_id,
                "channel": f.channel,
                "feedback_text": f.feedback_text,
                "rating": f.rating,
                "sentiment": f.sentiment,
                "sentiment_score": f.sentiment_score,
                "detected_tone": f.detected_tone,
                "created_at": f.created_at.isoformat() if f.created_at else None
            }
            for f in feedbacks
        ]
    }


# =========================================================
# 5. INGEST ENGAGEMENT EVENTS (OPEN/CLICK/RESPOND)
# =========================================================
@router.post("/campaigns/{campaign_id}/events")
def record_engagement_event(
    campaign_id: int,
    event: EngagementEventCreate,
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign #{campaign_id} not found"
        )

    ev = analytics_service.record_event(
        campaign_id=campaign_id,
        channel=event.channel,
        event_type=event.event_type,
        recipient_id=event.recipient_id,
        meta_data=event.meta_data,
        db=db
    )

    return {
        "message": f"Engagement event '{event.event_type}' recorded successfully",
        "event_id": ev.id
    }
