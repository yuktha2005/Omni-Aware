from sqlalchemy import Column, BigInteger, String, Date, DateTime
from database.connection import Base


class Recipient(Base):
    __tablename__ = "recipients"

    id = Column(BigInteger, primary_key=True)
    external_reference_id = Column(String(100))
    first_name = Column(String(100))
    last_name = Column(String(100))
    email = Column(String(255))
    phone_number = Column(String(20))
    date_of_birth = Column(Date)
    gender = Column(String(30))

    occupation_id = Column(BigInteger)
    organization_id = Column(BigInteger)
    organization_unit_id = Column(BigInteger)

    state_id = Column(BigInteger)
    district_id = Column(BigInteger)

    city = Column(String(100))
    pincode = Column(String(10))

    preferred_language_id = Column(BigInteger)
    timezone = Column(String(50))

    status = Column(String(30))
    consent_status = Column(String(30))

    created_at = Column(DateTime)
    updated_at = Column(DateTime)