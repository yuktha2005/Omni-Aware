import os
import re
import uuid
import logging
from datetime import datetime, timezone
from typing import Any, Tuple, Optional
import requests
from services.distribution.channels.base import BaseChannelProvider, ChannelSendResult

logger = logging.getLogger(__name__)


class SMSChannelProvider(BaseChannelProvider):
    channel_name: str = "sms"

    def __init__(self):
        self.gateway_url = os.getenv("SMS_GATEWAY_URL", "")
        self.api_key = os.getenv("SMS_API_KEY", "")
        self.sender_id = os.getenv("SMS_SENDER_ID", "GOVAWR")
        self.force_mock = os.getenv("SMS_FORCE_MOCK", "true").lower() in ["true", "1", "yes"]

        self.is_mock = self.force_mock or not bool(self.gateway_url and self.api_key)
        self.provider_name = "Mock-SMS-Gateway" if self.is_mock else f"SMS-Gateway-{self.sender_id}"

    def clean_phone_number(self, phone: Optional[str]) -> Optional[str]:
        if not phone:
            return None
        cleaned = re.sub(r"[^\d+]", "", str(phone).strip())
        digits = re.sub(r"[^\d]", "", cleaned)
        if len(digits) < 10:
            return None
        return cleaned

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
            return False, "Recipient has invalid or missing phone number for SMS", None

        return True, "Eligible for SMS delivery", cleaned_phone

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
                message_id=f"fail-sms-{uuid.uuid4().hex[:12]}",
                provider=self.provider_name,
                error_message=reason
            )

        short_version = getattr(content, "short_version", "")
        body_text = getattr(content, "message_body", "")
        message_text = short_version if short_version and len(short_version) > 5 else body_text[:160]
        
        # Append CTA if available
        cta = getattr(content, "call_to_action", None)
        if cta and len(message_text) + len(cta) + 5 <= 160:
            message_text = f"{message_text} | {cta}"

        message_id = f"sms-{uuid.uuid4().hex[:16]}"
        now = datetime.now(timezone.utc)

        if self.is_mock:
            logger.info(f"[MOCK SMS] Sent to {phone} | ID: {message_id} | Text: {message_text[:50]}...")
            return ChannelSendResult(
                success=True,
                status="DELIVERED",
                message_id=message_id,
                provider="Mock-SMS-Gateway (Dev Mode)",
                response_data={
                    "phone": phone,
                    "length": len(message_text),
                    "sender_id": self.sender_id,
                    "mock": True
                },
                sent_at=now,
                delivered_at=now
            )

        try:
            payload = {
                "apiKey": self.api_key,
                "sender": self.sender_id,
                "numbers": phone,
                "message": message_text
            }
            res = requests.post(self.gateway_url, json=payload, timeout=10)
            res.raise_for_status()
            res_data = res.json() if "application/json" in res.headers.get("Content-Type", "") else {"raw": res.text}
            return ChannelSendResult(
                success=True,
                status="SENT",
                message_id=message_id,
                provider=self.provider_name,
                response_data=res_data,
                sent_at=now,
                delivered_at=now
            )
        except Exception as e:
            logger.error(f"Failed to send SMS to {phone}: {e}")
            return ChannelSendResult(
                success=False,
                status="FAILED",
                message_id=message_id,
                provider=self.provider_name,
                error_message=str(e)
            )
