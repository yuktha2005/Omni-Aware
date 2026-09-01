import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from sqlalchemy.orm import Session

from database.connection import get_db
from models.admin import Admin
from schemas.auth import LoginRequest, TokenResponse
from services.auth_service import verify_password


load_dotenv()


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)


if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY is not configured in .env"
    )


def create_access_token(admin_id: int, email: str):
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(admin_id),
        "email": email,
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


@router.post("/login", response_model=TokenResponse)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    admin = (
        db.query(Admin)
        .filter(Admin.email == login_data.email)
        .first()
    )

    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is inactive"
        )

    if not verify_password(
        login_data.password,
        admin.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    admin.last_login_at = datetime.now()

    db.commit()

    access_token = create_access_token(
        admin.id,
        admin.email
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }