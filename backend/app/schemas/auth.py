from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field


UserRole = Literal["admin", "campaign_manager", "communication_team"]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    role: Optional[UserRole] = "communication_team"
    phone: Optional[str] = None
    organization: Optional[str] = None


class UpdateRoleRequest(BaseModel):
    role: UserRole
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    full_name: Optional[str] = None
    email: str
    role: str
    organization: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: Optional[UserResponse] = None