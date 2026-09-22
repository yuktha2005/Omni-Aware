from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.connection import get_db
from models.admin import Admin
from schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    UpdateRoleRequest,
)
from services.auth_service import (
    verify_password,
    hash_password,
    create_access_token,
    get_current_admin,
    require_admin,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication & Access Control"]
)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    register_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    clean_email = register_data.email.strip().lower()
    existing_user = db.query(Admin).filter(Admin.email.ilike(clean_email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered."
        )

    assigned_role = (register_data.role or "communication_team").strip().lower()
    if assigned_role not in ["admin", "campaign_manager", "communication_team"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'admin', 'campaign_manager', or 'communication_team'."
        )

    hashed_pw = hash_password(register_data.password)
    new_user = Admin(
        full_name=register_data.full_name.strip(),
        email=clean_email,
        password_hash=hashed_pw,
        role=assigned_role,
        organization=register_data.organization.strip() if register_data.organization else None,
        phone=register_data.phone.strip() if register_data.phone else None,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(
        new_user.id,
        new_user.email,
        new_user.full_name or "",
        new_user.role
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(new_user)
    }


@router.post("/login", response_model=TokenResponse)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    clean_email = login_data.email.strip().lower()
    user = (
        db.query(Admin)
        .filter(Admin.email.ilike(clean_email))
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )

    if not verify_password(
        login_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    access_token = create_access_token(
        user.id,
        user.email,
        user.full_name or "",
        user.role or "admin"
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: Admin = Depends(get_current_admin)
):
    return UserResponse.model_validate(current_user)


@router.get("/users", response_model=List[UserResponse])
def list_users(
    current_user: Admin = Depends(require_admin),
    db: Session = Depends(get_db)
):
    users = db.query(Admin).order_by(Admin.created_at.desc(), Admin.id.desc()).all()
    return [UserResponse.model_validate(u) for u in users]


@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    req: UpdateRoleRequest,
    current_user: Admin = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(Admin).filter(Admin.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.role = req.role.strip().lower()
    if req.is_active is not None:
        user.is_active = req.is_active
    user.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)