from sqlalchemy import Column, BigInteger, String, Boolean, DateTime
from datetime import datetime, timezone

from database.connection import Base


class Admin(Base):
    __tablename__ = "admins"

    id = Column(BigInteger, primary_key=True)
    full_name = Column(String(150))
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="admin", nullable=False)  # admin, campaign_manager, communication_team
    organization = Column(String(150), nullable=True)
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))