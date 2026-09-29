import os
import re
import uuid
import logging
from datetime import datetime, timezone
from typing import Any, Tuple, Optional
import requests
from services.distribution.channels.base import BaseChannelProvider, ChannelSendResult

logger = logging.getLogger(__name__)


class WhatsAppChannelProvider(BaseChannelProvider):
    channel_name: str = "whatsapp"

    def __init__(self):
        self.api_url = os.getenv("WHATSAPP_API_URL", "")  # e.g., https://graph.facebook.com/v19.0/{phone_number_id}/messages
        self.access_token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
        self.phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
        self.template_name = os.getenv("WHATSAPP_TEMPLATE_NAME", "public_awareness_broadcast")
        self.force_mock = os.getenv("WHATSAPP_FORCE_MOCK", "true").lower() in ["true", "1", "yes"]

        is_placeholder = (
            not self.access_token 
            or any(x in str(self.access_token).lower() for x in ["your_", "placeholder", "xxx"])
            or any(x in str(self.phone_number_id).lower() for x in ["your_", "placeholder", "xxx"])
        )
        self.is_mock = self.force_mock or not bool(self.api_url and self.access_token) or is_placeholder
        self.provider_name = "Mock-WhatsApp-Cloud-API (Pending Production Credentials)" if self.is_mock else "WhatsApp-Cloud-API"

    def clean_phone_number(self, phone: Optional[str]) -> Optional[str]:
        if not phone:
            return None
        cleaned = re.sub(r"[^\d+]", "", str(phone).strip())
        digits = re.sub(r"[^\d]", "", cleaned)
        if len(digits) < 10:
            return None
        # Ensure country code (default to 91 for India if 10 digits)
        if len(digits) == 10:
            digits = f"91{digits}"
        return digits

    def check_eligibility(self, recipient: Any) -> Tuple[bool, str, Optional[str]]:
        if not recipient:
            return False, "Recipient record is missing", None

        if getattr(recipient, "status", "active") != "active":
            return False, f"Recipient is {getattr(recipient, 'status', 'inactive')}", None

        consent = getattr(recipient, "consent_status", "consented")
        if consent in ["opted_out", "unsubscribed", "revoked"]:
            return False, f"Recipient consent status is {consent}", None

        raw_phone = getattr(recipient, "phone_number", None) or getattr(recipient, "phone", None)
        cleaned_phone = self.clean_phone_number(raw_phone)
        if not cleaned_phone:
            return False, "Recipient has invalid or missing phone number for WhatsApp", None

        return True, "Eligible for WhatsApp delivery", cleaned_phone

    def send(
        self,
        recipient: Any,
        content: Any,
        campaign: Any,
        **kwargs
    ) -> ChannelSendResult:
        eligible, reason, phone = self.check_eligibility(recipient)
        if not eligible:
            return ChannelSendResult(
                success=False,
                status="FAILED",
                message_id=f"fail-wa-{uuid.uuid4().hex[:12]}",
                provider=self.provider_name,
                error_message=reason
            )

        title = getattr(content, "message_title", "Public Awareness Notice")
        body_text = getattr(content, "message_body", "")
        call_to_action = getattr(content, "call_to_action", "Read more on portal")
        language_code = getattr(content, "language_code", "en")

        # Map language codes to WhatsApp supported format (e.g. 'ta', 'te', 'hi', 'en_US')
        wa_lang = "en_US" if language_code == "en" else language_code

        message_id = f"wamid.HBgL{uuid.uuid4().hex[:20]}"
        now = datetime.now(timezone.utc)

        if self.is_mock:
            logger.info(
                f"[MOCK WHATSAPP] Recipient: +{phone} | Template: {self.template_name} | "
                f"Lang: {wa_lang} | ID: {message_id}"
            )
            return ChannelSendResult(
                success=True,
                status="DELIVERED",
                message_id=message_id,
                provider="Mock-WhatsApp-Business-API (Simulated - Production Credentials Pending)",
                response_data={
                    "messaging_product": "whatsapp",
                    "contacts": [{"input": phone, "wa_id": phone}],
                    "messages": [{"id": message_id, "message_status": "accepted"}],
                    "template_applied": self.template_name,
                    "language": wa_lang,
                    "mock_simulation": True
                },
                sent_at=now,
                delivered_at=now
            )

        # Live Meta Graph WhatsApp Business API call
        try:
            endpoint = self.api_url or f"https://graph.facebook.com/v19.0/{self.phone_number_id}/messages"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": phone,
                "type": "template",
                "template": {
                    "name": self.template_name,
                    "language": {"code": wa_lang},
                    "components": [
                        {
                            "type": "header",
                            "parameters": [{"type": "text", "text": title[:60]}]
                        },
                        {
                            "type": "body",
                            "parameters": [
                                {"type": "text", "text": getattr(recipient, "first_name", "Citizen")},
                                {"type": "text", "text": body_text[:1000]},
                                {"type": "text", "text": call_to_action[:100]}
                            ]
                        }
                    ]
                }
            }

            res = requests.post(endpoint, json=payload, headers=headers, timeout=12)
            res.raise_for_status()
            res_json = res.json()
            returned_id = res_json.get("messages", [{}])[0].get("id", message_id)

            return ChannelSendResult(
                success=True,
                status="SENT",
                message_id=returned_id,
                provider=self.provider_name,
                response_data=res_json,
                sent_at=now,
                delivered_at=now
            )
        except Exception as e:
            logger.error(f"WhatsApp Cloud API error for {phone}: {e}")
            return ChannelSendResult(
                success=False,
                status="FAILED",
                message_id=message_id,
                provider=self.provider_name,
                error_message=str(e)
            )
