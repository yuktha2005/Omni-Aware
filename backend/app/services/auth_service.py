import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Callable
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database.connection import get_db
from models.admin import Admin


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

security = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(admin_id: int = None, email: str = "", full_name: str = "", role: str = "admin", user_id: int = None) -> str:
    if not SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT_SECRET_KEY is not configured"
        )
    uid = user_id if user_id is not None else admin_id
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(uid),
        "email": email,
        "full_name": full_name or "",
        "role": role or "admin",
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Admin:
    if not SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT_SECRET_KEY is not configured"
        )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )

        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token"
        )

    user = (
        db.query(Admin)
        .filter(Admin.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    return user


# Backward-compatible alias
get_current_user = get_current_admin


def require_roles(allowed_roles: List[str]) -> Callable:
    """
    Role-Based Access Control (RBAC) dependency generator.
    Checks whether the authenticated user has one of the allowed roles.
    Supported roles: 'admin', 'campaign_manager', 'communication_team'.
    """
    normalized_allowed = [r.strip().lower() for r in allowed_roles]

    def role_checker(current_user: Admin = Depends(get_current_admin)) -> Admin:
        user_role = (current_user.role or "admin").strip().lower()
        if user_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role in {allowed_roles}, but current user has role '{current_user.role}'."
            )
        return current_user

    return role_checker


# Convenient RBAC dependencies
require_admin = require_roles(["admin"])
require_campaign_manager = require_roles(["admin", "campaign_manager"])
require_communication_team = require_roles(["admin", "campaign_manager", "communication_team"])