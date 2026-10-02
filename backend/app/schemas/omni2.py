from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


# ==========================================
# MODULE 1: FACT VERIFICATION SCHEMAS
# ==========================================
class TrustedSourceCreate(BaseModel):
    name: str
    url: str
    category: str
    description: Optional[str] = None


class TrustedSourceResponse(BaseModel):
    id: int
    name: str
    url: str
    category: str
    description: Optional[str] = None
    verification_status: str
    is_active: bool
    last_checked_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExtractAndVerifyClaimsRequest(BaseModel):
    title: str
    body: str
    key_information: Optional[str] = None
    campaign_id: Optional[int] = None
    content_id: Optional[int] = None


class FactClaimItemResponse(BaseModel):
    id: Optional[int] = None
    claim_text: str
    claim_category: str
    status: str
    evidence_summary: Optional[str] = None
    source_name: Optional[str] = None
    source_url: Optional[str] = None
    confidence_score: float
    requires_human_review: bool
    reviewer_decision: str
    timestamp: Optional[str] = None


class FactVerificationResponse(BaseModel):
    campaign_id: Optional[int] = None
    overall_status: str
    can_auto_publish: bool
    total_claims: int
    supported_count: int
    contradicted_count: int
    needs_review_count: int
    insufficient_count: int
    claims: List[FactClaimItemResponse]


class ClaimReviewRequest(BaseModel):
    decision: str = Field(..., description="Approved, Rejected, Overridden")
    notes: Optional[str] = None


# ==========================================
# MODULE 2: TRANSLATION EVALUATION SCHEMAS
# ==========================================
class TranslationEvaluationRequest(BaseModel):
    source_text: str
    translated_text: str
    source_language: str = "English"
    target_language: str = "Hindi"
    is_emergency_content: bool = False
    campaign_id: Optional[int] = None
    content_id: Optional[int] = None


class TranslationEvaluationResponse(BaseModel):
    quality_score: float
    status: str
    can_auto_approve: bool
    source_language: str
    target_language: str
    source_text: str
    translated_text: str
    back_translated_text: Optional[str] = None
    reasons: List[str]
    issues: List[Dict[str, Any]]
    critical_errors_count: int
    score_breakdown: Dict[str, float]
    preservation_details: Dict[str, Any]


class TranslationReviewRequest(BaseModel):
    review_status: str = Field(..., description="approved, rejected, edited")
    edited_text: Optional[str] = None
    reviewer_notes: Optional[str] = None


# ==========================================
# MODULE 3: CITIZEN UNDERSTANDING SCHEMAS
# ==========================================
class QuizOption(BaseModel):
    id: str
    text: str


class QuizQuestionItem(BaseModel):
    id: Optional[int] = None
    order_num: int
    question_text: str
    options: List[QuizOption]
    explanation: Optional[str] = None
    correct_option_id: Optional[str] = None  # Omitted in public view if needed


class GenerateQuizRequest(BaseModel):
    language: str = "English"
    num_questions: int = 3


class PublicQuizResponse(BaseModel):
    id: int
    campaign_id: int
    title: str
    description: Optional[str] = None
    language: str
    questions: List[QuizQuestionItem]


class QuizSubmissionRequest(BaseModel):
    answers: Dict[str, str] = Field(..., description="Mapping of question id/order to selected option ID (e.g. {'1': 'A', '2': 'B'})")
    language: str = "English"
    session_id: Optional[str] = None


class QuizSubmissionResult(BaseModel):
    quiz_id: int
    campaign_id: Optional[int] = None
    total_questions: int
    correct_count: int
    score_percentage: float
    passed: bool
    feedback_message: str
    question_results: List[Dict[str, Any]]


class UnderstandingAnalyticsResponse(BaseModel):
    campaign_id: int
    has_data: bool
    total_participants: int
    total_questions_answered: Optional[int] = 0
    total_correct_answers: Optional[int] = 0
    overall_understanding_rate: float
    correct_response_percentage: float
    incorrect_response_percentage: float
    question_performance: List[Dict[str, Any]]
    language_performance: List[Dict[str, Any]]
    improvement_recommendations: List[Dict[str, Any]]
