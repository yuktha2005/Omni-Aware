import os
import re
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class ContentGeneratorService:
    def __init__(self):
        self.ai_provider = os.getenv("AI_PROVIDER", "local").lower()
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")

    def generate_content(
        self,
        campaign_title: str,
        purpose: str,
        target_audience: str,
        key_information: str,
        desired_language: str = "English",
        desired_tone: str = "Informative",
        communication_channel: str = "All",
        optional_instructions: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate structured public awareness content.
        Uses external LLM (Gemini) if configured, otherwise uses intelligent local NLP synthesis.
        """
        # Try Gemini if API key is provided
        if self.gemini_api_key and self.ai_provider in ["gemini", "auto", "external"]:
            try:
                gemini_result = self._generate_with_gemini(
                    campaign_title=campaign_title,
                    purpose=purpose,
                    target_audience=target_audience,
                    key_information=key_information,
                    desired_language=desired_language,
                    desired_tone=desired_tone,
                    communication_channel=communication_channel,
                    optional_instructions=optional_instructions
                )
                if gemini_result:
                    return gemini_result
            except Exception as e:
                logger.warning(f"Gemini generation fallback to local engine: {e}")

        # Default: Local Intelligent Open-Source NLP Content Generator
        return self._generate_with_local_nlp(
            campaign_title=campaign_title,
            purpose=purpose,
            target_audience=target_audience,
            key_information=key_information,
            desired_language=desired_language,
            desired_tone=desired_tone,
            communication_channel=communication_channel,
            optional_instructions=optional_instructions
        )

    def _generate_with_local_nlp(
        self,
        campaign_title: str,
        purpose: str,
        target_audience: str,
        key_information: str,
        desired_language: str,
        desired_tone: str,
        communication_channel: str,
        optional_instructions: Optional[str]
    ) -> Dict[str, Any]:
        clean_title = campaign_title.strip()
        clean_purpose = purpose.strip()
        clean_audience = target_audience.strip() if target_audience else "Citizens"
        clean_info = key_information.strip()
        tone_lower = desired_tone.strip().lower()
        purpose_lower = clean_purpose.lower()

        # Tone-specific opening hooks
        if "urgent" in tone_lower or "emergency" in purpose_lower:
            salutation = f"URGENT NOTICE FOR ALL {clean_audience.upper()}"
            intro = f"Please take immediate note of this critical update regarding {clean_title}."
            urgency_flag = "⚠️ IMMEDIATE ACTION REQUIRED:"
        elif "reassuring" in tone_lower or "health" in purpose_lower:
            salutation = f"Dear {clean_audience},"
            intro = f"We are committed to your well-being and are pleased to share important health guidance on {clean_title}."
            urgency_flag = "💡 Key Health Guidance:"
        elif "friendly" in tone_lower or "education" in purpose_lower:
            salutation = f"Hello {clean_audience},"
            intro = f"We are excited to invite you to participate in our upcoming {clean_title} initiative!"
            urgency_flag = "✨ Important Highlights:"
        elif "formal" in tone_lower:
            salutation = f"Official Communication for {clean_audience}:"
            intro = f"This notice is issued to formally advise on the protocols and information for {clean_title}."
            urgency_flag = "📋 Directives and Information:"
        else:  # Informative / default
            salutation = f"Public Announcement to {clean_audience}:"
            intro = f"Please review the key information regarding our community initiative: {clean_title}."
            urgency_flag = "📌 Key Information:"

        # Format key information sentences into structured bullet points or cohesive paragraphs
        sentences = [s.strip() for s in re.split(r'[.\n•]+', clean_info) if s.strip()]
        if len(sentences) > 1:
            formatted_points = "\n".join([f"• {s}" for s in sentences])
        else:
            formatted_points = f"• {clean_info}"

        # Generate Call to Action based on purpose
        if "health" in purpose_lower or "vaccin" in purpose_lower or "checkup" in purpose_lower:
            cta = "Register for your health screening session today. Stay healthy, stay safe!"
        elif "emergency" in purpose_lower or "disaster" in purpose_lower:
            cta = "Follow official safety advisories and contact emergency helplines immediately if assistance is needed."
        elif "clean" in purpose_lower or "environment" in purpose_lower or "swachh" in purpose_lower:
            cta = "Join the cleanliness drive and do your part to keep our campus and surroundings pristine!"
        elif "education" in purpose_lower or "workshop" in purpose_lower or "student" in clean_audience.lower():
            cta = "Sign up through the student portal to confirm your participation before seats fill up."
        else:
            cta = f"For more details and registration, please visit the official portal or contact the coordinator."

        # Channel-tailored composition
        subject = f"{'🚨 ' if 'urgent' in tone_lower else '📢 '}{clean_title} - {clean_purpose}"

        body_parts = [
            salutation,
            "",
            intro,
            "",
            f"Purpose: {clean_purpose}",
            f"{urgency_flag}",
            formatted_points,
            "",
            f"Action Required: {cta}",
            "",
            "Issued in public interest for mass community awareness."
        ]
        message_body = "\n".join(body_parts)

        # Generate short concise version for SMS/WhatsApp/Push notification
        short_version = f"{'🚨 ALERT: ' if 'urgent' in tone_lower else '📢 '}{clean_title}: {sentences[0] if sentences else clean_info[:80]}. {cta}"
        if len(short_version) > 280:
            short_version = short_version[:277] + "..."

        return {
            "message_title": subject,
            "message_body": message_body,
            "short_version": short_version,
            "call_to_action": cta,
            "desired_language": desired_language,
            "desired_tone": desired_tone,
            "communication_channel": communication_channel,
            "provider": "Open-Source Local NLP Generator"
        }

    def _generate_with_gemini(
        self,
        campaign_title: str,
        purpose: str,
        target_audience: str,
        key_information: str,
        desired_language: str,
        desired_tone: str,
        communication_channel: str,
        optional_instructions: Optional[str]
    ) -> Optional[Dict[str, Any]]:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.gemini_api_key)
            prompt = f"""
            You are an expert public awareness communication engine.
            Generate high-impact public awareness content for:
            - Campaign Title: {campaign_title}
            - Purpose: {purpose}
            - Target Audience: {target_audience}
            - Key Information: {key_information}
            - Desired Tone: {desired_tone}
            - Communication Channel: {communication_channel}
            - Additional Instructions: {optional_instructions or 'None'}

            Output ONLY a valid JSON object matching this schema:
            {{
                "message_title": "Subject line or title",
                "message_body": "Detailed, well-structured announcement body",
                "short_version": "Under 250 characters for SMS/Push notifications",
                "call_to_action": "Clear, actionable next step for the audience"
            }}
            """
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            data = json.loads(response.text)
            return {
                "message_title": data.get("message_title", campaign_title),
                "message_body": data.get("message_body", key_information),
                "short_version": data.get("short_version", key_information[:150]),
                "call_to_action": data.get("call_to_action", "Participate now."),
                "desired_language": desired_language,
                "desired_tone": desired_tone,
                "communication_channel": communication_channel,
                "provider": "Google Gemini 2.5 Flash"
            }
        except Exception as err:
            logger.error(f"Gemini API invocation failed: {err}")
            return None


content_generator_service = ContentGeneratorService()
