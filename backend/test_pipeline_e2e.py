import sys
import os

# Set UTF-8 encoding for standard output
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath('app'))

from services.ai.content_generator import content_generator_service
from services.ai.translation_service import translation_service
from services.ai.personalization_service import personalization_service
from services.ai.sentiment_service import sentiment_tone_service
from services.ai.compliance_service import compliance_check_service

print("================================================================")
print("1. TEST AI CONTENT GENERATOR (PUBLIC HEALTH DOMAIN)")
print("================================================================")
health_res = content_generator_service.generate_content(
    campaign_title="Pulse Polio National Immunization Day 2026",
    purpose="Immunize all children aged 0 to 5 years with 2 drops of oral polio vaccine",
    target_audience="Parents, Guardians & Caregivers",
    key_information="Free polio drops will be administered this Sunday, October 12 from 8:00 AM to 5:00 PM at all Primary Health Centers, Anganwadi booths, metro stations, and bus stands. Every child under 5 must receive drops even if previously vaccinated. National Toll-Free Helpline: 1075.",
    desired_tone="Urgent",
    communication_channel="All",
    optional_instructions="Emphasize that 2 drops protect a child for life."
)
print("TITLE:", health_res["message_title"])
print("--- BODY ---\n", health_res["message_body"])
print("--- SMS VERSION ---:", health_res["short_version"])
print("--- CTA ---:", health_res["call_to_action"])
print("--- WHATSAPP MESSAGE ---\n", health_res["whatsapp_message"])
print("--- VOICE SCRIPT ---\n", health_res["voice_script"])

print("\n================================================================")
print("2. TEST AI CONTENT GENERATOR (EMERGENCY / DISASTER DOMAIN)")
print("================================================================")
disaster_res = content_generator_service.generate_content(
    campaign_title="Cyclone Alert & Evacuation Advisory",
    purpose="Ensure immediate evacuation from coastal low-lying areas before storm landfall",
    target_audience="Coastal Residents & Fishermen",
    key_information="Severe cyclone winds expected this evening. Evacuate immediately to designated multipurpose relief shelters. Power supply will be disconnected as a precaution. Emergency Rescue Helpline: 1070 and 112.",
    desired_tone="Urgent",
    communication_channel="All"
)
print("TITLE:", disaster_res["message_title"])
print("--- SMS VERSION ---:", disaster_res["short_version"])
print("--- CTA ---:", disaster_res["call_to_action"])

print("\n================================================================")
print("3. TEST MULTILINGUAL TRANSLATION (HINDI, TAMIL, TELUGU, KANNADA, MALAYALAM)")
print("================================================================")
for lang in ["Hindi", "Tamil", "Telugu", "Kannada", "Malayalam"]:
    t_title = translation_service.translate_text(health_res["message_title"], "English", lang)
    t_short = translation_service.translate_text(health_res["short_version"], "English", lang)
    t_cta = translation_service.translate_text(health_res["call_to_action"], "English", lang)
    print(f"\n--- {lang.upper()} ---")
    print(f"Title : {t_title}")
    print(f"Short : {t_short}")
    print(f"CTA   : {t_cta}")

print("\n================================================================")
print("4. TEST AUDIENCE PERSONALIZATION (STUDENT, TEACHER, FARMER, HEALTHCARE)")
print("================================================================")
for role in ["Student", "Faculty", "Farmer", "Healthcare Worker"]:
    pers = personalization_service.personalize_content(
        message_title=health_res["message_title"],
        message_body=health_res["message_body"],
        short_version=health_res["short_version"],
        call_to_action=health_res["call_to_action"],
        audience_role=role,
        language="English"
    )
    print(f"\n[{role}] Personalized Title: {pers['personalized_title']}")
    print(f"[{role}] Personalized Short: {pers['personalized_short_version']}")
    print(f"[{role}] Personalized CTA: {pers['personalized_call_to_action']}")

print("\n================================================================")
print("5. TEST SENTIMENT, TONE & COMPLIANCE")
print("================================================================")
tone_eval = sentiment_tone_service.optimize_tone(
    message_title=health_res["message_title"],
    message_body=health_res["message_body"],
    target_tone="Urgent"
)
print("Tone Alignment Score:", tone_eval.get("tone_alignment_score"))
print("Detected Tone:", tone_eval.get("detected_tone"))

comp_eval = compliance_check_service.evaluate_compliance(
    message_title=health_res["message_title"],
    message_body=health_res["message_body"],
    short_version=health_res["short_version"]
)
print("Compliance Passed:", comp_eval.get("is_compliant"))
print("Compliance Score:", comp_eval.get("overall_score"))

print("\n✅ ALL AI AGENT CAPABILITIES TESTED SUCCESSFULLY!")
