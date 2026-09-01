from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from models.recipient import Recipient
from models.master import (
    Language,
    State,
    Occupation,
    Organization,
    OrganizationUnit
)
from schemas.audience import AudienceFilterRequest


router = APIRouter(
    prefix="/audiences",
    tags=["Audience"]
)


@router.get("/")
def get_audiences(db: Session = Depends(get_db)):
    recipients = db.query(Recipient).all()

    return recipients


@router.post("/preview")
def preview_audience(
    filters: AudienceFilterRequest,
    db: Session = Depends(get_db)
):
    query = (
        db.query(Recipient)
        .join(
            Language,
            Recipient.preferred_language_id == Language.id,
            isouter=True
        )
        .join(
            State,
            Recipient.state_id == State.id,
            isouter=True
        )
        .join(
            Occupation,
            Recipient.occupation_id == Occupation.id,
            isouter=True
        )
        .join(
            Organization,
            Recipient.organization_id == Organization.id,
            isouter=True
        )
        .join(
            OrganizationUnit,
            Recipient.organization_unit_id == OrganizationUnit.id,
            isouter=True
        )
    )

    if filters.language:
        query = query.filter(
            Language.name == filters.language
        )

    if filters.state:
        query = query.filter(
            State.name == filters.state
        )

    if filters.city:
        query = query.filter(
            Recipient.city == filters.city
        )

    if filters.occupation:
        query = query.filter(
            Occupation.name == filters.occupation
        )

    if filters.organization:
        query = query.filter(
            Organization.name == filters.organization
        )

    if filters.organization_unit:
        query = query.filter(
            OrganizationUnit.name == filters.organization_unit
        )

    if filters.gender:
        query = query.filter(
            Recipient.gender == filters.gender
        )

    if filters.status:
        query = query.filter(
            Recipient.status == filters.status
        )

    if filters.consent_status:
        query = query.filter(
            Recipient.consent_status == filters.consent_status
        )

    recipients = query.all()

    return {
        "matching_count": len(recipients),
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