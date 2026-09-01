from sqlalchemy import Column, BigInteger, String, Text, Boolean, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from database.connection import Base


class AudienceSegment(Base):
    __tablename__ = "audience_segments"

    id = Column(BigInteger, primary_key=True)
    name = Column(String(150), nullable=False)
    description = Column(Text)
    segment_type = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now())


class AudienceSegmentRule(Base):
    __tablename__ = "audience_segment_rules"

    id = Column(BigInteger, primary_key=True)
    segment_id = Column(BigInteger, nullable=False)
    rules = Column(JSONB, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now())