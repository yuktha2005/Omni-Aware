from sqlalchemy import Column, BigInteger, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from database.connection import Base


class TrustedSource(Base):
    __tablename__ = "trusted_sources"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    url = Column(String(500), nullable=False)
    category = Column(String(100), nullable=False)  # Disaster Management, Public Health, Weather, Government Schemes, Emergency Services
    description = Column(Text, nullable=True)
    verification_status = Column(String(50), default="verified")  # verified, pending, deprecated
    is_active = Column(Boolean, default=True)
    last_checked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    claims = relationship("FactClaimVerification", back_populates="trusted_source_rel")


class FactClaimVerification(Base):
    __tablename__ = "fact_claim_verifications"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    campaign_id = Column(BigInteger, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=True, index=True)
    content_id = Column(BigInteger, ForeignKey("campaign_contents.id", ondelete="CASCADE"), nullable=True, index=True)
    trusted_source_id = Column(BigInteger, ForeignKey("trusted_sources.id", ondelete="SET NULL"), nullable=True)

    claim_text = Column(Text, nullable=False)
    claim_category = Column(String(100), default="General Advisory")  # Weather Warning, Public Health, Dates & Deadlines, Government Scheme Eligibility, Emergency Helpline, Location Directive
    
    # Status: Supported, Contradicted, Insufficient Evidence, Needs Human Review
    status = Column(String(50), default="Needs Human Review", nullable=False, index=True)
    
    evidence_summary = Column(Text, nullable=True)
    source_name = Column(String(255), nullable=True)
    source_url = Column(String(500), nullable=True)
    confidence_score = Column(Float, default=0.0)  # 0.0 to 100.0
    
    requires_human_review = Column(Boolean, default=True)
    reviewer_decision = Column(String(50), default="Pending")  # Pending, Approved, Rejected, Overridden
    reviewer_notes = Column(Text, nullable=True)
    reviewed_by_admin_id = Column(BigInteger, ForeignKey("admins.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    meta_data = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    trusted_source_rel = relationship("TrustedSource", back_populates="claims")
