from sqlalchemy import Column, BigInteger, Integer, String, Text, Float, DateTime, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from database.connection import Base


class EmergencyAlert(Base):
    __tablename__ = "emergency_alerts"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    alert_code = Column(String(50), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    disaster_type = Column(String(100), nullable=False)  # Flash Flood, Cyclone, Landslide, Industrial Hazard, Earthquake
    severity = Column(String(50), nullable=False)  # P1-Catastrophic, P2-Critical, P3-Advisory
    status = Column(String(50), default="active")  # active, monitoring, resolved, drill

    geo_center_lat = Column(Float, nullable=False)
    geo_center_lng = Column(Float, nullable=False)
    radius_km = Column(Float, nullable=False)
    affected_zone_name = Column(String(255), nullable=False)

    message_headline = Column(String(255), nullable=False)
    message_body = Column(Text, nullable=False)
    advisory_bulletins = Column(JSONB, nullable=True)  # Multilingual translations {"ta": "...", "hi": "...", "te": "..."}
    channels_activated = Column(JSONB, nullable=True)  # ["flash_sms", "whatsapp_sos", "ivr_siren", "pwa_alarm"]

    targeted_citizens_count = Column(Integer, default=0)
    delivered_count = Column(Integer, default=0)
    acknowledged_safe_count = Column(Integer, default=0)
    assistance_needed_count = Column(Integer, default=0)
    relief_shelters = Column(JSONB, nullable=True)

    triggered_by = Column(String(150), default="NDMA / Incident Command Center")
    created_at = Column(DateTime, server_default=func.now())
    resolved_at = Column(DateTime, nullable=True)


class CitizenCheckIn(Base):
    __tablename__ = "citizen_checkins"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    alert_id = Column(BigInteger, nullable=False)
    recipient_id = Column(BigInteger, nullable=True)
    citizen_name = Column(String(150), nullable=False)
    phone_number = Column(String(20), nullable=False)
    city = Column(String(100), nullable=True)
    status = Column(String(50), nullable=False)  # safe, needs_rescue, evacuated
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
