from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel


class MetricSummary(BaseModel):
    total_recipients: int
    total_sent: int
    total_delivered: int
    total_failed: int
    delivery_rate: float
    total_opened: int
    open_rate: Union[float, str]  # Can be float or "N/A"
    total_clicked: int
    click_rate: Union[float, str]
    total_responded: int
    response_rate: float
    total_participated: int
    participation_rate: float


class ChannelMetric(BaseModel):
    channel: str
    sent: int
    delivered: int
    failed: int
    delivery_rate: float
    opened: int
    open_rate: Union[float, str]  # "N/A" for SMS/Web where not supported
    clicked: int
    click_rate: Union[float, str]
    responded: int
    response_rate: float


class LanguageMetric(BaseModel):
    language: str
    language_code: str
    recipient_count: int
    sent: int
    delivered: int
    delivery_rate: float
    engagement_count: int
    engagement_rate: float


class AudienceMetric(BaseModel):
    segment_name: str
    recipient_count: int
    sent: int
    delivered: int
    delivery_rate: float
    engagement_count: int
    engagement_rate: float


class FeedbackSummary(BaseModel):
    total_feedbacks: int
    average_rating: Optional[float] = None
    positive_count: int
    neutral_count: int
    negative_count: int
    positive_percentage: float
    neutral_percentage: float
    negative_percentage: float
    top_tones: Dict[str, int]


class CampaignAnalyticsResponse(BaseModel):
    campaign_id: int
    campaign_title: str
    purpose: str
    status: str
    created_at: Optional[str] = None
    scheduled_at: Optional[str] = None
    summary: MetricSummary
    channels: List[ChannelMetric]
    languages: List[LanguageMetric]
    audiences: List[AudienceMetric]
    feedback: FeedbackSummary


class PlatformOverviewResponse(BaseModel):
    total_campaigns: int
    active_campaigns: int
    completed_campaigns: int
    total_dispatches: int
    total_delivered: int
    overall_delivery_rate: float
    total_engagements: int
    overall_engagement_rate: float
    channel_distribution: Dict[str, int]
    language_distribution: Dict[str, int]
