from sqlalchemy import Column, String, Integer

from database.connection import Base


class AudienceProfile(Base):
    __tablename__ = "audience_profiles"

    audience_id = Column(String(10), primary_key=True)
    full_name = Column(String(100), nullable=False)
    age = Column(Integer)
    gender = Column(String(20))
    email = Column(String(150))
    phone = Column(String(20))
    language = Column(String(50))
    state = Column(String(100))
    city = Column(String(100))
    occupation = Column(String(100))
    organization = Column(String(150))
    department = Column(String(100))
    engagement_history = Column(String(20))
    is_active = Column(String(20))