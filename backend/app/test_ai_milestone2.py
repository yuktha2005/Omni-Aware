import pytest
from fastapi.testclient import TestClient

from main import app
from database.connection import SessionLocal
from models.campaign import Campaign, CampaignContent
from services.ai.content_generator import content_generator_service
from services.ai.translation_service import translation_service
from services.ai.personalization_service import personalization_service
from services.ai.sentiment_service import sentiment_tone_service
from services.ai.quality_service import quality_check_service
from services.ai.compliance_service import compliance_check_service
from services.ai.pipeline_service import content_pipeline_service

client = TestClient(app)


# =====================================================================
# 1. AI CONTENT GENERATION TESTS
# =====================================================================
def test_ai_content_generation_valid():
    result = content_generator_service.generate_content(
        campaign_title="Campus Cleanliness Drive",
        purpose="Environmental Health",
        target_audience="Students",
        key_information="Join the clean campus rally on Friday at 9 AM outside the main auditorium.",
        desired_language="English",
        desired_tone="Inspiring",
        communication_channel="WhatsApp"
    )

    assert result is not None
    assert "message_title" in result and len(result["message_title"]) > 0
    assert "message_body" in result and "Campus Cleanliness Drive" in result["message_body"]
    assert "short_version" in result and len(result["short_version"]) > 0
    assert "call_to_action" in result and len(result["call_to_action"]) > 0
    assert result["desired_tone"] == "Inspiring"


def test_ai_content_generation_urgent_tone():
    result = content_generator_service.generate_content(
        campaign_title="Severe Weather Alert",
        purpose="Emergency Safety",
        target_audience="Citizens",
        key_information="Heavy rainfall and flash floods predicted. Stay indoors and avoid low-lying bridges.",
        desired_language="English",
        desired_tone="Urgent",
        communication_channel="SMS"
    )

    assert "URGENT" in result["message_title"] or "ALERT" in result["message_title"] or "🚨" in result["message_title"]
    assert "IMMEDIATE ACTION REQUIRED" in result["message_body"] or "URGENT" in result["message_body"]


# =====================================================================
# 2. MULTILINGUAL TRANSLATION TESTS
# =====================================================================
def test_translation_service_all_six_languages():
    text_title = "Keep your surroundings clean."
    text_body = "Public hygiene and clean water protect our community from vector-borne diseases."
    
    target_langs = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam"]
    results = translation_service.translate_campaign_content(
        message_title=text_title,
        message_body=text_body,
        short_version="Clean surroundings protect health.",
        call_to_action="Participate today.",
        source_language="English",
        target_languages=target_langs
    )

    for lang in target_langs:
        assert lang in results, f"Missing translation for {lang}"
        item = results[lang]
        assert item["language"] == lang
        assert len(item["message_title"]) > 0
        assert len(item["message_body"]) > 0
        assert item["language_code"] in ["en", "hi", "ta", "te", "kn", "ml"]


def test_translation_individual_language():
    translated = translation_service.translate_text("Health Awareness", "en", "ta")
    assert translated is not None
    assert len(translated) > 0


# =====================================================================
# 3. AUDIENCE PERSONALIZATION TESTS
# =====================================================================
def test_audience_personalization_student():
    result = personalization_service.personalize_content(
        message_title="Annual Health Checkup",
        message_body="Dear Community,\nAnnual health checkup is scheduled this Monday.\nAction Required: Register now.",
        short_version="Annual health checkup this Monday. Register now.",
        call_to_action="Register now.",
        audience_role="Student",
        organization_context="National Engineering College",
        department_context="Computer Science"
    )

    assert result["audience_role"] == "Student"
    assert "Student" in result["personalized_title"]
    assert "National Engineering College" in result["personalized_body"]
    assert "student portal" in result["personalized_body"].lower() or "class representative" in result["personalized_body"].lower()
    assert result["personalized_short_version"].startswith("Students: ")


def test_audience_personalization_teacher():
    result = personalization_service.personalize_content(
        message_title="Annual Health Checkup",
        message_body="Dear Community,\nAnnual health checkup is scheduled this Monday.\nAction Required: Register now.",
        short_version="Annual health checkup this Monday. Register now.",
        call_to_action="Register now.",
        audience_role="Teacher"
    )

    assert result["audience_role"] == "Teacher"
    assert "Faculty" in result["personalized_body"] or "Teacher" in result["personalized_body"]


def test_audience_personalization_healthcare():
    result = personalization_service.personalize_content(
        message_title="Public Health Awareness",
        message_body="Dear Community,\nCommunity health drive is starting.\nAction Required: Participate today.",
        short_version="Community health drive starting.",
        call_to_action="Participate today.",
        audience_role="Doctor"
    )

    assert result["audience_role"] == "Doctor"
    assert "Healthcare" in result["personalized_body"] or "clinical" in result["personalized_body"].lower()
    assert result["personalized_short_version"].startswith("Healthcare Staff: ")


def test_audience_personalization_corporate_employee():
    result = personalization_service.personalize_content(
        message_title="Ergonomics and Wellness Workshop",
        message_body="Notice:\nWorkplace wellness session on Friday at 3 PM.\nAction Required: Sign up.",
        short_version="Wellness session on Friday.",
        call_to_action="Sign up.",
        audience_role="Employee",
        organization_context="TechCorp Systems",
        department_context="Engineering"
    )

    assert result["audience_role"] == "Employee"
    assert "TechCorp Systems" in result["personalized_body"]
    assert "Employee" in result["personalized_short_version"] or "Employees:" in result["personalized_short_version"]


def test_audience_personalization_general_public():
    result = personalization_service.personalize_content(
        message_title="Monsoon Safety Advisory",
        message_body="Dear Citizens,\nPlease take precautions during heavy rains.\nAction Required: Stay safe.",
        short_version="Take precautions during rains.",
        call_to_action="Stay safe.",
        audience_role="General Public",
        location_context="District Central"
    )

    assert result["audience_role"] == "General public" or result["audience_role"] == "General Public"
    assert "District Central" in result["personalized_title"] or "District Central" in result["personalized_body"]


# =====================================================================
# 4. SENTIMENT AND TONE OPTIMIZATION TESTS
# =====================================================================
def test_sentiment_analysis():
    positive_res = sentiment_tone_service.analyze_sentiment("We are delighted to invite you to celebrate healthy living!")
    assert positive_res["sentiment"] == "positive"
    assert positive_res["score"] > 0.0

    neutral_res = sentiment_tone_service.analyze_sentiment("The scheduled session begins at 10:00 AM on Room 204.")
    assert neutral_res["sentiment"] == "neutral"

    negative_res = sentiment_tone_service.analyze_sentiment("Dangerous severe flood warning! Fatal hazard and disaster area.")
    assert negative_res["sentiment"] == "negative"
    assert negative_res["score"] < 0.0


def test_tone_classification_all_tones():
    urgent_tone = sentiment_tone_service.detect_tone("CRITICAL EMERGENCY ALERT: Immediate evacuation required due to danger!")
    assert urgent_tone["detected_tone"] == "Urgent"

    reassuring_tone = sentiment_tone_service.detect_tone("We are committed to your wellness, care, safety, and healthy support.")
    assert reassuring_tone["detected_tone"] == "Reassuring"

    friendly_tone = sentiment_tone_service.detect_tone("Hello friends! We are so excited to welcome and celebrate together!")
    assert friendly_tone["detected_tone"] == "Friendly"

    formal_tone = sentiment_tone_service.detect_tone("Hereby officially issued pursuant to statutory compliance protocols and directives.")
    assert formal_tone["detected_tone"] == "Formal"


def test_tone_optimization_for_health():
    opt_res = sentiment_tone_service.optimize_tone(
        message_title="Public Health Awareness",
        message_body="Notice: Blood donation camp on Friday.",
        campaign_purpose="Health Awareness",
        target_tone="Reassuring"
    )

    assert opt_res["detected_tone"] is not None
    assert opt_res["target_tone"] == "Reassuring"
    assert len(opt_res["suggestions"]) > 0


# =====================================================================
# 5. AI QUALITY CHECK TESTS
# =====================================================================
def test_quality_check_complete_message():
    eval_res = quality_check_service.evaluate_quality(
        message_title="College Health Awareness Program",
        message_body="We invite all students and staff to participate in the preventive wellness camp on Friday at the auditorium. Health screenings and doctor consultations are provided.",
        short_version="Wellness camp on Friday at the auditorium.",
        call_to_action="Register on the student portal.",
        language="English"
    )

    assert eval_res["quality_score"] >= 80.0
    assert eval_res["grade"] in ["Excellent", "Good"]
    assert eval_res["readability_score"] > 0
    assert eval_res["completeness_score"] >= 80.0


def test_quality_check_incomplete_message():
    eval_res = quality_check_service.evaluate_quality(
        message_title="",
        message_body="Short.",
        short_version="",
        call_to_action=""
    )

    assert eval_res["quality_score"] < 70.0
    assert any(issue["category"] == "completeness" for issue in eval_res["issues"])


# =====================================================================
# 6. COMPLIANCE AND SAFETY CHECK TESTS
# =====================================================================
def test_compliance_safe_content():
    comp_res = compliance_check_service.evaluate_compliance(
        message_title="Public Health Awareness Program",
        message_body="Please maintain clean surroundings and dispose of standing water to prevent mosquito breeding. Contact the municipal health desk for assistance.",
        short_version="Clean surroundings prevent vector-borne illness.",
        call_to_action="Contact municipal health desk."
    )

    assert comp_res["passed"] is True
    assert comp_res["compliance_score"] >= 80.0
    assert comp_res["factual_verification_status"] == "passed"
    assert len(comp_res["pii_detected"]) == 0


def test_compliance_pii_and_misleading_flag():
    comp_res = compliance_check_service.evaluate_compliance(
        message_title="Miracle Cure Alert",
        message_body="Get 100% cure guaranteed for all ailments! Contact secret healer at 9876543210 or user@personalmail.com.",
        short_version="100% cure guaranteed.",
        call_to_action="Call 9876543210."
    )

    assert comp_res["passed"] is False or len(comp_res["issues"]) > 0
    assert comp_res["factual_verification_status"] == "warning"
    assert len(comp_res["pii_detected"]) > 0
    assert any(i["category"] == "misleading_claims" for i in comp_res["issues"])


def test_compliance_aadhaar_and_card_detection():
    comp_res = compliance_check_service.evaluate_compliance(
        message_title="Identity Verification Notice",
        message_body="Submit your Aadhaar number 5432 1098 7654 or pay fee via card 4532-1234-5678-9012 to complete registration.",
        short_version="Submit identity details.",
        call_to_action="Pay registration fee."
    )

    assert comp_res["passed"] is False or len(comp_res["issues"]) > 0
    assert any("aadhaar_number" in p for p in comp_res["pii_detected"])
    assert any("credit_card" in p for p in comp_res["pii_detected"])


# =====================================================================
# 7. FULL END-TO-END PIPELINE & DATABASE PERSISTENCE
# =====================================================================
def test_full_pipeline_execution():
    db = SessionLocal()
    try:
        pipeline_output = content_pipeline_service.run_pipeline(
            campaign_title="Community Health Screening",
            purpose="Public Health Awareness",
            target_audience="Students",
            key_information="Comprehensive health checkup camp on Saturday from 9 AM to 4 PM in campus health center.",
            desired_language="English",
            desired_tone="Informative",
            communication_channel="WhatsApp",
            target_languages=["English", "Hindi", "Tamil"],
            audience_roles=["Student", "Teacher"],
            db=db,
            save_to_db=True
        )

        assert pipeline_output["campaign_id"] is not None
        assert pipeline_output["ready_for_distribution"] is True
        assert len(pipeline_output["processed_contents"]) == 6  # 2 roles * 3 languages = 6 items

        # Verify database record
        campaign = db.query(Campaign).filter(Campaign.id == pipeline_output["campaign_id"]).first()
        assert campaign is not None
        assert campaign.title == "Community Health Screening"
        assert len(campaign.contents) == 6
    finally:
        db.close()


# =====================================================================
# 8. API ENDPOINT INTEGRATION TESTS
# =====================================================================
def test_api_generate():
    response = client.post("/ai/generate", json={
        "campaign_title": "Fire Safety Drill",
        "purpose": "Emergency Preparedness",
        "target_audience": "Employees",
        "key_information": "Evacuation drill scheduled for Wednesday at 3 PM. Follow staircase protocols.",
        "desired_language": "English",
        "desired_tone": "Urgent",
        "communication_channel": "Email"
    })
    assert response.status_code == 200
    data = response.json()
    assert "message_title" in data
    assert "message_body" in data
    assert "short_version" in data


def test_api_translate():
    response = client.post("/ai/translate", json={
        "message_title": "Clean Campus Initiative",
        "message_body": "Keep your surroundings clean.",
        "short_version": "Clean surroundings.",
        "call_to_action": "Participate now.",
        "source_language": "English",
        "target_languages": ["Hindi", "Tamil", "Telugu", "Kannada", "Malayalam"]
    })
    assert response.status_code == 200
    data = response.json()
    assert "translations" in data
    assert "Tamil" in data["translations"]
    assert "Hindi" in data["translations"]


def test_api_personalize():
    response = client.post("/ai/personalize", json={
        "message_title": "General Health Advisory",
        "message_body": "Health checkup is available.",
        "short_version": "Health checkup available.",
        "call_to_action": "Register now.",
        "audience_role": "Student"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["audience_role"] == "Student"
    assert "Student" in data["personalized_title"]


def test_api_analyze_tone():
    response = client.post("/ai/analyze-tone", json={
        "message_title": "Important Flood Advisory",
        "message_body": "Urgent alert: Avoid waterlogged lowlands immediately and move to higher grounds.",
        "campaign_purpose": "Disaster Relief",
        "target_tone": "Urgent"
    })
    assert response.status_code == 200
    data = response.json()
    assert "sentiment" in data
    assert "detected_tone" in data


def test_api_quality_check():
    response = client.post("/ai/quality-check", json={
        "message_title": "Public Health Drive",
        "message_body": "Free dental and vision checkup this Saturday at Community Hall from 10 AM.",
        "short_version": "Free checkup this Saturday.",
        "call_to_action": "Visit community hall.",
        "language": "English"
    })
    assert response.status_code == 200
    data = response.json()
    assert "quality_score" in data
    assert data["quality_score"] > 0


def test_api_compliance_check():
    response = client.post("/ai/compliance-check", json={
        "message_title": "General Health Drive",
        "message_body": "Free dental checkup camp organized in accordance with public safety protocols.",
        "short_version": "Checkup camp.",
        "call_to_action": "Join us."
    })
    assert response.status_code == 200
    data = response.json()
    assert "passed" in data
    assert "factual_verification_status" in data


def test_api_process_pipeline():
    response = client.post("/ai/process", json={
        "campaign_title": "College Health Awareness Program",
        "purpose": "Health Awareness",
        "target_audience": "Students",
        "key_information": "Free general health screening, eye checkup, and nutrition counseling on Friday at the campus clinic.",
        "desired_language": "English",
        "desired_tone": "Informative",
        "communication_channel": "All",
        "target_languages": ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam"],
        "audience_roles": ["Student", "Teacher", "General Public"],
        "save_to_db": True
    })
    assert response.status_code == 200
    data = response.json()
    assert data["campaign_title"] == "College Health Awareness Program"
    assert data["total_generated"] == 18  # 3 roles * 6 languages = 18 items
    assert data["ready_for_distribution"] is True
    assert data["campaign_id"] is not None


def test_api_get_campaigns_and_details():
    # List campaigns
    list_resp = client.get("/ai/campaigns")
    assert list_resp.status_code == 200
    campaigns = list_resp.json()
    assert len(campaigns) > 0

    first_id = campaigns[0]["id"]
    detail_resp = client.get(f"/ai/campaigns/{first_id}")
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json()
    assert detail_data["id"] == first_id
    assert len(detail_data["contents"]) > 0


def test_api_validation_errors():
    # Missing required fields
    resp = client.post("/ai/generate", json={
        "campaign_title": "",
        "purpose": "",
        "key_information": ""
    })
    assert resp.status_code == 400

    resp_trans = client.post("/ai/translate", json={
        "message_title": "",
        "message_body": "",
        "target_languages": []
    })
    assert resp_trans.status_code == 400


# =====================================================================
# 9. BONUS FEATURES TESTS (VOICE, QR, POSTER, HELPLINE FAQ)
# =====================================================================
def test_api_voice_broadcast():
    resp = client.post("/ai/generate-voice", json={
        "text": "Welcome to the college health awareness camp this Friday.",
        "language": "English",
        "slow": False
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["format"] == "audio/mp3"
    assert len(data["audio_base64"]) > 0
    assert data["duration_seconds"] > 0


def test_api_generate_qr():
    resp = client.post("/ai/generate-qr", json={
        "campaign_id": 1,
        "campaign_title": "College Health Awareness Program",
        "portal_url": "https://campushealth.edu/register"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["image_format"] == "image/png"
    assert len(data["qr_base64"]) > 0
    assert data["qr_data_uri"].startswith("data:image/png;base64,")


def test_api_generate_poster():
    resp = client.post("/ai/generate-poster", json={
        "campaign_title": "College Health Awareness Program",
        "purpose": "Health Awareness",
        "message_body": "Free health screening camp on Friday at the auditorium. Doctors available.",
        "call_to_action": "Register on student portal today.",
        "language": "Tamil",
        "audience_role": "Student",
        "campaign_id": 1
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["format"] == "image/svg+xml"
    assert "<svg" in data["svg_content"]
    assert len(data["qr_data_uri"]) > 0


def test_api_ask_helpline():
    resp = client.post("/ai/ask-helpline", json={
        "user_question": "What are the camp timings and is it free?",
        "campaign_title": "College Health Awareness Program",
        "campaign_purpose": "Health Awareness",
        "key_information": "Free general health screening on Friday from 9 AM to 4 PM at campus clinic.",
        "call_to_action": "Register on student portal.",
        "language": "English"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["answer"]) > 0
    assert "College Health Awareness Program" in data["answer"] or "Free" in data["answer"] or "Friday" in data["answer"]

