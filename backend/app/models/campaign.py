from sqlalchemy import Column, BigInteger, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database.connection import Base
import models.admin


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    purpose = Column(String(255), nullable=False)
    target_audience = Column(String(255))
    key_information = Column(Text, nullable=False)
    desired_language = Column(String(50), default="English")
    desired_tone = Column(String(100), default="Informative")
    communication_channel = Column(String(100), default="All")
    optional_instructions = Column(Text)
    status = Column(String(50), default="draft")  # draft, validating, validated, scheduled, queued, running, completed, failed, cancelled
    
    # Scheduling & targeting fields
    scheduled_at = Column(DateTime, nullable=True)
    scheduled_timezone = Column(String(50), default="UTC")
    target_segment_id = Column(BigInteger, nullable=True)
    selected_channels = Column(JSONB, nullable=True)  # List of channels e.g. ["email", "sms", "whatsapp", "push", "web"]
    
    # Metrics cache
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    total_recipients = Column(Integer, default=0)
    total_delivered = Column(Integer, default=0)
    total_failed = Column(Integer, default=0)

    created_by_admin_id = Column(BigInteger, ForeignKey("admins.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    contents = relationship("CampaignContent", back_populates="campaign", cascade="all, delete-orphan")
    deliveries = relationship("CampaignDelivery", back_populates="campaign", cascade="all, delete-orphan")
    engagement_events = relationship("EngagementEvent", back_populates="campaign", cascade="all, delete-orphan")
    feedbacks = relationship("CampaignFeedback", back_populates="campaign", cascade="all, delete-orphan")
    broadcasts = relationship("WebBroadcast", back_populates="campaign", cascade="all, delete-orphan")


class CampaignContent(Base):
    __tablename__ = "campaign_contents"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    campaign_id = Column(BigInteger, ForeignKey("campaigns.id"), nullable=False)
    
    language = Column(String(50), nullable=False)
    language_code = Column(String(20), nullable=False)
    
    message_title = Column(String(255), nullable=False)
    message_body = Column(Text, nullable=False)
    short_version = Column(String(500))
    call_to_action = Column(String(255))
    
    audience_role = Column(String(100))
    is_personalized = Column(Boolean, default=False)
    personalization_details = Column(JSONB, nullable=True)
    
    sentiment = Column(String(50))
    sentiment_score = Column(Float)
    detected_tone = Column(String(100))
    tone_improved = Column(Boolean, default=False)
    
    quality_score = Column(Float)
    quality_details = Column(JSONB, nullable=True)
    
    compliance_passed = Column(Boolean, default=True)
    compliance_score = Column(Float)
    compliance_details = Column(JSONB, nullable=True)
    factual_status = Column(String(50), default="unable_to_verify")
    
    status = Column(String(50), default="ready_for_distribution")
    created_at = Column(DateTime, server_default=func.now())

    campaign = relationship("Campaign", back_populates="contents")


class CampaignDelivery(Base):
    __tablename__ = "campaign_deliveries"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    campaign_id = Column(BigInteger, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(BigInteger, nullable=False, index=True)
    
    channel = Column(String(50), nullable=False, index=True)  # email, sms, whatsapp, push, web
    message_id = Column(String(255), nullable=True, index=True)
    status = Column(String(50), default="QUEUED", index=True)  # QUEUED, SENDING, SENT, DELIVERED, FAILED, RETRYING, BOUNCED, CANCELLED
    provider = Column(String(100), default="mock")
    
    attempt_count = Column(Integer, default=0)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    failed_at = Column(DateTime, nullable=True)
    failure_reason = Column(Text, nullable=True)
    next_retry_at = Column(DateTime, nullable=True)
    
    meta_data = Column(JSONB, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    campaign = relationship("Campaign", back_populates="deliveries")
    attempts = relationship("DeliveryAttempt", back_populates="delivery", cascade="all, delete-orphan")


class DeliveryAttempt(Base):
    __tablename__ = "delivery_attempts"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    delivery_id = Column(BigInteger, ForeignKey("campaign_deliveries.id", ondelete="CASCADE"), nullable=False, index=True)
    attempt_number = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False)  # SENT, DELIVERED, FAILED
    provider_response = Column(JSONB, nullable=True)
    error_message = Column(Text, nullable=True)
    attempted_at = Column(DateTime, server_default=func.now())

    delivery = relationship("CampaignDelivery", back_populates="attempts")


class EngagementEvent(Base):
    __tablename__ = "engagement_events"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    campaign_id = Column(BigInteger, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(BigInteger, nullable=True, index=True)
    channel = Column(String(50), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True)  # SENT, DELIVERED, OPENED, CLICKED, RESPONDED, REGISTERED, PARTICIPATED, BOUNCED, FAILED, UNSUBSCRIBED
    event_timestamp = Column(DateTime, server_default=func.now(), index=True)
    meta_data = Column(JSONB, nullable=True)

    campaign = relationship("Campaign", back_populates="engagement_events")


class CampaignFeedback(Base):
    __tablename__ = "campaign_feedbacks"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    campaign_id = Column(BigInteger, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(BigInteger, nullable=True, index=True)
    channel = Column(String(50), nullable=True)
    feedback_text = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True)  # 1 to 5
    sentiment = Column(String(50), default="neutral")  # positive, neutral, negative
    sentiment_score = Column(Float, default=0.0)
    detected_tone = Column(String(100), default="Informative")
    created_at = Column(DateTime, server_default=func.now())

    campaign = relationship("Campaign", back_populates="feedbacks")


class WebBroadcast(Base):
    __tablename__ = "web_broadcasts"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    campaign_id = Column(BigInteger, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    language = Column(String(50), default="English")
    call_to_action = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    views_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime, nullable=True)

    campaign = relationship("Campaign", back_populates="broadcasts")

