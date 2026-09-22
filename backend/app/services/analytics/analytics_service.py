import logging
from typing import Dict, Any, List, Optional
from collections import Counter
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.campaign import (
    Campaign,
    CampaignContent,
    CampaignDelivery,
    EngagementEvent,
    CampaignFeedback,
    WebBroadcast
)
from models.recipient import Recipient
from models.master import Language, Occupation, State
from models.segment import AudienceSegment
from services.ai.sentiment_service import sentiment_tone_service

logger = logging.getLogger(__name__)


class AnalyticsService:
    def record_feedback(
        self,
        campaign_id: int,
        feedback_text: str,
        recipient_id: Optional[int] = None,
        channel: Optional[str] = "web",
        rating: Optional[int] = None,
        db: Optional[Session] = None
    ) -> CampaignFeedback:
        """
        Analyzes sentiment of audience feedback using Milestone 2 NLP service and persists to DB.
        """
        sentiment_res = sentiment_tone_service.analyze_sentiment(feedback_text)
        tone_res = sentiment_tone_service.detect_tone(feedback_text)

        feedback_entry = CampaignFeedback(
            campaign_id=campaign_id,
            recipient_id=recipient_id,
            channel=channel,
            feedback_text=feedback_text,
            rating=rating,
            sentiment=sentiment_res["sentiment"],
            sentiment_score=sentiment_res["score"],
            detected_tone=tone_res["detected_tone"]
        )

        db.add(feedback_entry)
        db.commit()
        db.refresh(feedback_entry)
        return feedback_entry

    def record_event(
        self,
        campaign_id: int,
        channel: str,
        event_type: str,
        recipient_id: Optional[int] = None,
        meta_data: Optional[Dict[str, Any]] = None,
        db: Optional[Session] = None
    ) -> EngagementEvent:
        """
        Records an engagement event (OPENED, CLICKED, RESPONDED, PARTICIPATED, etc.).
        """
        event = EngagementEvent(
            campaign_id=campaign_id,
            recipient_id=recipient_id,
            channel=channel.lower(),
            event_type=event_type.upper(),
            meta_data=meta_data or {}
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    def get_campaign_analytics(self, campaign_id: int, db: Session) -> Dict[str, Any]:
        """
        Calculates comprehensive delivery, engagement, channel, language, and audience KPIs for a campaign.
        """
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            raise ValueError(f"Campaign #{campaign_id} not found")

        # 1. Base Deliveries
        deliveries = db.query(CampaignDelivery).filter(CampaignDelivery.campaign_id == campaign_id).all()
        events = db.query(EngagementEvent).filter(EngagementEvent.campaign_id == campaign_id).all()
        feedbacks = db.query(CampaignFeedback).filter(CampaignFeedback.campaign_id == campaign_id).all()

        total_recipients = len(set([d.recipient_id for d in deliveries]))
        total_sent = len([d for d in deliveries if d.status in ["SENT", "DELIVERED"]])
        total_delivered = len([d for d in deliveries if d.status == "DELIVERED"])
        total_failed = len([d for d in deliveries if d.status == "FAILED"])

        delivery_rate = round((total_delivered / total_sent * 100), 1) if total_sent > 0 else 0.0

        # 2. Engagement Events
        total_opened = len([e for e in events if e.event_type == "OPENED"])
        total_clicked = len([e for e in events if e.event_type == "CLICKED"])
        total_responded = len([e for e in events if e.event_type == "RESPONDED"])
        total_participated = len([e for e in events if e.event_type == "PARTICIPATED"])

        # Email & Push deliverable count for open rate calculation
        trackable_delivered = len([d for d in deliveries if d.channel in ["email", "push"] and d.status == "DELIVERED"])
        open_rate = round((total_opened / trackable_delivered * 100), 1) if trackable_delivered > 0 else "N/A"
        click_rate = round((total_clicked / total_delivered * 100), 1) if total_delivered > 0 else 0.0
        response_rate = round((total_responded / total_delivered * 100), 1) if total_delivered > 0 else 0.0
        participation_rate = round((total_participated / total_delivered * 100), 1) if total_delivered > 0 else 0.0

        # 3. Channel Breakdown
        channel_names = ["email", "sms", "whatsapp", "push", "web"]
        channels_metrics = []
        for ch in channel_names:
            ch_delivs = [d for d in deliveries if d.channel == ch]
            if not ch_delivs and ch != "web":
                continue

            ch_sent = len([d for d in ch_delivs if d.status in ["SENT", "DELIVERED"]])
            ch_delivered = len([d for d in ch_delivs if d.status == "DELIVERED"])
            ch_failed = len([d for d in ch_delivs if d.status == "FAILED"])
            ch_deliv_rate = round((ch_delivered / ch_sent * 100), 1) if ch_sent > 0 else 0.0

            ch_events = [e for e in events if e.channel == ch]
            ch_opened = len([e for e in ch_events if e.event_type == "OPENED"])
            ch_clicked = len([e for e in ch_events if e.event_type == "CLICKED"])
            ch_responded = len([e for e in ch_events if e.event_type == "RESPONDED"])

            ch_open_rate = round((ch_opened / ch_delivered * 100), 1) if (ch in ["email", "push"] and ch_delivered > 0) else "N/A"
            ch_click_rate = round((ch_clicked / ch_delivered * 100), 1) if ch_delivered > 0 else "N/A"
            ch_response_rate = round((ch_responded / ch_delivered * 100), 1) if ch_delivered > 0 else 0.0

            channels_metrics.append({
                "channel": ch.upper() if ch in ["sms", "web"] else ch.capitalize(),
                "sent": ch_sent,
                "delivered": ch_delivered,
                "failed": ch_failed,
                "delivery_rate": ch_deliv_rate,
                "opened": ch_opened,
                "open_rate": ch_open_rate,
                "clicked": ch_clicked,
                "click_rate": ch_click_rate,
                "responded": ch_responded,
                "response_rate": ch_response_rate
            })

        # 4. Language Breakdown
        recipient_ids = list(set([d.recipient_id for d in deliveries]))
        recipients_map = {r.id: r for r in db.query(Recipient).filter(Recipient.id.in_(recipient_ids)).all()} if recipient_ids else {}
        languages_map = {l.id: l for l in db.query(Language).all()}

        lang_counts = Counter()
        lang_delivered = Counter()
        lang_sent = Counter()
        lang_engagements = Counter()

        for d in deliveries:
            rec = recipients_map.get(d.recipient_id)
            lang_name = "English"
            if rec and rec.preferred_language_id and rec.preferred_language_id in languages_map:
                lang_name = languages_map[rec.preferred_language_id].name

            lang_counts[lang_name] += 1
            if d.status in ["SENT", "DELIVERED"]:
                lang_sent[lang_name] += 1
            if d.status == "DELIVERED":
                lang_delivered[lang_name] += 1

        for e in events:
            if e.event_type in ["OPENED", "CLICKED", "RESPONDED", "PARTICIPATED"]:
                rec = recipients_map.get(e.recipient_id)
                lang_name = "English"
                if rec and rec.preferred_language_id and rec.preferred_language_id in languages_map:
                    lang_name = languages_map[rec.preferred_language_id].name
                lang_engagements[lang_name] += 1

        languages_metrics = []
        for lang_name, count in (lang_counts.most_common() or [("English", total_recipients)]):
            s = lang_sent[lang_name]
            deliv = lang_delivered[lang_name]
            eng = lang_engagements[lang_name]
            d_rate = round((deliv / s * 100), 1) if s > 0 else 0.0
            e_rate = round((eng / deliv * 100), 1) if deliv > 0 else 0.0

            languages_metrics.append({
                "language": lang_name,
                "language_code": lang_name[:2].lower(),
                "recipient_count": count,
                "sent": s,
                "delivered": deliv,
                "delivery_rate": d_rate,
                "engagement_count": eng,
                "engagement_rate": e_rate
            })

        # 5. Audience Breakdown
        occupations_map = {o.id: o for o in db.query(Occupation).all()}
        aud_counts = Counter()
        aud_sent = Counter()
        aud_delivered = Counter()
        aud_engagements = Counter()

        for d in deliveries:
            rec = recipients_map.get(d.recipient_id)
            aud_name = "General Public"
            if rec and rec.occupation_id and rec.occupation_id in occupations_map:
                aud_name = occupations_map[rec.occupation_id].name
            elif campaign.target_audience and campaign.target_audience.lower() != "all":
                aud_name = campaign.target_audience

            aud_counts[aud_name] += 1
            if d.status in ["SENT", "DELIVERED"]:
                aud_sent[aud_name] += 1
            if d.status == "DELIVERED":
                aud_delivered[aud_name] += 1

        for e in events:
            if e.event_type in ["OPENED", "CLICKED", "RESPONDED", "PARTICIPATED"]:
                rec = recipients_map.get(e.recipient_id)
                aud_name = "General Public"
                if rec and rec.occupation_id and rec.occupation_id in occupations_map:
                    aud_name = occupations_map[rec.occupation_id].name
                elif campaign.target_audience and campaign.target_audience.lower() != "all":
                    aud_name = campaign.target_audience
                aud_engagements[aud_name] += 1

        audiences_metrics = []
        for aud_name, count in (aud_counts.most_common() or [("General Public", total_recipients)]):
            s = aud_sent[aud_name]
            deliv = aud_delivered[aud_name]
            eng = aud_engagements[aud_name]
            d_rate = round((deliv / s * 100), 1) if s > 0 else 0.0
            e_rate = round((eng / deliv * 100), 1) if deliv > 0 else 0.0

            audiences_metrics.append({
                "segment_name": aud_name,
                "recipient_count": count,
                "sent": s,
                "delivered": deliv,
                "delivery_rate": d_rate,
                "engagement_count": eng,
                "engagement_rate": e_rate
            })

        # 6. Feedback & Sentiment Breakdown
        total_fb = len(feedbacks)
        pos_count = len([f for f in feedbacks if f.sentiment == "positive"])
        neu_count = len([f for f in feedbacks if f.sentiment == "neutral"])
        neg_count = len([f for f in feedbacks if f.sentiment == "negative"])

        ratings = [f.rating for f in feedbacks if f.rating is not None]
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else None

        pos_pct = round(pos_count / total_fb * 100, 1) if total_fb > 0 else 0.0
        neu_pct = round(neu_count / total_fb * 100, 1) if total_fb > 0 else 0.0
        neg_pct = round(neg_count / total_fb * 100, 1) if total_fb > 0 else 0.0

        top_tones = dict(Counter([f.detected_tone for f in feedbacks if f.detected_tone]).most_common(5))

        return {
            "campaign_id": campaign.id,
            "campaign_title": campaign.title,
            "purpose": campaign.purpose,
            "status": campaign.status,
            "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
            "scheduled_at": campaign.scheduled_at.isoformat() if campaign.scheduled_at else None,
            "summary": {
                "total_recipients": total_recipients,
                "total_sent": total_sent,
                "total_delivered": total_delivered,
                "total_failed": total_failed,
                "delivery_rate": delivery_rate,
                "total_opened": total_opened,
                "open_rate": open_rate,
                "total_clicked": total_clicked,
                "click_rate": click_rate,
                "total_responded": total_responded,
                "response_rate": response_rate,
                "total_participated": total_participated,
                "participation_rate": participation_rate
            },
            "channels": channels_metrics,
            "languages": languages_metrics,
            "audiences": audiences_metrics,
            "feedback": {
                "total_feedbacks": total_fb,
                "average_rating": avg_rating,
                "positive_count": pos_count,
                "neutral_count": neu_count,
                "negative_count": neg_count,
                "positive_percentage": pos_pct,
                "neutral_percentage": neu_pct,
                "negative_percentage": neg_pct,
                "top_tones": top_tones
            }
        }

    def get_platform_overview(self, db: Session) -> Dict[str, Any]:
        """
        Computes system-wide aggregate stats across all campaigns.
        """
        total_campaigns = db.query(Campaign).count()
        active_campaigns = db.query(Campaign).filter(Campaign.status.in_(["scheduled", "queued", "running"])).count()
        completed_campaigns = db.query(Campaign).filter(Campaign.status == "completed").count()

        total_dispatches = db.query(CampaignDelivery).count()
        total_delivered = db.query(CampaignDelivery).filter(CampaignDelivery.status == "DELIVERED").count()
        overall_delivery_rate = round(total_delivered / total_dispatches * 100, 1) if total_dispatches > 0 else 0.0

        total_engagements = db.query(EngagementEvent).count()
        overall_engagement_rate = round(total_engagements / total_delivered * 100, 1) if total_delivered > 0 else 0.0

        channel_counts = dict(
            db.query(CampaignDelivery.channel, func.count(CampaignDelivery.id))
            .group_by(CampaignDelivery.channel)
            .all()
        )

        language_counts = dict(
            db.query(Language.name, func.count(Recipient.id))
            .join(Recipient, Recipient.preferred_language_id == Language.id)
            .group_by(Language.name)
            .all()
        )

        return {
            "total_campaigns": total_campaigns,
            "active_campaigns": active_campaigns,
            "completed_campaigns": completed_campaigns,
            "total_dispatches": total_dispatches,
            "total_delivered": total_delivered,
            "overall_delivery_rate": overall_delivery_rate,
            "total_engagements": total_engagements,
            "overall_engagement_rate": overall_engagement_rate,
            "channel_distribution": channel_counts,
            "language_distribution": language_counts
        }


analytics_service = AnalyticsService()
