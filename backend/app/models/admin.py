from sqlalchemy import Column, BigInteger, String, Boolean, DateTime

from database.connection import Base


class Admin(Base):
    __tablename__ = "admins"

    id = Column(BigInteger, primary_key=True)
    full_name = Column(String(150))
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)