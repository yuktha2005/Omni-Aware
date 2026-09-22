import uuid
import logging
from datetime import datetime
from typing import Any, Tuple, Optional
from services.distribution.channels.base import BaseChannelProvider, ChannelSendResult

logger = logging.getLogger(__name__)


class WebBroadcastProvider(BaseChannelProvider):
    channel_name: str = "web"
    provider_name: str = "Web-Portal-Broadcaster"
    is_mock: bool = False

    def check_eligibility(self, recipient: Any) -> Tuple[bool, str, Optional[str]]:
        # Web broadcasts are generally public / dashboard-wide
        return True, "Eligible for Web Portal Broadcast", "web-portal"

    def send(
        self,
        recipient: Any,
        content: Any,
        campaign: Any,
        **kwargs
    ) -> ChannelSendResult:
        campaign_id = getattr(campaign, "id", 0)
        title = getattr(content, "message_title", "Community Awareness Notice")
        message_id = f"web-{campaign_id}-{uuid.uuid4().hex[:10]}"
        now = datetime.utcnow()

        logger.info(f"[WEB BROADCAST] Published announcement for Campaign #{campaign_id}: {title}")

        return ChannelSendResult(
            success=True,
            status="DELIVERED",
            message_id=message_id,
            provider=self.provider_name,
            response_data={
                "campaign_id": campaign_id,
                "broadcast_url": f"/broadcasts/{campaign_id}",
                "published": True
            },
            sent_at=now,
            delivered_at=now
        )
