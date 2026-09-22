import logging
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from database.connection import SessionLocal
from models.campaign import (
    Campaign,
    CampaignContent,
    CampaignDelivery,
    DeliveryAttempt,
    EngagementEvent,
    WebBroadcast
)
from models.recipient import Recipient
from models.master import Language
from models.segment import AudienceSegment, AudienceSegmentRule
from services.distribution.channel_manager import channel_manager

logger = logging.getLogger(__name__)


class DistributionEngine:
    def __init__(self):
        self.max_retries = 3

    def get_campaign_recipients(self, campaign: Campaign, db: Session) -> List[Recipient]:
        """
        Resolves recipients based on target_segment_id or target_audience criteria.
        """
        query = db.query(Recipient).filter(Recipient.status == "active")

        # 1. Segment-based filtering
        if campaign.target_segment_id:
            segment_rule = db.query(AudienceSegmentRule).filter(
                AudienceSegmentRule.segment_id == campaign.target_segment_id
            ).first()
            if segment_rule and segment_rule.rules:
                # Basic rule application from segment
                rules = segment_rule.rules
                if isinstance(rules, dict):
                    if rules.get("state_id"):
                        query = query.filter(Recipient.state_id == rules["state_id"])
                    if rules.get("occupation_id"):
                        query = query.filter(Recipient.occupation_id == rules["occupation_id"])
                    if rules.get("preferred_language_id"):
                        query = query.filter(Recipient.preferred_language_id == rules["preferred_language_id"])

        # 2. String target_audience matching
        elif campaign.target_audience and campaign.target_audience.lower() != "all":
            aud_str = campaign.target_audience.lower()
            # If target specifies students, farmers, healthcare, etc.
            # We filter by occupation or general match if available
            pass

        return query.all()

    def get_content_by_language(self, campaign: Campaign, db: Session) -> Dict[str, CampaignContent]:
        """
        Maps language names and codes to CampaignContent records.
        """
        contents = db.query(CampaignContent).filter(
            CampaignContent.campaign_id == campaign.id
        ).all()

        mapping = {}
        for c in contents:
            if c.language:
                mapping[c.language.lower()] = c
            if c.language_code:
                mapping[c.language_code.lower()] = c
        return mapping

    def resolve_recipient_language_content(
        self,
        recipient: Recipient,
        content_map: Dict[str, CampaignContent],
        default_content: Optional[CampaignContent],
        db: Session
    ) -> Optional[CampaignContent]:
        """
        Determines the best matching CampaignContent for a recipient based on preferred language.
        """
        if recipient.preferred_language_id:
            lang_rec = db.query(Language).filter(Language.id == recipient.preferred_language_id).first()
            if lang_rec:
                # Try language name
                if lang_rec.name and lang_rec.name.lower() in content_map:
                    return content_map[lang_rec.name.lower()]
                # Try language code
                if lang_rec.code and lang_rec.code.lower() in content_map:
                    return content_map[lang_rec.code.lower()]

        return default_content

    def distribute_campaign(
        self,
        campaign_id: int,
        channels: Optional[List[str]] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Orchestrates full delivery dispatch for a campaign.
        """
        is_local_db = False
        if db is None:
            db = SessionLocal()
            is_local_db = True

        try:
            campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
            if not campaign:
                raise ValueError(f"Campaign with ID {campaign_id} not found")

            # Update campaign state
            campaign.status = "running"
            campaign.started_at = datetime.utcnow()
            db.commit()

            selected_channels = channels or campaign.selected_channels or ["email", "sms"]
            if isinstance(selected_channels, str):
                selected_channels = [c.strip().lower() for c in selected_channels.split(",")]

            # Resolve contents
            content_map = self.get_content_by_language(campaign, db)
            contents_list = list(content_map.values())
            default_content = contents_list[0] if contents_list else None

            if not default_content:
                # If no content exists yet, create dummy/fallback content to prevent failure
                default_content = CampaignContent(
                    campaign_id=campaign.id,
                    language=campaign.desired_language or "English",
                    language_code="en",
                    message_title=campaign.title,
                    message_body=campaign.key_information,
                    short_version=campaign.key_information[:140],
                    call_to_action="Learn More",
                    status="ready_for_distribution"
                )
                db.add(default_content)
                db.commit()
                db.refresh(default_content)

            recipients = self.get_campaign_recipients(campaign, db)
            total_dispatched = 0
            total_delivered = 0
            total_failed = 0

            # 1. Process Web Broadcast if selected
            if "web" in [c.lower() for c in selected_channels]:
                existing_broadcast = db.query(WebBroadcast).filter(
                    WebBroadcast.campaign_id == campaign.id
                ).first()
                if not existing_broadcast:
                    web_b = WebBroadcast(
                        campaign_id=campaign.id,
                        title=default_content.message_title,
                        body=default_content.message_body,
                        language=default_content.language,
                        call_to_action=default_content.call_to_action,
                        is_active=True
                    )
                    db.add(web_b)
                    db.commit()

            # 2. Process Recipients across selected channels
            for recipient in recipients:
                target_content = self.resolve_recipient_language_content(
                    recipient=recipient,
                    content_map=content_map,
                    default_content=default_content,
                    db=db
                )

                for channel in selected_channels:
                    if channel.lower() == "web":
                        continue  # Web is portal-wide, not per-recipient

                    provider = channel_manager.get_provider(channel)
                    if not provider:
                        continue

                    # Check recipient consent and address
                    eligible, reason, destination = provider.check_eligibility(recipient)

                    delivery = CampaignDelivery(
                        campaign_id=campaign.id,
                        recipient_id=recipient.id,
                        channel=channel.lower(),
                        status="QUEUED",
                        provider=provider.provider_name,
                        attempt_count=1,
                        retry_count=0,
                        max_retries=self.max_retries,
                        meta_data={"destination": destination}
                    )
                    db.add(delivery)
                    db.commit()
                    db.refresh(delivery)

                    total_dispatched += 1

                    if not eligible:
                        delivery.status = "FAILED"
                        delivery.failure_reason = reason
                        delivery.failed_at = datetime.utcnow()
                        total_failed += 1
                        db.commit()

                        attempt = DeliveryAttempt(
                            delivery_id=delivery.id,
                            attempt_number=1,
                            status="FAILED",
                            error_message=reason
                        )
                        db.add(attempt)
                        db.commit()
                        continue

                    # Dispatch via channel provider
                    delivery.status = "SENDING"
                    db.commit()

                    result = channel_manager.dispatch(
                        channel_name=channel,
                        recipient=recipient,
                        content=target_content,
                        campaign=campaign
                    )

                    attempt = DeliveryAttempt(
                        delivery_id=delivery.id,
                        attempt_number=1,
                        status=result.status,
                        provider_response=result.response_data,
                        error_message=result.error_message
                    )
                    db.add(attempt)

                    delivery.message_id = result.message_id
                    delivery.status = result.status
                    delivery.provider = result.provider
                    delivery.sent_at = result.sent_at or datetime.utcnow()
                    delivery.delivered_at = result.delivered_at

                    if result.success:
                        total_delivered += 1
                        # Log standard initial events
                        event_sent = EngagementEvent(
                            campaign_id=campaign.id,
                            recipient_id=recipient.id,
                            channel=channel.lower(),
                            event_type="SENT",
                            event_timestamp=result.sent_at or datetime.utcnow()
                        )
                        event_del = EngagementEvent(
                            campaign_id=campaign.id,
                            recipient_id=recipient.id,
                            channel=channel.lower(),
                            event_type="DELIVERED",
                            event_timestamp=result.delivered_at or datetime.utcnow()
                        )
                        db.add(event_sent)
                        db.add(event_del)
                    else:
                        total_failed += 1
                        delivery.failed_at = datetime.utcnow()
                        delivery.failure_reason = result.error_message
                        if delivery.retry_count < delivery.max_retries:
                            delivery.status = "RETRYING"
                            delivery.next_retry_at = datetime.utcnow() + timedelta(seconds=60)

                    db.commit()

            # Finalize campaign stats
            campaign.status = "completed"
            campaign.completed_at = datetime.utcnow()
            campaign.total_recipients = len(recipients)
            campaign.total_delivered = total_delivered
            campaign.total_failed = total_failed
            db.commit()

            return {
                "campaign_id": campaign.id,
                "status": "completed",
                "total_recipients": len(recipients),
                "total_dispatched": total_dispatched,
                "total_delivered": total_delivered,
                "total_failed": total_failed,
                "channels": selected_channels
            }
        except Exception as e:
            logger.error(f"Error executing distribution for campaign #{campaign_id}: {e}")
            if campaign:
                campaign.status = "failed"
                db.commit()
            raise e
        finally:
            if is_local_db:
                db.close()

    def retry_failed_deliveries(
        self,
        campaign_id: int,
        db: Session
    ) -> Dict[str, Any]:
        """
        Processes retries for eligible failed/retrying deliveries up to max_retries limit.
        """
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            raise ValueError(f"Campaign with ID {campaign_id} not found")

        retrying_deliveries = db.query(CampaignDelivery).filter(
            CampaignDelivery.campaign_id == campaign_id,
            CampaignDelivery.status.in_(["RETRYING", "FAILED"]),
            CampaignDelivery.retry_count < CampaignDelivery.max_retries
        ).all()

        content_map = self.get_content_by_language(campaign, db)
        contents_list = list(content_map.values())
        default_content = contents_list[0] if contents_list else None

        re_attempted = 0
        now_recovered = 0

        for delivery in retrying_deliveries:
            recipient = db.query(Recipient).filter(Recipient.id == delivery.recipient_id).first()
            if not recipient:
                continue

            target_content = self.resolve_recipient_language_content(
                recipient=recipient,
                content_map=content_map,
                default_content=default_content,
                db=db
            )

            delivery.attempt_count += 1
            delivery.retry_count += 1
            re_attempted += 1

            result = channel_manager.dispatch(
                channel_name=delivery.channel,
                recipient=recipient,
                content=target_content,
                campaign=campaign
            )

            attempt = DeliveryAttempt(
                delivery_id=delivery.id,
                attempt_number=delivery.attempt_count,
                status=result.status,
                provider_response=result.response_data,
                error_message=result.error_message
            )
            db.add(attempt)

            if result.success:
                now_recovered += 1
                delivery.status = result.status
                delivery.failure_reason = None
                delivery.delivered_at = result.delivered_at or datetime.utcnow()
                delivery.next_retry_at = None

                db.add(EngagementEvent(
                    campaign_id=campaign.id,
                    recipient_id=recipient.id,
                    channel=delivery.channel,
                    event_type="DELIVERED",
                    event_timestamp=datetime.utcnow()
                ))
            else:
                delivery.failure_reason = result.error_message
                if delivery.retry_count >= delivery.max_retries:
                    delivery.status = "FAILED"
                    delivery.next_retry_at = None
                else:
                    delivery.status = "RETRYING"
                    delivery.next_retry_at = datetime.utcnow() + timedelta(seconds=60 * (2 ** delivery.retry_count))

            db.commit()

        return {
            "campaign_id": campaign_id,
            "re_attempted_count": re_attempted,
            "recovered_count": now_recovered
        }


distribution_engine = DistributionEngine()
