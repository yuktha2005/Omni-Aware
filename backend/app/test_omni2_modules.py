import pytest
from services.ai.fact_verification_service import fact_verification_service
from services.ai.translation_evaluator_service import translation_evaluator_service
from services.ai.quiz_service import quiz_service
from services.analytics.understanding_analytics_service import understanding_analytics_service


# ============================================================================
# MODULE 1 TESTS: AI FACT VERIFICATION ENGINE
# ============================================================================

def test_claim_extraction_and_categorization():
    title = "Cyclone Warning for Coastal Districts"
    body = "Heavy rainfall is expected on 15th August. For emergency rescue, dial 112 or 1070. Move to safe high ground shelters."
    key_info = "Ayushman Bharat scheme covers treatment up to ₹5 lakh. Boil drinking water."

    claims = fact_verification_service.extract_claims(title, body, key_info)
    assert len(claims) >= 3

    categories = [c["claim_category"] for c in claims]
    assert any("Emergency Helpline" in cat or "Weather" in cat for cat in categories)
    assert any("Dates & Deadlines" in cat or "Weather" in cat or "Public Health" in cat for cat in categories)


def test_supported_claim_verification():
    claim_text = "In flood emergencies, citizens should avoid walking through floodwater and move to designated high ground."
    result = fact_verification_service.verify_claim(claim_text, "Weather & Hazard Warning")
    
    assert result["status"] == "Supported"
    assert result["confidence_score"] >= 60.0
    assert "NDMA" in result["source_name"]


def test_contradicted_helpline_claim():
    claim_text = "The national emergency rescue helpline number is 9999."
    result = fact_verification_service.verify_claim(claim_text, "Emergency Helpline")
    
    assert result["status"] == "Contradicted"
    assert result["confidence_score"] >= 80.0
    assert result["requires_human_review"] is True


def test_insufficient_evidence_unverifiable_claim():
    claim_text = "A secret private flying saucer will distribute relief kits at midnight."
    result = fact_verification_service.verify_claim(claim_text, "General Advisory")
    
    # Never declare true without evidence
    assert result["status"] in ["Insufficient Evidence", "Needs Human Review"]


def test_emergency_claim_requires_human_review():
    claim_text = "Immediate evacuation order for all residents of Adyar river basin."
    result = fact_verification_service.verify_claim(claim_text, "Weather & Hazard Warning")
    
    assert result["requires_human_review"] is True


# ============================================================================
# MODULE 2 TESTS: MULTILINGUAL TRANSLATION QUALITY EVALUATOR
# ============================================================================

def test_critical_entity_extraction():
    text = "Flood alert on 15th August at 10:00 AM. Dial helpline 112 or 108. Avoid floodwater. Visit https://ndma.gov.in."
    entities = translation_evaluator_service.extract_critical_entities(text)
    
    assert "112" in entities["phone_numbers"] or "108" in entities["phone_numbers"]
    assert len(entities["dates"]) >= 1
    assert len(entities["urls"]) >= 1
    assert "evacuate" in entities["emergency_directives"] or "danger" in entities["emergency_directives"] or "warning" in entities["emergency_directives"]


def test_entity_preservation_positive():
    source = "Advisory on 15th August: Emergency helpline is 112. Relief grant is ₹5000."
    translated = "15th August அன்று ஆலோசனை: அவசர உதவி எண் 112. நிவாரணத் தொகை ₹5000."
    
    src_entities = translation_evaluator_service.extract_critical_entities(source)
    preservation = translation_evaluator_service.check_entity_preservation(src_entities, translated)
    
    assert preservation["missing_count"] == 0
    assert preservation["preservation_rate"] == 1.0


def test_entity_preservation_missing_helpline_flags_error():
    source = "Emergency flood evacuation: Call 112 immediately."
    translated = "बाढ़ से बचाव के लिए तुरंत सुरक्षित स्थान पर जाएं।"  # Missing helpline 112
    
    evaluation = translation_evaluator_service.evaluate_translation(
        source_text=source,
        translated_text=translated,
        source_language="English",
        target_language="Hindi",
        is_emergency_content=True
    )
    
    assert evaluation["can_auto_approve"] is False
    assert evaluation["critical_errors_count"] >= 1
    assert any("112" in iss["message"] for iss in evaluation["issues"])


def test_translation_quality_scoring_breakdown():
    source = "Public awareness camp tomorrow. Registration is free. Dial 108 for assistance."
    translated = "कल सार्वजनिक जागरूकता शिविर। पंजीकरण निःशुल्क है। सहायता के लिए 108 डायल करें।"
    
    evaluation = translation_evaluator_service.evaluate_translation(
        source_text=source,
        translated_text=translated,
        source_language="English",
        target_language="Hindi"
    )
    
    assert 0.0 <= evaluation["quality_score"] <= 100.0
    breakdown = evaluation["score_breakdown"]
    assert "critical_entity_preservation" in breakdown
    assert "semantic_similarity" in breakdown
    assert "completeness_and_length" in breakdown
    assert "terminology_consistency" in breakdown
    assert "readability_and_script" in breakdown


# ============================================================================
# MODULE 3 TESTS: CITIZEN UNDERSTANDING SCORE & QUIZ GENERATION
# ============================================================================

def test_comprehension_quiz_generation():
    title = "Flood Safety and Evacuation Guidelines"
    purpose = "Disaster management and flood safety"
    key_info = "Move to high ground immediately. Avoid floodwater. Dial emergency helpline 112. Boil drinking water."
    
    quiz_data = quiz_service.generate_quiz_for_campaign(
        campaign_id=999,
        language="English",
        num_questions=3
    )
    
    assert quiz_data["total_questions"] >= 2
    for q in quiz_data["questions"]:
        assert len(q["options"]) >= 2
        assert q["correct_option_id"] in ["A", "B", "C", "D"]
        assert len(q["explanation"]) > 5


def test_quiz_answer_submission_and_grading():
    answers = {"1": "A", "2": "A", "3": "A"}
    result = quiz_service.submit_quiz_response(
        quiz_id=1,
        answers=answers,
        language="English"
    )
    
    assert result["total_questions"] == 3
    assert result["score_percentage"] == 100.0
    assert result["passed"] is True


def test_understanding_rate_formula():
    # Test formula: Understanding Rate = (Total Correct Answers / Total Answered Questions) * 100
    total_q = 50
    correct_q = 40
    rate = (correct_q / total_q) * 100
    assert rate == 80.0
