from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.connection import get_db
from models.recipient import Recipient
from schemas.audience import RecipientCreate, RecipientUpdate
from services.auth_service import get_current_admin


router = APIRouter(
    prefix="/recipients",
    tags=["Recipients"]
)


# =========================================================
# GET ALL RECIPIENTS
# =========================================================

@router.get("/")
def get_recipients(
    search: Optional[str] = None,
    status: Optional[str] = None,
    city: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Recipient)

    if search:
        search_value = f"%{search}%"

        query = query.filter(
            (Recipient.first_name.ilike(search_value))
            | (Recipient.last_name.ilike(search_value))
            | (Recipient.email.ilike(search_value))
            | (Recipient.phone_number.ilike(search_value))
            | (
                Recipient.external_reference_id.ilike(
                    search_value
                )
            )
        )

    if status:
        query = query.filter(
            Recipient.status == status
        )

    if city:
        query = query.filter(
            Recipient.city == city
        )

    total = query.count()

    recipients = (
        query
        .order_by(Recipient.id)
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "recipients": [
            {
                "id": r.id,
                "external_reference_id": r.external_reference_id,
                "first_name": r.first_name,
                "last_name": r.last_name,
                "email": r.email,
                "phone_number": r.phone_number,
                "gender": r.gender,
                "city": r.city,
                "status": r.status,
                "consent_status": r.consent_status
            }
            for r in recipients
        ]
    }


# =========================================================
# CREATE RECIPIENT - ADMIN ONLY
# =========================================================

@router.post("/")
def create_recipient(
    recipient_data: RecipientCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    existing = (
        db.query(Recipient)
        .filter(
            Recipient.external_reference_id
            == recipient_data.external_reference_id
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail=(
                "Recipient with this "
                "external_reference_id already exists"
            )
        )

    if recipient_data.email:
        existing_email = (
            db.query(Recipient)
            .filter(
                Recipient.email == recipient_data.email
            )
            .first()
        )

        if existing_email:
            raise HTTPException(
                status_code=409,
                detail="Recipient with this email already exists"
            )

    recipient = Recipient(
        **recipient_data.model_dump()
    )

    db.add(recipient)
    db.commit()
    db.refresh(recipient)

    return {
        "message": "Recipient created successfully",
        "recipient": {
            "id": recipient.id,
            "external_reference_id": recipient.external_reference_id,
            "first_name": recipient.first_name,
            "last_name": recipient.last_name,
            "email": recipient.email,
            "phone_number": recipient.phone_number,
            "gender": recipient.gender,
            "city": recipient.city,
            "status": recipient.status,
            "consent_status": recipient.consent_status
        }
    }


# =========================================================
# GET SINGLE RECIPIENT
# =========================================================

@router.get("/{recipient_id}")
def get_recipient(
    recipient_id: int,
    db: Session = Depends(get_db)
):
    recipient = (
        db.query(Recipient)
        .filter(Recipient.id == recipient_id)
        .first()
    )

    if not recipient:
        raise HTTPException(
            status_code=404,
            detail="Recipient not found"
        )

    return {
        "id": recipient.id,
        "external_reference_id": recipient.external_reference_id,
        "first_name": recipient.first_name,
        "last_name": recipient.last_name,
        "email": recipient.email,
        "phone_number": recipient.phone_number,
        "gender": recipient.gender,
        "city": recipient.city,
        "status": recipient.status,
        "consent_status": recipient.consent_status
    }


# =========================================================
# UPDATE RECIPIENT - ADMIN ONLY
# =========================================================

@router.put("/{recipient_id}")
def update_recipient(
    recipient_id: int,
    recipient_data: RecipientUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    recipient = (
        db.query(Recipient)
        .filter(Recipient.id == recipient_id)
        .first()
    )

    if not recipient:
        raise HTTPException(
            status_code=404,
            detail="Recipient not found"
        )

    update_data = recipient_data.model_dump(
        exclude_unset=True
    )

    if "email" in update_data and update_data["email"]:
        existing_email = (
            db.query(Recipient)
            .filter(
                Recipient.email == update_data["email"],
                Recipient.id != recipient_id
            )
            .first()
        )

        if existing_email:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Another recipient with this "
                    "email already exists"
                )
            )

    for field, value in update_data.items():
        setattr(recipient, field, value)

    db.commit()
    db.refresh(recipient)

    return {
        "message": "Recipient updated successfully",
        "recipient": {
            "id": recipient.id,
            "external_reference_id": recipient.external_reference_id,
            "first_name": recipient.first_name,
            "last_name": recipient.last_name,
            "email": recipient.email,
            "phone_number": recipient.phone_number,
            "gender": recipient.gender,
            "city": recipient.city,
            "status": recipient.status,
            "consent_status": recipient.consent_status
        }
    }


# =========================================================
# DELETE RECIPIENT - ADMIN ONLY
# =========================================================

@router.delete("/{recipient_id}")
def delete_recipient(
    recipient_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    recipient = (
        db.query(Recipient)
        .filter(Recipient.id == recipient_id)
        .first()
    )

    if not recipient:
        raise HTTPException(
            status_code=404,
            detail="Recipient not found"
        )

    db.delete(recipient)
    db.commit()

    return {
        "message": "Recipient deleted successfully",
        "recipient_id": recipient_id
    }