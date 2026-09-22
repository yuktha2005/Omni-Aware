from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, status
from sqlalchemy.orm import Session

from database.connection import get_db
from models.campaign import Campaign, CampaignDelivery, DeliveryAttempt, WebBroadcast
from models.admin import Admin
from schemas.distribution import (
    ScheduleCampaignRequest,
    DispatchResponse,
    DeliveryListResponse,
    DeliveryItemResponse,
    WebBroadcastResponse
)
from services.distribution.distribution_engine import distribution_engine
from services.distribution.channel_manager import channel_manager
from services.auth_service import get_current_admin

router = APIRouter(
    tags=["Multi-Channel Distribution"]
)


# =========================================================
# 1. CAMPAIGN SCHEDULING
# =========================================================
@router.post("/campaigns/{campaign_id}/schedule")
def schedule_campaign(
    campaign_id: int,
    request: ScheduleCampaignRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign with ID {campaign_id} not found."
        )

    campaign.scheduled_at = request.scheduled_at
    campaign.scheduled_timezone = request.scheduled_timezone
    campaign.selected_channels = request.selected_channels
    if request.target_segment_id:
        campaign.target_segment_id = request.target_segment_id

    # If scheduled in future, mark SCHEDULED; otherwise mark QUEUED
    if request.scheduled_at and request.scheduled_at > datetime.utcnow():
        campaign.status = "scheduled"
    else:
        campaign.status = "queued"

    db.commit()
    db.refresh(campaign)

    return {
        "campaign_id": campaign.id,
        "status": campaign.status,
        "scheduled_at": campaign.scheduled_at.isoformat() if campaign.scheduled_at else None,
        "scheduled_timezone": campaign.scheduled_timezone,
        "selected_channels": campaign.selected_channels,
        "target_segment_id": campaign.target_segment_id,
        "message": f"Campaign #{campaign.id} is now {campaign.status}."
    }


# =========================================================
# 2. IMMEDIATE / ASYNC CAMPAIGN DISTRIBUTION
# =========================================================
@router.post("/campaigns/{campaign_id}/distribute", response_model=DispatchResponse)
def trigger_distribution(
    campaign_id: int,
    background_tasks: BackgroundTasks,
    sync_mode: bool = Query(False, description="Run synchronously if True (useful for tests)"),
    channels: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign with ID {campaign_id} not found."
        )

    selected_channels = channels or campaign.selected_channels or ["email", "sms"]

    if sync_mode:
        # Run synchronously (blocking until completion)
        result = distribution_engine.distribute_campaign(
            campaign_id=campaign_id,
            channels=selected_channels,
            db=db
        )
        return {
            "campaign_id": campaign_id,
            "status": "completed",
            "total_eligible": result["total_dispatched"],
            "channels_queued": selected_channels,
            "message": f"Synchronous distribution completed: {result['total_delivered']} delivered, {result['total_failed']} failed."
        }
    else:
        # Queue in background
        campaign.status = "queued"
        db.commit()

        background_tasks.add_task(
            distribution_engine.distribute_campaign,
            campaign_id=campaign_id,
            channels=selected_channels
        )

        return {
            "campaign_id": campaign_id,
            "status": "queued",
            "total_eligible": 0,
            "channels_queued": selected_channels,
            "message": f"Campaign #{campaign_id} queued for background distribution across {', '.join(selected_channels)}."
        }


# =========================================================
# 3. RETRY FAILED DELIVERIES
# =========================================================
@router.post("/campaigns/{campaign_id}/retry")
def retry_campaign_failures(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign with ID {campaign_id} not found."
        )

    res = distribution_engine.retry_failed_deliveries(campaign_id=campaign_id, db=db)
    return res


# =========================================================
# 4. CANCEL CAMPAIGN
# =========================================================
@router.post("/campaigns/{campaign_id}/cancel")
def cancel_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign with ID {campaign_id} not found."
        )

    if campaign.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel a completed campaign."
        )

    campaign.status = "cancelled"
    # Mark any pending queued deliveries as CANCELLED
    db.query(CampaignDelivery).filter(
        CampaignDelivery.campaign_id == campaign_id,
        CampaignDelivery.status.in_(["QUEUED", "RETRYING"])
    ).update({"status": "CANCELLED"})

    db.commit()
    return {"message": f"Campaign #{campaign_id} and pending deliveries have been cancelled."}


# =========================================================
# 5. DELIVERY TRACKING & ATTEMPTS
# =========================================================
@router.get("/campaigns/{campaign_id}/deliveries", response_model=DeliveryListResponse)
def get_campaign_deliveries(
    campaign_id: int,
    channel: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(CampaignDelivery).filter(CampaignDelivery.campaign_id == campaign_id)

    if channel:
        query = query.filter(CampaignDelivery.channel == channel.lower())
    if status_filter:
        query = query.filter(CampaignDelivery.status == status_filter.upper())

    total = query.count()
    deliveries = query.order_by(CampaignDelivery.id.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "deliveries": [
            DeliveryItemResponse(
                id=d.id,
                campaign_id=d.campaign_id,
                recipient_id=d.recipient_id,
                channel=d.channel,
                message_id=d.message_id,
                status=d.status,
                provider=d.provider,
                attempt_count=d.attempt_count,
                retry_count=d.retry_count,
                sent_at=d.sent_at,
                delivered_at=d.delivered_at,
                failed_at=d.failed_at,
                failure_reason=d.failure_reason,
                created_at=d.created_at
            )
            for d in deliveries
        ]
    }


# =========================================================
# 6. LIVE MONITORING
# =========================================================
@router.get("/campaigns/{campaign_id}/monitoring")
def monitor_campaign(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign #{campaign_id} not found"
        )

    deliveries = db.query(CampaignDelivery).filter(CampaignDelivery.campaign_id == campaign_id).all()
    
    queued = len([d for d in deliveries if d.status == "QUEUED"])
    sending = len([d for d in deliveries if d.status == "SENDING"])
    sent = len([d for d in deliveries if d.status == "SENT"])
    delivered = len([d for d in deliveries if d.status == "DELIVERED"])
    retrying = len([d for d in deliveries if d.status == "RETRYING"])
    failed = len([d for d in deliveries if d.status == "FAILED"])
    cancelled = len([d for d in deliveries if d.status == "CANCELLED"])
    total = len(deliveries)

    progress_percent = round(((delivered + failed + cancelled) / total * 100), 1) if total > 0 else 0.0

    recent_failures = [
        {
            "id": d.id,
            "recipient_id": d.recipient_id,
            "channel": d.channel,
            "failure_reason": d.failure_reason,
            "attempt_count": d.attempt_count,
            "retry_count": d.retry_count,
            "status": d.status
        }
        for d in deliveries if d.status in ["FAILED", "RETRYING"]
    ][:10]

    return {
        "campaign_id": campaign.id,
        "title": campaign.title,
        "status": campaign.status,
        "progress_percent": progress_percent,
        "metrics": {
            "total": total,
            "queued": queued,
            "sending": sending,
            "sent": sent,
            "delivered": delivered,
            "retrying": retrying,
            "failed": failed,
            "cancelled": cancelled
        },
        "channels": campaign.selected_channels or ["email", "sms"],
        "recent_failures": recent_failures
    }


# =========================================================
# 7. WEB BROADCASTS (PUBLIC & ADMIN)
# =========================================================
@router.get("/broadcasts/active", response_model=List[WebBroadcastResponse])
def get_active_web_broadcasts(
    db: Session = Depends(get_db)
):
    broadcasts = db.query(WebBroadcast).filter(
        WebBroadcast.is_active == True
    ).order_by(WebBroadcast.id.desc()).all()

    return broadcasts


@router.post("/broadcasts/{broadcast_id}/view")
def record_broadcast_view(
    broadcast_id: int,
    db: Session = Depends(get_db)
):
    b = db.query(WebBroadcast).filter(WebBroadcast.id == broadcast_id).first()
    if not b:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Broadcast #{broadcast_id} not found"
        )
    b.views_count = (b.views_count or 0) + 1
    db.commit()
    return {"id": b.id, "views_count": b.views_count}
