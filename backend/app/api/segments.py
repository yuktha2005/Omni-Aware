from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from models.recipient import Recipient
from models.segment import AudienceSegment, AudienceSegmentRule
from models.master import (
    Language,
    State,
    Occupation,
    Organization,
    OrganizationUnit
)


router = APIRouter(
    prefix="/segments",
    tags=["Audience Segments"]
)


@router.get("/{segment_id}/preview")
def preview_segment(
    segment_id: int,
    db: Session = Depends(get_db)
):
    # -------------------------------------------------
    # FIND SEGMENT
    # -------------------------------------------------

    segment = (
        db.query(AudienceSegment)
        .filter(
            AudienceSegment.id == segment_id,
            AudienceSegment.is_active == True
        )
        .first()
    )

    if not segment:
        raise HTTPException(
            status_code=404,
            detail="Segment not found"
        )

    # -------------------------------------------------
    # FIND SEGMENT RULES
    # -------------------------------------------------

    rule_record = (
        db.query(AudienceSegmentRule)
        .filter(
            AudienceSegmentRule.segment_id == segment_id
        )
        .first()
    )

    if not rule_record:
        raise HTTPException(
            status_code=404,
            detail="Segment rules not found"
        )

    rules = rule_record.rules or {}

    query = db.query(Recipient)

    # -------------------------------------------------
    # LANGUAGE
    # -------------------------------------------------

    if "language" in rules:
        language_value = rules["language"]

        if str(language_value).isdigit():
            query = query.filter(
                Recipient.preferred_language_id
                == int(language_value)
            )
        else:
            language = (
                db.query(Language)
                .filter(
                    Language.name.ilike(
                        str(language_value)
                    )
                )
                .first()
            )

            if not language:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Language '{language_value}' "
                        "not found"
                    )
                )

            query = query.filter(
                Recipient.preferred_language_id
                == language.id
            )

    # -------------------------------------------------
    # OCCUPATION
    # -------------------------------------------------

    if "occupation" in rules:
        occupation_value = rules["occupation"]

        if str(occupation_value).isdigit():
            query = query.filter(
                Recipient.occupation_id
                == int(occupation_value)
            )
        else:
            occupation = (
                db.query(Occupation)
                .filter(
                    Occupation.name.ilike(
                        str(occupation_value)
                    )
                )
                .first()
            )

            if not occupation:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Occupation '{occupation_value}' "
                        "not found"
                    )
                )

            query = query.filter(
                Recipient.occupation_id
                == occupation.id
            )

    # -------------------------------------------------
    # STATE
    # -------------------------------------------------

    if "state" in rules:
        state_value = rules["state"]

        if str(state_value).isdigit():
            query = query.filter(
                Recipient.state_id
                == int(state_value)
            )
        else:
            state = (
                db.query(State)
                .filter(
                    State.name.ilike(
                        str(state_value)
                    )
                )
                .first()
            )

            if not state:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"State '{state_value}' "
                        "not found"
                    )
                )

            query = query.filter(
                Recipient.state_id == state.id
            )

    # -------------------------------------------------
    # ORGANIZATION
    # -------------------------------------------------

    if "organization" in rules:
        organization_value = rules["organization"]

        if str(organization_value).isdigit():
            query = query.filter(
                Recipient.organization_id
                == int(organization_value)
            )
        else:
            organization = (
                db.query(Organization)
                .filter(
                    Organization.name.ilike(
                        str(organization_value)
                    )
                )
                .first()
            )

            if not organization:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Organization "
                        f"'{organization_value}' not found"
                    )
                )

            query = query.filter(
                Recipient.organization_id
                == organization.id
            )

    # -------------------------------------------------
    # DEPARTMENT / ORGANIZATION UNIT
    # -------------------------------------------------

    if "department" in rules:
        department_value = rules["department"]

        if str(department_value).isdigit():
            query = query.filter(
                Recipient.organization_unit_id
                == int(department_value)
            )
        else:
            department = (
                db.query(OrganizationUnit)
                .filter(
                    OrganizationUnit.name.ilike(
                        str(department_value)
                    )
                )
                .first()
            )

            if not department:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Department "
                        f"'{department_value}' not found"
                    )
                )

            query = query.filter(
                Recipient.organization_unit_id
                == department.id
            )

    # -------------------------------------------------
    # CITY
    # -------------------------------------------------

    if "city" in rules:
        query = query.filter(
            Recipient.city.ilike(
                str(rules["city"])
            )
        )

    # -------------------------------------------------
    # STATUS
    # -------------------------------------------------

    if "status" in rules:
        query = query.filter(
            Recipient.status == str(
                rules["status"]
            )
        )

    # -------------------------------------------------
    # CONSENT STATUS
    # -------------------------------------------------

    if "consent_status" in rules:
        query = query.filter(
            Recipient.consent_status == str(
                rules["consent_status"]
            )
        )

    # -------------------------------------------------
    # EXECUTE QUERY
    # -------------------------------------------------

    recipients = query.all()

    return {
        "segment_id": segment.id,
        "segment_name": segment.name,
        "matching_count": len(recipients),
        "recipients": [
            {
                "id": recipient.id,
                "external_reference_id":
                    recipient.external_reference_id,
                "first_name":
                    recipient.first_name,
                "last_name":
                    recipient.last_name,
                "email":
                    recipient.email,
                "phone_number":
                    recipient.phone_number,
                "city":
                    recipient.city,
                "status":
                    recipient.status,
                "consent_status":
                    recipient.consent_status
            }
            for recipient in recipients
        ]
    }