from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class ScheduleCampaignRequest(BaseModel):
    scheduled_at: Optional[datetime] = None  # None means immediate / queue now
    scheduled_timezone: str = "UTC"
    target_segment_id: Optional[int] = None
    selected_channels: List[str] = Field(default_factory=lambda: ["email", "sms"])
    content_id: Optional[int] = None


class ChannelEligibility(BaseModel):
    recipient_id: int
    recipient_name: str
    channel: str
    eligible: bool
    reason: str
    destination: Optional[str] = None


class DispatchResponse(BaseModel):
    campaign_id: int
    status: str
    total_eligible: int
    channels_queued: List[str]
    message: str


class DeliveryItemResponse(BaseModel):
    id: int
    campaign_id: int
    recipient_id: int
    channel: str
    message_id: Optional[str] = None
    status: str
    provider: str
    attempt_count: int
    retry_count: int
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    failure_reason: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DeliveryListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    deliveries: List[DeliveryItemResponse]


class EngagementEventCreate(BaseModel):
    campaign_id: int
    recipient_id: Optional[int] = None
    channel: str
    event_type: str  # SENT, DELIVERED, OPENED, CLICKED, RESPONDED, REGISTERED, PARTICIPATED, BOUNCED, FAILED, UNSUBSCRIBED
    meta_data: Optional[Dict[str, Any]] = None


class FeedbackCreate(BaseModel):
    campaign_id: int
    recipient_id: Optional[int] = None
    channel: Optional[str] = "web"
    feedback_text: str
    rating: Optional[int] = Field(default=None, ge=1, le=5)


class FeedbackResponse(BaseModel):
    id: int
    campaign_id: int
    recipient_id: Optional[int] = None
    channel: Optional[str] = None
    feedback_text: str
    rating: Optional[int] = None
    sentiment: str
    sentiment_score: float
    detected_tone: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WebBroadcastResponse(BaseModel):
    id: int
    campaign_id: int
    title: str
    body: str
    language: str
    call_to_action: Optional[str] = None
    is_active: bool
    views_count: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
