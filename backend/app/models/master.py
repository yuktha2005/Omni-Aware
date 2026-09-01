from sqlalchemy import Column, BigInteger, String, Boolean, DateTime

from database.connection import Base


class Language(Base):
    __tablename__ = "languages"

    id = Column(BigInteger, primary_key=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20))
    native_name = Column(String(100))
    is_active = Column(Boolean, default=True)


class State(Base):
    __tablename__ = "states"

    id = Column(BigInteger, primary_key=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20))
    country_id = Column(BigInteger)
    is_active = Column(Boolean, default=True)


class Occupation(Base):
    __tablename__ = "occupations"

    id = Column(BigInteger, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String)
    is_active = Column(Boolean, default=True)


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(BigInteger, primary_key=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50))
    description = Column(String)
    is_active = Column(Boolean, default=True)


class OrganizationUnit(Base):
    __tablename__ = "organization_units"

    id = Column(BigInteger, primary_key=True)
    organization_id = Column(BigInteger, nullable=False)
    parent_unit_id = Column(BigInteger)
    name = Column(String(200), nullable=False)
    code = Column(String(50))
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime)