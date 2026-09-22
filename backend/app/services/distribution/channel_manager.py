import logging
from typing import Dict, List, Any, Optional
from services.distribution.channels.base import BaseChannelProvider, ChannelSendResult
from services.distribution.channels.email_provider import EmailChannelProvider
from services.distribution.channels.sms_provider import SMSChannelProvider
from services.distribution.channels.whatsapp_provider import WhatsAppChannelProvider
from services.distribution.channels.push_provider import PushNotificationProvider
from services.distribution.channels.web_provider import WebBroadcastProvider

logger = logging.getLogger(__name__)


class ChannelManager:
    def __init__(self):
        self._providers: Dict[str, BaseChannelProvider] = {
            "email": EmailChannelProvider(),
            "sms": SMSChannelProvider(),
            "whatsapp": WhatsAppChannelProvider(),
            "push": PushNotificationProvider(),
            "web": WebBroadcastProvider()
        }

    def register_provider(self, channel_name: str, provider: BaseChannelProvider):
        self._providers[channel_name.lower()] = provider

    def get_provider(self, channel_name: str) -> Optional[BaseChannelProvider]:
        return self._providers.get(channel_name.lower())

    def get_available_channels(self) -> List[str]:
        return list(self._providers.keys())

    def check_recipient_eligibility(
        self,
        recipient: Any,
        channels: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Evaluates eligibility for each specified channel.
        """
        results = {}
        for channel in channels:
            provider = self.get_provider(channel)
            if not provider:
                results[channel] = {
                    "eligible": False,
                    "reason": f"Channel '{channel}' is not configured on platform",
                    "destination": None
                }
                continue

            eligible, reason, destination = provider.check_eligibility(recipient)
            results[channel] = {
                "eligible": eligible,
                "reason": reason,
                "destination": destination
            }
        return results

    def dispatch(
        self,
        channel_name: str,
        recipient: Any,
        content: Any,
        campaign: Any,
        **kwargs
    ) -> ChannelSendResult:
        provider = self.get_provider(channel_name)
        if not provider:
            return ChannelSendResult(
                success=False,
                status="FAILED",
                message_id="err-unsupported-channel",
                provider="None",
                error_message=f"Unsupported channel: {channel_name}"
            )

        return provider.send(
            recipient=recipient,
            content=content,
            campaign=campaign,
            **kwargs
        )


channel_manager = ChannelManager()
