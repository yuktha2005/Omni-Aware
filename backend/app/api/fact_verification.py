from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.connection import get_db
from models.fact_verification import TrustedSource, FactClaimVerification
from models.admin import Admin
from schemas.omni2 import (
    TrustedSourceCreate, TrustedSourceResponse,
    ExtractAndVerifyClaimsRequest, FactVerificationResponse,
    ClaimReviewRequest, FactClaimItemResponse
)
from services.ai.fact_verification_service import fact_verification_service
from services.auth_service import get_current_admin

router = APIRouter(
    prefix="/fact-verification",
    tags=["AI Fact Verification Engine"]
)


@router.post("/extract-and-verify", response_model=FactVerificationResponse)
def extract_and_verify_claims(
    request: ExtractAndVerifyClaimsRequest,
    db: Session = Depends(get_db)
):
    """
    Extracts factual claims from campaign text, compares them against
    authoritative trusted sources, and returns verification statuses.
    """
    if not request.title and not request.body:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign title or body is required for fact verification."
        )

    result = fact_verification_service.verify_campaign(
        title=request.title,
        body=request.body,
        key_info=request.key_information,
        campaign_id=request.campaign_id,
        content_id=request.content_id,
        db=db
    )
    return result


@router.get("/campaign/{campaign_id}", response_model=List[FactClaimItemResponse])
def get_campaign_claims(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieves all verified claims and review statuses for a campaign.
    """
    claims = db.query(FactClaimVerification).filter(
        FactClaimVerification.campaign_id == campaign_id
    ).order_by(FactClaimVerification.id.asc()).all()

    return [
        FactClaimItemResponse(
            id=c.id,
            claim_text=c.claim_text,
            claim_category=c.claim_category,
            status=c.status,
            evidence_summary=c.evidence_summary,
            source_name=c.source_name,
            source_url=c.source_url,
            confidence_score=c.confidence_score or 0.0,
            requires_human_review=c.requires_human_review,
            reviewer_decision=c.reviewer_decision or "Pending",
            timestamp=c.created_at.isoformat() if c.created_at else None
        )
        for c in claims
    ]


@router.post("/claim/{claim_id}/review")
def review_fact_claim(
    claim_id: int,
    request: ClaimReviewRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Enables authorized human reviewers (Admin / Campaign Manager) to approve or reject flagged claims.
    """
    try:
        updated = fact_verification_service.review_claim(
            claim_id=claim_id,
            decision=request.decision,
            notes=request.notes,
            admin_id=current_admin.id,
            db=db
        )
        return {"status": "success", "data": updated}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/sources", response_model=List[TrustedSourceResponse])
def get_trusted_sources(
    db: Session = Depends(get_db)
):
    """
    Lists active trusted government and institutional reference sources.
    """
    sources = fact_verification_service.seed_default_sources(db)
    return sources


@router.post("/sources", response_model=TrustedSourceResponse)
def add_trusted_source(
    request: TrustedSourceCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Adds a new verified source to the registry.
    """
    source = TrustedSource(
        name=request.name,
        url=request.url,
        category=request.category,
        description=request.description,
        verification_status="verified",
        is_active=True
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return source
