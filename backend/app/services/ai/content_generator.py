import os
import re
import json
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)


class ContentGeneratorService:
    """
    Intelligent Public Awareness & Mass Communication AI Agent.
    Generates high-impact, contextual, and channel-tailored public notices,
    health advisories, emergency alerts, and civic communications.
    """

    def __init__(self):
        self.ai_provider = os.getenv("AI_PROVIDER", "auto").lower()
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")

    def generate_content(
        self,
        campaign_title: str,
        purpose: str,
        target_audience: str = "General Public",
        key_information: str = "",
        desired_language: str = "English",
        desired_tone: str = "Informative",
        communication_channel: str = "All",
        optional_instructions: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate structured, multi-channel public awareness content.
        Uses Gemini LLM if configured, otherwise uses advanced local AI agentic synthesis.
        """
        clean_title = campaign_title.strip()
        clean_purpose = purpose.strip()
        clean_audience = target_audience.strip() if target_audience else "General Public"
        clean_info = key_information.strip()
        clean_tone = desired_tone.strip() if desired_tone else "Informative"
        clean_channel = communication_channel.strip() if communication_channel else "All"

        # Try Gemini if API key is provided
        if self.gemini_api_key and self.ai_provider in ["gemini", "auto", "external"]:
            try:
                gemini_result = self._generate_with_gemini(
                    campaign_title=clean_title,
                    purpose=clean_purpose,
                    target_audience=clean_audience,
                    key_information=clean_info,
                    desired_language=desired_language,
                    desired_tone=clean_tone,
                    communication_channel=clean_channel,
                    optional_instructions=optional_instructions
                )
                if gemini_result:
                    return gemini_result
            except Exception as e:
                logger.warning(f"Gemini generation fallback to local AI agent engine: {e}")

        # Default: Advanced Agentic Local NLP Content Generator
        return self._generate_with_local_nlp(
            campaign_title=clean_title,
            purpose=clean_purpose,
            target_audience=clean_audience,
            key_information=clean_info,
            desired_language=desired_language,
            desired_tone=clean_tone,
            communication_channel=clean_channel,
            optional_instructions=optional_instructions
        )

    def _classify_domain(self, title: str, purpose: str, key_info: str) -> str:
        """Classifies the awareness campaign into a civic domain."""
        combined = f"{title} {purpose} {key_info}".lower()
        if any(w in combined for w in ["polio", "vaccin", "health", "checkup", "medical", "disease", "clinic", "hospital", "doctor", "blood", "wellness", "dengue", "malaria", "covid", "nutrition", "sanitation"]):
            return "health"
        if any(w in combined for w in ["cyclone", "flood", "disaster", "earthquake", "storm", "fire", "emergency", "evacuat", "tsunami", "hazard", "warning", "rescue", "heatwave"]):
            return "emergency"
        if any(w in combined for w in ["student", "school", "college", "exam", "admission", "scholarship", "workshop", "university", "faculty", "education", "course", "placement", "internship"]):
            return "education"
        if any(w in combined for w in ["clean", "waste", "water", "electricity", "power", "traffic", "road", "pothole", "metro", "bus", "garbage", "swachh", "tree", "environment", "pollution"]):
            return "civic"
        if any(w in combined for w in ["subsidy", "ration", "pension", "welfare", "farmer", "agriculture", "crop", "housing", "scheme", "aadhaar", "voter", "election", "citizen"]):
            return "welfare"
        return "general"

    def _extract_entities_and_details(self, key_info: str) -> Dict[str, Any]:
        """Extracts key actionable entities from the provided key information."""
        info_lower = key_info.lower()

        # Extract dates / days
        dates = re.findall(r'\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow|this sunday|this saturday|\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b', key_info, flags=re.IGNORECASE)
        
        # Extract times
        times = re.findall(r'\b(?:\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.|hrs|hours)(?:\s*(?:to|-)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.|hrs|hours))?)\b', key_info, flags=re.IGNORECASE)
        
        # Extract phone / helplines
        helplines = re.findall(r'\b(?:112|108|1075|1070|1077|100|101|102|104|1091|1930|1800[\d\-]{4,10}|\+?91[\d\-\s]{10,12}|\d{10})\b', key_info)
        
        # Extract URLs
        urls = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', key_info)

        # Extract sentences as clean bullet points
        raw_sentences = [s.strip() for s in re.split(r'[\n•\*\r]+|[.!?]\s+(?=[A-Z0-9])', key_info) if len(s.strip()) > 3]

        return {
            "dates": list(dict.fromkeys(dates)),
            "times": list(dict.fromkeys(times)),
            "helplines": list(dict.fromkeys(helplines)),
            "urls": list(dict.fromkeys(urls)),
            "sentences": raw_sentences
        }

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
        """
        Advanced agentic local generator that constructs realistic, domain-aware,
        and channel-optimized mass communications with genuine clarity.
        """
        domain = self._classify_domain(campaign_title, purpose, key_information)
        entities = self._extract_entities_and_details(key_information)
        tone_lower = desired_tone.lower()
        is_urgent = "urgent" in tone_lower or domain == "emergency"

        # Domain and Tone-specific badging & headers
        if is_urgent:
            title_prefix = "🚨 URGENT ADVISORY: "
            salutation = f"URGENT NOTICE TO ALL {target_audience.upper()}:"
            lead_summary = f"Immediate attention is required regarding {campaign_title}. {purpose}."
            section_header = "⚠️ Critical Directives & Information:"
            signoff = "Issued by Emergency Public Safety & Disaster Management."
        elif domain == "health":
            title_prefix = "🏥 "
            salutation = f"Dear {target_audience},"
            lead_summary = f"Your health and well-being are our highest priority. We are announcing {campaign_title} to {purpose.lower().rstrip('.')}."
            section_header = "📋 Health Guidance & Schedule Details:"
            signoff = "Issued in public health interest for community well-being."
        elif domain == "education":
            title_prefix = "🎓 "
            salutation = f"Attention {target_audience}:"
            lead_summary = f"We are pleased to share essential details regarding {campaign_title}. The objective is to {purpose.lower().rstrip('.')}."
            section_header = "📌 Schedule & Participation Highlights:"
            signoff = "Issued by Academic & Student Affairs Coordination."
        elif domain == "civic":
            title_prefix = "📢 "
            salutation = f"Public Notice to {target_audience}:"
            lead_summary = f"Important community update regarding {campaign_title}. This initiative aims to {purpose.lower().rstrip('.')}."
            section_header = "📍 Essential Details & Timeline:"
            signoff = "Issued in public interest by Municipal & Civic Administration."
        elif domain == "welfare":
            title_prefix = "🌾 "
            salutation = f"Important Announcement for {target_audience}:"
            lead_summary = f"Citizen welfare update regarding {campaign_title}. Designed to {purpose.lower().rstrip('.')}."
            section_header = "💡 Key Benefits & Eligibility Details:"
            signoff = "Issued by Citizen Welfare & Social Development Directorate."
        else:
            title_prefix = "📢 "
            salutation = f"Public Announcement to {target_audience}:"
            lead_summary = f"Please review this public update concerning {campaign_title}. Purpose: {purpose}."
            section_header = "📌 Key Information & Instructions:"
            signoff = "Issued in public interest for mass awareness."

        # Format key information sentences into clean, organized bullet points
        raw_points = entities["sentences"]
        if not raw_points:
            raw_points = [key_information.strip()]

        formatted_bullets = []
        for p in raw_points:
            p_clean = p.rstrip(". ")
            if not p_clean.startswith("•"):
                formatted_bullets.append(f"• {p_clean}.")
            else:
                formatted_bullets.append(f"{p_clean}.")

        bullet_block = "\n".join(formatted_bullets)

        # Contextual Call to Action formulation
        helpline_str = f" Call Helpline {entities['helplines'][0]}." if entities["helplines"] else ""
        url_str = f" Visit {entities['urls'][0]}." if entities["urls"] else ""

        if is_urgent:
            cta = f"Follow official safety instructions immediately and stay indoors.{helpline_str}"
        elif domain == "health":
            if "polio" in campaign_title.lower() or "vaccin" in campaign_title.lower():
                cta = f"Bring your child to the nearest health booth or center during designated hours.{helpline_str}"
            else:
                cta = f"Attend the health session or visit your nearest primary health center.{helpline_str}"
        elif domain == "education":
            cta = f"Register through the student portal or reach out to your faculty coordinator.{url_str}"
        elif domain == "civic":
            cta = f"Cooperate with field teams and follow the maintenance schedule.{helpline_str}"
        elif domain == "welfare":
            cta = f"Submit your application at the local citizen center or online portal.{url_str}{helpline_str}"
        else:
            cta = f"Participate actively and share this information across your community.{helpline_str}"

        # Additional instructions incorporation
        extra_note = ""
        if optional_instructions and optional_instructions.strip():
            extra_note = f"\nSpecial Note: {optional_instructions.strip()}\n"

        # 1. Message Title
        subject = f"{title_prefix}{campaign_title} - {purpose}"
        if len(subject) > 120:
            subject = f"{title_prefix}{campaign_title}"

        # 2. Complete Structured Message Body
        body_lines = [
            salutation,
            "",
            lead_summary,
            "",
            section_header,
            bullet_block,
            extra_note if extra_note else "",
            f"✅ Action Required: {cta}",
            "",
            signoff
        ]
        message_body = "\n".join([line for line in body_lines if line is not None])

        # 3. Channel-Specific Variants
        # SMS / Push Notification (<= 160 chars)
        short_action = cta.split(".")[0] if "." in cta else cta
        first_fact = raw_points[0].rstrip(". ") if raw_points else key_information[:60]
        sms_text = f"{'🚨 ALERT: ' if is_urgent else '📢 '}{campaign_title}: {first_fact}. {short_action}."
        if entities["helplines"]:
            sms_text += f" Helpline: {entities['helplines'][0]}"
        if len(sms_text) > 160:
            sms_text = sms_text[:157] + "..."

        # WhatsApp Message (with bolding and formatting)
        whatsapp_bullets = "\n".join([f"👉 {p.lstrip('• ')}" for p in formatted_bullets])
        whatsapp_msg = (
            f"*{'🚨 ' if is_urgent else '📢 '}{campaign_title.upper()}*\n\n"
            f"_{lead_summary}_\n\n"
            f"*Key Details:*\n{whatsapp_bullets}\n\n"
            f"*Action Required:* {cta}\n\n"
            f"_{signoff}_"
        )

        # Voice Script (Conversational Text-to-Speech script)
        voice_script = (
            f"{'Attention, this is an urgent public alert.' if is_urgent else 'Attention residents and community members.'} "
            f"This is an announcement regarding {campaign_title}. {lead_summary} "
            f"Key details: {' '.join([p.lstrip('• ') for p in raw_points])} "
            f"Action required: {cta} Thank you."
        )

        # If non-English requested directly
        if desired_language and desired_language.strip().lower() != "english":
            try:
                from services.ai.translation_service import translation_service
                subject = translation_service.translate_text(subject, "English", desired_language)
                message_body = translation_service.translate_text(message_body, "English", desired_language)
                sms_text = translation_service.translate_text(sms_text, "English", desired_language)
                cta = translation_service.translate_text(cta, "English", desired_language)
                whatsapp_msg = translation_service.translate_text(whatsapp_msg, "English", desired_language)
                voice_script = translation_service.translate_text(voice_script, "English", desired_language)
            except Exception as trans_err:
                logger.warning(f"Language localization of generated content notice: {trans_err}")

        return {
            "message_title": subject,
            "message_body": message_body,
            "short_version": sms_text,
            "call_to_action": cta,
            "desired_language": desired_language,
            "desired_tone": desired_tone,
            "communication_channel": communication_channel,
            "whatsapp_message": whatsapp_msg,
            "voice_script": voice_script,
            "provider": "OmniAware Multilingual AI Agent (Domain-Aware Engine)"
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
            You are an expert Government & Public Mass Communication AI Agent.
            Your task is to craft high-impact, professional, and clear public awareness campaign communications.

            Campaign Details:
            - Title: {campaign_title}
            - Goal/Purpose: {purpose}
            - Target Audience: {target_audience}
            - Key Information: {key_information}
            - Desired Tone: {desired_tone} (e.g. Urgent, Informative, Reassuring, Friendly)
            - Primary Channel: {communication_channel}
            - Special Instructions: {optional_instructions or 'None'}
            - Language: {desired_language}

            Guidelines:
            1. Write clear, compelling, citizen-friendly language. No unnecessary bureaucratic jargon.
            2. For message_title: Create a punchy, eye-catching headline.
            3. For message_body: Structure with an engaging context paragraph, clean bullet points highlighting Date/Time/Venue/Eligibility, clear Action Required, and an official issuance closing.
            4. For short_version: Create an ultra-concise SMS/Push alert strictly under 160 characters with core fact and CTA.
            5. For call_to_action: State the exact immediate next step for the citizen.
            6. For whatsapp_message: Format cleanly with bolding (*...*) and emojis.
            7. For voice_script: Natural conversational broadcast speech for IVR / public announcement.

            Output ONLY a valid JSON object matching this schema:
            {{
                "message_title": "string",
                "message_body": "string",
                "short_version": "string (<= 160 chars)",
                "call_to_action": "string",
                "whatsapp_message": "string",
                "voice_script": "string"
            }}
            """
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.3
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
                "whatsapp_message": data.get("whatsapp_message", ""),
                "voice_script": data.get("voice_script", ""),
                "provider": "Google Gemini 2.5 Flash AI Agent"
            }
        except Exception as err:
            logger.error(f"Gemini API invocation failed: {err}")
            return None


content_generator_service = ContentGeneratorService()

