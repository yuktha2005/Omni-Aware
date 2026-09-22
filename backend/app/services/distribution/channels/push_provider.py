import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Any, Tuple, Optional
import requests
from services.distribution.channels.base import BaseChannelProvider, ChannelSendResult

logger = logging.getLogger(__name__)


class PushNotificationProvider(BaseChannelProvider):
    channel_name: str = "push"

    def __init__(self):
        self.fcm_server_key = os.getenv("FCM_SERVER_KEY", "")
        self.fcm_url = os.getenv("FCM_SEND_URL", "https://fcm.googleapis.com/fcm/send")
        self.force_mock = os.getenv("PUSH_FORCE_MOCK", "true").lower() in ["true", "1", "yes"]

        self.is_mock = self.force_mock or not bool(self.fcm_server_key)
        self.provider_name = "Mock-Push-Service (FCM Simulated)" if self.is_mock else "FCM-Push-Service"

    def check_eligibility(self, recipient: Any) -> Tuple[bool, str, Optional[str]]:
        if not recipient:
            return False, "Recipient record is missing", None

        if getattr(recipient, "status", "active") != "active":
            return False, f"Recipient is {getattr(recipient, 'status', 'inactive')}", None

        consent = getattr(recipient, "consent_status", "consented")
        if consent in ["opted_out", "unsubscribed", "revoked"]:
            return False, f"Recipient consent status is {consent}", None

        # Device token resolution (fallback to simulated token based on recipient ID)
        device_token = getattr(recipient, "push_device_token", None)
        if not device_token:
            rec_id = getattr(recipient, "id", "anon")
            device_token = f"fcm_token_device_{rec_id}_{uuid.uuid4().hex[:8]}"

        return True, "Eligible for push notifications", device_token

    def send(
        self,
        recipient: Any,
        content: Any,
        campaign: Any,
        **kwargs
    ) -> ChannelSendResult:
        eligible, reason, token = self.check_eligibility(recipient)
        if not eligible:
            return ChannelSendResult(
                success=False,
                status="FAILED",
                message_id=f"fail-push-{uuid.uuid4().hex[:12]}",
                provider=self.provider_name,
                error_message=reason
            )

        title = getattr(content, "message_title", "Public Safety Update")
        body = getattr(content, "short_version", None) or getattr(content, "message_body", "")[:120]
        cta = getattr(content, "call_to_action", "/campaign/portal")
        campaign_id = getattr(campaign, "id", 0)

        message_id = f"push-{uuid.uuid4().hex[:16]}"
        now = datetime.now(timezone.utc)

        if self.is_mock:
            logger.info(f"[MOCK PUSH] Sent to DeviceToken {token[:15]}... | Title: {title}")
            return ChannelSendResult(
                success=True,
                status="DELIVERED",
                message_id=message_id,
                provider="Mock-Push-Provider (FCM Simulated)",
                response_data={
                    "multicast_id": uuid.uuid4().int % 100000000,
                    "success": 1,
                    "failure": 0,
                    "canonical_ids": 0,
                    "results": [{"message_id": message_id}],
                    "token": token,
                    "cta_action": cta,
                    "mock": True
                },
                sent_at=now,
                delivered_at=now
            )

        try:
            headers = {
                "Authorization": f"key={self.fcm_server_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "to": token,
                "notification": {
                    "title": title,
                    "body": body,
                    "click_action": cta
                },
                "data": {
                    "campaign_id": str(campaign_id),
                    "cta": cta
                }
            }
            res = requests.post(self.fcm_url, json=payload, headers=headers, timeout=10)
            res.raise_for_status()
            res_data = res.json()
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
            logger.error(f"Push notification dispatch error: {e}")
            return ChannelSendResult(
                success=False,
                status="FAILED",
                message_id=message_id,
                provider=self.provider_name,
                error_message=str(e)
            )
