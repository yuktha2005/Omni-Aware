from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from database.connection import get_db
from models.campaign import CampaignContent
from models.admin import Admin
from schemas.omni2 import (
    TranslationEvaluationRequest, TranslationEvaluationResponse,
    TranslationReviewRequest
)
from services.ai.translation_evaluator_service import translation_evaluator_service
from services.auth_service import get_current_admin

router = APIRouter(
    prefix="/api/translation-evaluation",
    tags=["Multilingual Translation Quality Evaluator"]
)


@router.post("/evaluate", response_model=TranslationEvaluationResponse)
def evaluate_translation(
    request: TranslationEvaluationRequest,
    db: Session = Depends(get_db)
):
    """
    Evaluates translated content against source English text for critical entity preservation,
    semantic fidelity via back-translation, and terminology consistency.
    """
    if not request.source_text or not request.translated_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both source text and translated text are required for quality evaluation."
        )

    result = translation_evaluator_service.evaluate_translation(
        source_text=request.source_text,
        translated_text=request.translated_text,
        source_language=request.source_language,
        target_language=request.target_language,
        is_emergency_content=request.is_emergency_content
    )

    # If content_id provided, update DB record
    if request.content_id:
        content = db.query(CampaignContent).filter(CampaignContent.id == request.content_id).first()
        if content:
            content.translation_evaluation_score = result["quality_score"]
            content.translation_evaluation_details = {
                "status": result["status"],
                "score_breakdown": result["score_breakdown"],
                "reasons": result["reasons"],
                "issues": result["issues"],
                "preservation_details": result["preservation_details"],
                "back_translated_text": result["back_translated_text"]
            }
            if not result["can_auto_approve"]:
                content.translation_review_status = "needs_review"
            else:
                content.translation_review_status = "approved"
            db.commit()

    return result


@router.post("/content/{content_id}/review")
def review_content_translation(
    content_id: int,
    request: TranslationReviewRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Human Review action to Approve, Reject, or Edit translated content.
    """
    content = db.query(CampaignContent).filter(CampaignContent.id == content_id).first()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign content with ID {content_id} not found."
        )

    content.translation_review_status = request.review_status
    content.translation_reviewed_at = datetime.now(timezone.utc)
    content.translation_reviewed_by = current_admin.id

    if request.edited_text and request.edited_text.strip():
        content.message_body = request.edited_text.strip()

    db.commit()
    db.refresh(content)

    return {
        "status": "success",
        "content_id": content.id,
        "review_status": content.translation_review_status,
        "reviewed_at": content.translation_reviewed_at.isoformat() if content.translation_reviewed_at else None
    }
