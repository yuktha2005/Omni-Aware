from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ---------------------------------------------------------
# Content Generation Schemas
# ---------------------------------------------------------
class ContentGenerationRequest(BaseModel):
    campaign_title: str = Field(..., description="Title of the campaign")
    purpose: str = Field(..., description="Purpose/Goal (e.g. Health Awareness, Emergency Alert, Education)")
    target_audience: str = Field("General Public", description="Target Audience (e.g. Students, Teachers, Healthcare Workers)")
    key_information: str = Field(..., description="Key information or instructions to communicate")
    desired_language: str = Field("English", description="Primary language for generated message")
    desired_tone: str = Field("Informative", description="Tone (e.g. Urgent, Informative, Reassuring, Friendly)")
    communication_channel: str = Field("All", description="Channel (e.g. SMS, Email, WhatsApp, Public Notice)")
    optional_instructions: Optional[str] = Field(None, description="Custom guidelines or constraints")


class ContentGenerationResponse(BaseModel):
    message_title: str
    message_body: str
    short_version: str
    call_to_action: Optional[str] = None
    desired_language: str
    desired_tone: str
    communication_channel: str
    provider: str


# ---------------------------------------------------------
# Multilingual Translation Schemas
# ---------------------------------------------------------
class TranslationRequest(BaseModel):
    message_title: str
    message_body: str
    short_version: Optional[str] = None
    call_to_action: Optional[str] = None
    source_language: str = "English"
    target_languages: List[str] = Field(..., description="List of target languages (e.g. ['Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'])")


class SingleLanguageTranslation(BaseModel):
    language: str
    language_code: str
    message_title: str
    message_body: str
    short_version: Optional[str] = None
    call_to_action: Optional[str] = None
    provider: str


class TranslationResponse(BaseModel):
    source_language: str
    translations: Dict[str, SingleLanguageTranslation]


# ---------------------------------------------------------
# Audience Personalization Schemas
# ---------------------------------------------------------
class PersonalizationRequest(BaseModel):
    message_title: str
    message_body: str
    short_version: Optional[str] = None
    call_to_action: Optional[str] = None
    audience_role: str = Field(..., description="Role/Persona (e.g. Student, Teacher, Employee, Doctor, General Public)")
    language: str = "English"
    location_context: Optional[str] = None
    organization_context: Optional[str] = None
    department_context: Optional[str] = None


class PersonalizationResponse(BaseModel):
    audience_role: str
    original_title: str
    personalized_title: str
    original_body: str
    personalized_body: str
    personalized_short_version: str
    personalized_call_to_action: Optional[str] = None
    personalization_applied: List[str]


# ---------------------------------------------------------
# Sentiment & Tone Schemas
# ---------------------------------------------------------
class ToneAnalysisRequest(BaseModel):
    message_title: str
    message_body: str
    campaign_purpose: Optional[str] = None
    target_tone: Optional[str] = None
    optimize_tone: bool = False


class ToneAnalysisResponse(BaseModel):
    sentiment: str  # positive, neutral, negative
    sentiment_score: float  # compound polarity (-1.0 to 1.0)
    detected_tone: str  # urgent, informative, reassuring, friendly, formal, cautionary
    tone_confidence: float
    tone_alignment_score: float  # 0 to 100
    is_tone_optimal: bool
    optimized_body: Optional[str] = None
    suggestions: List[str]


# ---------------------------------------------------------
# Quality Check Schemas
# ---------------------------------------------------------
class QualityIssue(BaseModel):
    category: str  # grammar, clarity, readability, completeness, tone
    severity: str  # low, medium, high
    message: str
    suggestion: Optional[str] = None


class QualityCheckRequest(BaseModel):
    message_title: str
    message_body: str
    short_version: Optional[str] = None
    call_to_action: Optional[str] = None
    language: str = "English"
    target_tone: Optional[str] = None


class QualityCheckResponse(BaseModel):
    quality_score: float  # 0 to 100
    grade: str  # Excellent, Good, Fair, Needs Improvement
    readability_score: float
    reading_ease: str
    completeness_score: float
    issues: List[QualityIssue]
    suggestions: List[str]
    improved_version: Optional[str] = None


# ---------------------------------------------------------
# Compliance & Safety Check Schemas
# ---------------------------------------------------------
class ComplianceIssue(BaseModel):
    category: str  # pii, offensive_language, misleading_claims, sensitive_content, safety
    severity: str  # critical, high, medium, low
    description: str
    matched_term: Optional[str] = None


class ComplianceCheckRequest(BaseModel):
    message_title: str
    message_body: str
    short_version: Optional[str] = None
    call_to_action: Optional[str] = None
    factual_claims_present: bool = True


class ComplianceCheckResponse(BaseModel):
    passed: bool
    compliance_score: float  # 0 to 100
    factual_verification_status: str  # passed, warning, unable_to_verify
    issues: List[ComplianceIssue]
    pii_detected: List[str]
    suggestions: List[str]


# ---------------------------------------------------------
# Full End-to-End Pipeline Schemas
# ---------------------------------------------------------
class PipelineProcessRequest(BaseModel):
    campaign_title: str
    purpose: str
    target_audience: str = "General Public"
    key_information: str
    desired_language: str = "English"
    desired_tone: str = "Informative"
    communication_channel: str = "All"
    optional_instructions: Optional[str] = None
    target_languages: List[str] = Field(
        default=["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam"],
        description="Target languages for translation"
    )
    audience_roles: List[str] = Field(
        default=["Student", "Teacher", "Employee", "General Public"],
        description="Audience personas for personalization"
    )
    save_to_db: bool = True


class ProcessedContentItem(BaseModel):
    language: str
    language_code: str
    audience_role: str
    message_title: str
    message_body: str
    short_version: str
    call_to_action: Optional[str] = None
    sentiment: str
    sentiment_score: float
    detected_tone: str
    quality_score: float
    compliance_passed: bool
    compliance_score: float
    factual_verification_status: str
    status: str
    db_id: Optional[int] = None


class PipelineProcessResponse(BaseModel):
    campaign_id: Optional[int] = None
    campaign_title: str
    purpose: str
    target_audience: str
    base_content: ContentGenerationResponse
    processed_contents: List[ProcessedContentItem]
    total_generated: int
    languages_covered: List[str]
    ready_for_distribution: bool
    summary: Dict[str, Any]


# ---------------------------------------------------------
# Campaign CRUD Schemas
# ---------------------------------------------------------
class CampaignCreate(BaseModel):
    title: str
    purpose: str
    target_audience: Optional[str] = "General Public"
    key_information: str
    desired_language: Optional[str] = "English"
    desired_tone: Optional[str] = "Informative"
    communication_channel: Optional[str] = "All"
    optional_instructions: Optional[str] = None


class CampaignResponse(BaseModel):
    id: int
    title: str
    purpose: str
    target_audience: Optional[str]
    key_information: str
    desired_language: str
    desired_tone: str
    communication_channel: str
    status: str
    created_at: Optional[str]
    content_count: Optional[int] = 0


class CampaignDetailResponse(CampaignResponse):
    contents: List[ProcessedContentItem] = []


# ---------------------------------------------------------
# Bonus Feature Schemas (Voice, QR, Poster, Helpline)
# ---------------------------------------------------------
class VoiceBroadcastRequest(BaseModel):
    text: str = Field(..., description="Text to synthesize into voice audio")
    language: str = Field("English", description="Language (English, Hindi, Tamil, Telugu, Kannada, Malayalam)")
    slow: bool = False


class VoiceBroadcastResponse(BaseModel):
    language: str
    language_code: str
    format: str
    duration_seconds: float
    audio_base64: str
    audio_data_uri: str
    character_count: int


class QRCodeRequest(BaseModel):
    campaign_id: Optional[int] = None
    campaign_title: str = "Public Awareness"
    portal_url: Optional[str] = None
    info_payload: Optional[str] = None


class QRCodeResponse(BaseModel):
    campaign_id: Optional[int] = None
    campaign_title: str
    payload: str
    image_format: str
    qr_base64: str
    qr_data_uri: str


class PosterRequest(BaseModel):
    campaign_title: str
    purpose: str
    message_body: str
    call_to_action: str
    language: str = "English"
    audience_role: str = "General Public"
    campaign_id: Optional[int] = None


class PosterResponse(BaseModel):
    campaign_title: str
    language: str
    audience_role: str
    format: str
    svg_content: str
    qr_data_uri: str


class HelplineQueryRequest(BaseModel):
    user_question: str
    campaign_title: str
    campaign_purpose: str
    key_information: str
    call_to_action: Optional[str] = None
    language: str = "English"


class HelplineQueryResponse(BaseModel):
    user_question: str
    language: str
    campaign_title: str
    answer: str
    grounded_source: str
    factual_status: str
