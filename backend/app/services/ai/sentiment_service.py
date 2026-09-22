import re
import logging
from typing import Dict, Any, Optional, List
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

logger = logging.getLogger(__name__)


class SentimentToneService:
    def __init__(self):
        self.analyzer = SentimentIntensityAnalyzer()

        # Tone keyword lexicons
        self.tone_markers = {
            "urgent": [
                "urgent", "immediate", "immediately", "alert", "emergency", "critical",
                "warning", "asap", "deadline", "danger", "hazard", "action required", "time-sensitive"
            ],
            "reassuring": [
                "safe", "safety", "care", "wellness", "support", "protect", "healthy",
                "reassure", "peace of mind", "committed", "secure", "preventive", "guidance"
            ],
            "friendly": [
                "welcome", "hello", "excited", "join us", "glad", "delighted", "together",
                "opportunity", "connect", "invite", "fun", "celebrate", "empower"
            ],
            "informative": [
                "information", "announce", "notice", "schedule", "details", "guidelines",
                "program", "update", "dates", "highlights", "facts", "sessions"
            ],
            "formal": [
                "hereby", "directive", "pursuant", "authorized", "compliance", "mandatory",
                "protocol", "administered", "accordance", "official", "regulations"
            ]
        }

    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Calculates sentiment polarity scores using VADER.
        """
        if not text or not text.strip():
            return {"sentiment": "neutral", "score": 0.0, "details": {}}

        scores = self.analyzer.polarity_scores(text)
        compound = scores.get("compound", 0.0)

        if compound >= 0.15:
            sentiment_label = "positive"
        elif compound <= -0.15:
            sentiment_label = "negative"
        else:
            sentiment_label = "neutral"

        return {
            "sentiment": sentiment_label,
            "score": round(compound, 4),
            "details": scores
        }

    def detect_tone(self, text: str) -> Dict[str, Any]:
        """
        Detects primary and secondary tones based on linguistic marker density.
        """
        text_lower = text.lower()
        words = re.findall(r'\b\w+\b', text_lower)
        total_words = len(words) or 1

        scores = {}
        for tone, markers in self.tone_markers.items():
            matches = sum(1 for m in markers if m in text_lower)
            score = (matches / (len(markers) * 0.5)) * 100
            scores[tone] = min(score, 100.0)

        sorted_tones = sorted(scores.items(), key=lambda item: item[1], reverse=True)
        primary_tone, primary_score = sorted_tones[0]

        # Default fallback if no strong markers are found
        if primary_score < 5.0:
            primary_tone = "informative"
            primary_score = 65.0

        confidence = min(round(primary_score / 100.0, 2), 0.98)
        if confidence < 0.4:
            confidence = 0.65

        return {
            "detected_tone": primary_tone.capitalize(),
            "tone_confidence": confidence,
            "tone_scores": {k.capitalize(): round(v, 2) for k, v in scores.items()}
        }

    def optimize_tone(
        self,
        message_title: str,
        message_body: str,
        campaign_purpose: Optional[str] = None,
        target_tone: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluates tone alignment with campaign purpose and provides optimized text.
        """
        combined_text = f"{message_title} {message_body}"
        sentiment_data = self.analyze_sentiment(combined_text)
        tone_data = self.detect_tone(combined_text)

        purpose_str = (campaign_purpose or "").lower()
        desired = (target_tone or "").lower()

        # Determine target tone if not explicitly passed
        if not desired:
            if "emergency" in purpose_str or "disaster" in purpose_str or "urgent" in purpose_str:
                desired = "urgent"
            elif "health" in purpose_str or "medical" in purpose_str or "safety" in purpose_str:
                desired = "reassuring"
            elif "education" in purpose_str or "student" in purpose_str or "workshop" in purpose_str:
                desired = "friendly"
            else:
                desired = "informative"

        detected_lower = tone_data["detected_tone"].lower()
        is_optimal = detected_lower == desired
        alignment_score = 92.0 if is_optimal else (65.0 if detected_lower in ["informative", "reassuring"] else 45.0)

        suggestions = []
        optimized_body = message_body

        if not is_optimal:
            suggestions.append(
                f"Campaign purpose '{campaign_purpose or 'Public Awareness'}' best matches an '{desired.capitalize()}' tone, while current detected tone is '{tone_data['detected_tone']}'."
            )
            if desired == "urgent":
                suggestions.append("Add clear urgency markers such as specific deadlines, critical advisories, and immediate call-to-actions.")
                if "URGENT" not in optimized_body:
                    optimized_body = "⚠️ URGENT ADVISORY:\n" + optimized_body
            elif desired == "reassuring":
                suggestions.append("Incorporate supportive language emphasizing safety, community care, and accessible preventive assistance.")
                optimized_body = re.sub(r'Attention:|Notice:', 'Dear community members, for your health and well-being:', optimized_body)
            elif desired == "friendly":
                suggestions.append("Use warm, enthusiastic greetings and an encouraging collaborative tone.")
                optimized_body = re.sub(r'Public Announcement to', 'Warm greetings to all', optimized_body)
        else:
            suggestions.append(f"Content tone is well-aligned with the target {desired.capitalize()} profile.")

        return {
            "sentiment": sentiment_data["sentiment"],
            "sentiment_score": sentiment_data["score"],
            "detected_tone": tone_data["detected_tone"],
            "tone_confidence": tone_data["tone_confidence"],
            "tone_alignment_score": alignment_score,
            "is_tone_optimal": is_optimal,
            "target_tone": desired.capitalize(),
            "optimized_body": optimized_body if not is_optimal else None,
            "suggestions": suggestions
        }


sentiment_tone_service = SentimentToneService()
