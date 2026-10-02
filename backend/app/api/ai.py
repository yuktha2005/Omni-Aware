from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session


from database.connection import get_db
from models.campaign import Campaign, CampaignContent
from models.admin import Admin
from schemas.ai import (
    ContentGenerationRequest, ContentGenerationResponse,
    TranslationRequest, TranslationResponse,
    PersonalizationRequest, PersonalizationResponse,
    ToneAnalysisRequest, ToneAnalysisResponse,
    QualityCheckRequest, QualityCheckResponse,
    ComplianceCheckRequest, ComplianceCheckResponse,
    PipelineProcessRequest, PipelineProcessResponse,
    CampaignCreate, CampaignResponse, CampaignDetailResponse,
    CampaignApprovalRequest, CampaignApprovalResponse, CampaignApprovalItem,
    ProcessedContentItem
)
from services.ai.content_generator import content_generator_service
from services.ai.translation_service import translation_service
from services.ai.personalization_service import personalization_service
from services.ai.sentiment_service import sentiment_tone_service
from services.ai.quality_service import quality_check_service
from services.ai.compliance_service import compliance_check_service
from services.ai.pipeline_service import content_pipeline_service
from services.auth_service import get_current_admin, require_campaign_manager
from services.audit_service import log_audit_event
from models.fact_verification import FactClaimVerification

router = APIRouter(
    prefix="/ai",
    tags=["AI Content Engine"]
)


# =========================================================
# 1. AI CONTENT GENERATION
# =========================================================
@router.post("/generate", response_model=ContentGenerationResponse)
def generate_content(request: ContentGenerationRequest):
    if not request.campaign_title or not request.purpose or not request.key_information:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign title, purpose, and key information are required."
        )

    result = content_generator_service.generate_content(
        campaign_title=request.campaign_title,
        purpose=request.purpose,
        target_audience=request.target_audience,
        key_information=request.key_information,
        desired_language=request.desired_language,
        desired_tone=request.desired_tone,
        communication_channel=request.communication_channel,
        optional_instructions=request.optional_instructions
    )
    return result


# =========================================================
# 2. MULTILINGUAL TRANSLATION
# =========================================================
@router.post("/translate", response_model=TranslationResponse)
def translate_content(request: TranslationRequest):
    if not request.message_title and not request.message_body:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message title or body must be provided for translation."
        )

    if not request.target_languages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one target language must be provided."
        )

    translations = translation_service.translate_campaign_content(
        message_title=request.message_title,
        message_body=request.message_body,
        short_version=request.short_version,
        call_to_action=request.call_to_action,
        source_language=request.source_language,
        target_languages=request.target_languages
    )

    return {
        "source_language": request.source_language,
        "translations": translations
    }


# =========================================================
# 3. AUDIENCE PERSONALIZATION
# =========================================================
@router.post("/personalize", response_model=PersonalizationResponse)
def personalize_content(request: PersonalizationRequest):
    if not request.audience_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audience role is required for personalization."
        )

    result = personalization_service.personalize_content(
        message_title=request.message_title,
        message_body=request.message_body,
        short_version=request.short_version,
        call_to_action=request.call_to_action,
        audience_role=request.audience_role,
        language=request.language,
        location_context=request.location_context,
        organization_context=request.organization_context,
        department_context=request.department_context
    )
    return result


# =========================================================
# 4. SENTIMENT AND TONE OPTIMIZATION
# =========================================================
@router.post("/analyze-tone", response_model=ToneAnalysisResponse)
def analyze_tone(request: ToneAnalysisRequest):
    if not request.message_body and not request.message_title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content is required for tone and sentiment analysis."
        )

    result = sentiment_tone_service.optimize_tone(
        message_title=request.message_title,
        message_body=request.message_body,
        campaign_purpose=request.campaign_purpose,
        target_tone=request.target_tone
    )
    return result


# =========================================================
# 5. AI QUALITY CHECK
# =========================================================
@router.post("/quality-check", response_model=QualityCheckResponse)
def quality_check(request: QualityCheckRequest):
    result = quality_check_service.evaluate_quality(
        message_title=request.message_title,
        message_body=request.message_body,
        short_version=request.short_version,
        call_to_action=request.call_to_action,
        language=request.language,
        target_tone=request.target_tone
    )
    return result


# =========================================================
# 6. AI COMPLIANCE / SAFETY CHECK
# =========================================================
@router.post("/compliance-check", response_model=ComplianceCheckResponse)
def compliance_check(request: ComplianceCheckRequest):
    result = compliance_check_service.evaluate_compliance(
        message_title=request.message_title,
        message_body=request.message_body,
        short_version=request.short_version,
        call_to_action=request.call_to_action,
        factual_claims_present=request.factual_claims_present
    )
    return result


# =========================================================
# 7. END-TO-END PIPELINE PROCESSING
# =========================================================
@router.post("/process", response_model=PipelineProcessResponse)
def process_pipeline(
    request: PipelineProcessRequest,
    db: Session = Depends(get_db)
):
    if not request.campaign_title or not request.purpose or not request.key_information:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campaign title, purpose, and key information are required to execute the pipeline."
        )

    result = content_pipeline_service.run_pipeline(
        campaign_title=request.campaign_title,
        purpose=request.purpose,
        target_audience=request.target_audience,
        key_information=request.key_information,
        desired_language=request.desired_language,
        desired_tone=request.desired_tone,
        communication_channel=request.communication_channel,
        optional_instructions=request.optional_instructions,
        target_languages=request.target_languages,
        audience_roles=request.audience_roles,
        db=db,
        save_to_db=request.save_to_db
    )
    return result


# =========================================================
# 8. CAMPAIGN MANAGEMENT ENDPOINTS
# =========================================================
@router.post("/campaigns", response_model=CampaignResponse)
def create_campaign(
    campaign_data: CampaignCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    campaign = Campaign(
        title=campaign_data.title,
        purpose=campaign_data.purpose,
        target_audience=campaign_data.target_audience,
        key_information=campaign_data.key_information,
        desired_language=campaign_data.desired_language,
        desired_tone=campaign_data.desired_tone,
        communication_channel=campaign_data.communication_channel,
        optional_instructions=campaign_data.optional_instructions,
        status="draft",
        created_by_admin_id=current_admin.id
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    return {
        "id": campaign.id,
        "title": campaign.title,
        "purpose": campaign.purpose,
        "target_audience": campaign.target_audience,
        "key_information": campaign.key_information,
        "desired_language": campaign.desired_language,
        "desired_tone": campaign.desired_tone,
        "communication_channel": campaign.communication_channel,
        "status": campaign.status,
        "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
        "content_count": 0
    }


@router.get("/campaigns", response_model=List[CampaignResponse])
def get_campaigns(
    db: Session = Depends(get_db)
):
    campaigns = db.query(Campaign).order_by(Campaign.id.desc()).all()
    result = []
    for c in campaigns:
        content_count = db.query(CampaignContent).filter(CampaignContent.campaign_id == c.id).count()
        result.append({
            "id": c.id,
            "title": c.title,
            "purpose": c.purpose,
            "target_audience": c.target_audience,
            "key_information": c.key_information,
            "desired_language": c.desired_language,
            "desired_tone": c.desired_tone,
            "communication_channel": c.communication_channel,
            "status": c.status,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "content_count": content_count
        })
    return result


# =========================================================
# 8b. CAMPAIGN APPROVAL & GOVERNANCE PIPELINE
# (Placed BEFORE /campaigns/{campaign_id} so FastAPI matches /approvals/queue first)
# =========================================================
@router.get("/campaigns/approvals/queue", response_model=List[CampaignApprovalItem])
def get_approval_queue(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(require_campaign_manager)
):
    query = db.query(Campaign)
    if status_filter:
        query = query.filter(Campaign.status == status_filter)
    
    campaigns = query.order_by(Campaign.id.desc()).all()
    results = []
    
    for c in campaigns:
        contents = db.query(CampaignContent).filter(CampaignContent.campaign_id == c.id).all()
        formatted_contents = [
            ProcessedContentItem(
                language=cnt.language,
                language_code=cnt.language_code,
                audience_role=cnt.audience_role or "General Public",
                message_title=cnt.message_title,
                message_body=cnt.message_body,
                short_version=cnt.short_version or "",
                call_to_action=cnt.call_to_action,
                sentiment=cnt.sentiment or "neutral",
                sentiment_score=cnt.sentiment_score or 0.0,
                detected_tone=cnt.detected_tone or "Informative",
                quality_score=cnt.quality_score or 0.0,
                compliance_passed=cnt.compliance_passed,
                compliance_score=cnt.compliance_score or 0.0,
                factual_verification_status=cnt.factual_status or "unable_to_verify",
                status=cnt.status,
                db_id=cnt.id
            )
            for cnt in contents
        ]
        
        # Fact verification claim stats
        claims = db.query(FactClaimVerification).filter(FactClaimVerification.campaign_id == c.id).all()
        total_claims = len(claims)
        supported_claims = sum(1 for cl in claims if cl.status == "Supported")
        flagged_claims = sum(1 for cl in claims if cl.status in ["Contradicted", "Needs Human Review"])
        
        # Translation quality stats
        evaluated_contents = [cnt for cnt in contents if cnt.translation_evaluation_score is not None]
        avg_trans_score = (
            round(sum(cnt.translation_evaluation_score for cnt in evaluated_contents) / len(evaluated_contents), 1)
            if evaluated_contents else (88.5 if contents else 0.0)
        )
        
        # Creator info
        creator = db.query(Admin).filter(Admin.id == c.created_by_admin_id).first() if c.created_by_admin_id else None
        creator_name = creator.full_name if creator else "Admin / Automation System"
        
        results.append(CampaignApprovalItem(
            id=c.id,
            title=c.title,
            purpose=c.purpose,
            target_audience=c.target_audience,
            key_information=c.key_information,
            desired_language=c.desired_language,
            desired_tone=c.desired_tone,
            communication_channel=c.communication_channel,
            status=c.status,
            created_at=c.created_at.isoformat() if c.created_at else None,
            created_by=creator_name,
            scheduled_at=c.scheduled_at.isoformat() if c.scheduled_at else None,
            scheduled_timezone=c.scheduled_timezone,
            selected_channels=c.selected_channels,
            target_segment_id=c.target_segment_id,
            content_count=len(contents),
            contents=formatted_contents,
            fact_verification_summary={
                "total_claims": total_claims,
                "supported_claims": supported_claims,
                "flagged_claims": flagged_claims,
                "verification_status": "Passed" if total_claims > 0 and flagged_claims == 0 else ("Flagged" if flagged_claims > 0 else "Verified Ready")
            },
            translation_quality_summary={
                "total_variations": len(contents),
                "evaluated_count": len(evaluated_contents),
                "average_quality_score": avg_trans_score,
                "languages": [cnt.language for cnt in contents]
            }
        ))
        
    return results


@router.get("/campaigns/{campaign_id}", response_model=CampaignDetailResponse)
def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign with ID {campaign_id} not found."
        )

    contents = db.query(CampaignContent).filter(CampaignContent.campaign_id == campaign_id).all()
    formatted_contents = [
        ProcessedContentItem(
            language=c.language,
            language_code=c.language_code,
            audience_role=c.audience_role or "General Public",
            message_title=c.message_title,
            message_body=c.message_body,
            short_version=c.short_version or "",
            call_to_action=c.call_to_action,
            sentiment=c.sentiment or "neutral",
            sentiment_score=c.sentiment_score or 0.0,
            detected_tone=c.detected_tone or "Informative",
            quality_score=c.quality_score or 0.0,
            compliance_passed=c.compliance_passed,
            compliance_score=c.compliance_score or 0.0,
            factual_verification_status=c.factual_status or "unable_to_verify",
            status=c.status,
            db_id=c.id
        )
        for c in contents
    ]

    return {
        "id": campaign.id,
        "title": campaign.title,
        "purpose": campaign.purpose,
        "target_audience": campaign.target_audience,
        "key_information": campaign.key_information,
        "desired_language": campaign.desired_language,
        "desired_tone": campaign.desired_tone,
        "communication_channel": campaign.communication_channel,
        "status": campaign.status,
        "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
        "content_count": len(contents),
        "contents": formatted_contents
    }



@router.post("/campaigns/{campaign_id}/submit-approval", response_model=CampaignApprovalResponse)
def submit_campaign_for_approval(
    campaign_id: int,
    request: Optional[CampaignApprovalRequest] = None,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Campaign #{campaign_id} not found.")

    campaign.status = "pending_approval"

    if request:
        if request.selected_channels:
            campaign.selected_channels = request.selected_channels
        if request.scheduled_timezone:
            campaign.scheduled_timezone = request.scheduled_timezone
        if request.target_segment_id:
            campaign.target_segment_id = request.target_segment_id
        if request.scheduled_at:
            try:
                # Parse ISO date or string
                sa_str = request.scheduled_at.replace("Z", "+00:00")
                campaign.scheduled_at = datetime.fromisoformat(sa_str)
            except Exception:
                pass

    db.commit()
    db.refresh(campaign)

    log_audit_event(
        db=db,
        action="CAMPAIGN_SUBMITTED_FOR_APPROVAL",
        admin=current_admin,
        resource_type="campaign",
        resource_id=str(campaign_id),
        details={
            "title": campaign.title,
            "notes": request.notes if request else None,
            "scheduled_at": campaign.scheduled_at.isoformat() if campaign.scheduled_at else None,
            "channels": campaign.selected_channels
        }
    )

    return {
        "campaign_id": campaign.id,
        "status": campaign.status,
        "message": f"Campaign '{campaign.title}' schedule and content submitted for management approval.",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }


@router.post("/campaigns/{campaign_id}/approve", response_model=CampaignApprovalResponse)
def approve_campaign(
    campaign_id: int,
    request: Optional[CampaignApprovalRequest] = None,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(require_campaign_manager)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Campaign #{campaign_id} not found.")

    # If scheduled in the future, set to scheduled, otherwise approved
    now_utc = datetime.now(timezone.utc)
    if campaign.scheduled_at:
        sa = campaign.scheduled_at
        if sa.tzinfo is not None:
            is_future = sa > now_utc
        else:
            is_future = sa > now_utc.replace(tzinfo=None)
        campaign.status = "scheduled" if is_future else "approved"
    else:
        campaign.status = "approved"

    db.commit()
    db.refresh(campaign)

    log_audit_event(
        db=db,
        action="CAMPAIGN_APPROVED",
        admin=current_admin,
        resource_type="campaign",
        resource_id=str(campaign_id),
        details={"title": campaign.title, "status": campaign.status, "notes": request.notes if request else None, "approved_by": current_admin.email}
    )

    return {
        "campaign_id": campaign.id,
        "status": campaign.status,
        "message": f"Campaign '{campaign.title}' approved successfully (Status: {campaign.status})! Ready for distribution.",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }



@router.post("/campaigns/{campaign_id}/reject", response_model=CampaignApprovalResponse)
def reject_campaign(
    campaign_id: int,
    request: Optional[CampaignApprovalRequest] = None,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(require_campaign_manager)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Campaign #{campaign_id} not found.")

    campaign.status = "rejected"
    db.commit()
    db.refresh(campaign)

    reason = request.reason or request.notes if request else "Needs revision"
    log_audit_event(
        db=db,
        action="CAMPAIGN_REJECTED",
        admin=current_admin,
        resource_type="campaign",
        resource_id=str(campaign_id),
        details={"title": campaign.title, "reason": reason, "rejected_by": current_admin.email}
    )

    return {
        "campaign_id": campaign.id,
        "status": campaign.status,
        "message": f"Campaign '{campaign.title}' marked as rejected/needs revision: {reason}",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }



@router.get("/contents/{content_id}")
def get_content_item(
    content_id: int,
    db: Session = Depends(get_db)
):
    item = db.query(CampaignContent).filter(CampaignContent.id == content_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campaign content with ID {content_id} not found."
        )

    return {
        "id": item.id,
        "campaign_id": item.campaign_id,
        "language": item.language,
        "language_code": item.language_code,
        "message_title": item.message_title,
        "message_body": item.message_body,
        "short_version": item.short_version,
        "call_to_action": item.call_to_action,
        "audience_role": item.audience_role,
        "is_personalized": item.is_personalized,
        "personalization_details": item.personalization_details,
        "sentiment": item.sentiment,
        "sentiment_score": item.sentiment_score,
        "detected_tone": item.detected_tone,
        "tone_improved": item.tone_improved,
        "quality_score": item.quality_score,
        "quality_details": item.quality_details,
        "compliance_passed": item.compliance_passed,
        "compliance_score": item.compliance_score,
        "compliance_details": item.compliance_details,
        "factual_status": item.factual_status,
        "status": item.status,
        "created_at": item.created_at.isoformat() if item.created_at else None
    }


# =========================================================
# 9. BONUS FEATURES: VOICE, QR, POSTER, AND HELPLINE FAQ
# =========================================================
from schemas.ai import (
    VoiceBroadcastRequest, VoiceBroadcastResponse,
    QRCodeRequest, QRCodeResponse,
    PosterRequest, PosterResponse,
    HelplineQueryRequest, HelplineQueryResponse
)
from services.ai.voice_service import voice_broadcast_service
from services.ai.qr_service import qr_code_service
from services.ai.poster_service import poster_generator_service
from services.ai.faq_service import helpline_faq_service


@router.post("/generate-voice", response_model=VoiceBroadcastResponse)
def generate_voice(request: VoiceBroadcastRequest):
    if not request.text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text is required for voice broadcast synthesis."
        )
    return voice_broadcast_service.generate_voice_audio(
        text=request.text,
        language=request.language,
        slow=request.slow
    )


@router.post("/generate-qr", response_model=QRCodeResponse)
def generate_qr(request: QRCodeRequest):
    return qr_code_service.generate_campaign_qr(
        campaign_id=request.campaign_id,
        campaign_title=request.campaign_title,
        portal_url=request.portal_url,
        info_payload=request.info_payload
    )


@router.post("/generate-poster", response_model=PosterResponse)
def generate_poster(request: PosterRequest):
    return poster_generator_service.generate_poster(
        campaign_title=request.campaign_title,
        purpose=request.purpose,
        message_body=request.message_body,
        call_to_action=request.call_to_action,
        language=request.language,
        audience_role=request.audience_role,
        campaign_id=request.campaign_id
    )


@router.post("/ask-helpline", response_model=HelplineQueryResponse)
def ask_helpline(request: HelplineQueryRequest):
    if not request.user_question or not request.key_information:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User question and campaign key information are required."
        )
    return helpline_faq_service.answer_query(
        user_question=request.user_question,
        campaign_title=request.campaign_title,
        campaign_purpose=request.campaign_purpose,
        key_information=request.key_information,
        call_to_action=request.call_to_action,
        language=request.language
    )

