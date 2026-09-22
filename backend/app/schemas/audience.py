from typing import Optional

from pydantic import BaseModel, EmailStr


class AudienceFilterRequest(BaseModel):
    language: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    occupation: Optional[str] = None
    organization: Optional[str] = None
    organization_unit: Optional[str] = None
    gender: Optional[str] = None
    status: Optional[str] = None
    consent_status: Optional[str] = None


class SegmentRuleResponse(BaseModel):
    id: int
    segment_id: int
    rules: dict

    class Config:
        from_attributes = True


class SegmentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    segment_type: str
    is_active: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    rules: Optional[dict] = None

    class Config:
        from_attributes = True


class SegmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    segment_type: str = "dynamic"
    rules: dict = {}


class RecipientCreate(BaseModel):
    external_reference_id: str
    first_name: str
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    gender: Optional[str] = None

    occupation_id: Optional[int] = None
    organization_id: Optional[int] = None
    organization_unit_id: Optional[int] = None

    state_id: Optional[int] = None
    district_id: Optional[int] = None

    city: Optional[str] = None
    pincode: Optional[str] = None

    preferred_language_id: Optional[int] = None
    timezone: Optional[str] = None

    status: str = "active"
    consent_status: str = "pending"


class RecipientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    gender: Optional[str] = None

    occupation_id: Optional[int] = None
    organization_id: Optional[int] = None
    organization_unit_id: Optional[int] = None

    state_id: Optional[int] = None
    district_id: Optional[int] = None

    city: Optional[str] = None
    pincode: Optional[str] = None

    preferred_language_id: Optional[int] = None
    timezone: Optional[str] = None

    status: Optional[str] = None
    consent_status: Optional[str] = None