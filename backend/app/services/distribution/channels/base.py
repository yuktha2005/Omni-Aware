from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class ChannelSendResult:
    success: bool
    status: str  # DELIVERED, SENT, FAILED, RETRYING
    message_id: str
    provider: str
    response_data: Dict[str, Any] = field(default_factory=dict)
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None


class BaseChannelProvider(ABC):
    channel_name: str = "base"
    provider_name: str = "mock"
    is_mock: bool = True

    @abstractmethod
    def check_eligibility(self, recipient: Any) -> Tuple[bool, str, Optional[str]]:
        """
        Returns (is_eligible, reason_or_destination, destination_address)
        """
        pass

    @abstractmethod
    def send(
        self,
        recipient: Any,
        content: Any,
        campaign: Any,
        **kwargs
    ) -> ChannelSendResult:
        """
        Dispatches the message to the recipient over the channel.
        """
        pass
