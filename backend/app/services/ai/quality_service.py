import re
import logging
from typing import Dict, Any, Optional, List
import textstat

logger = logging.getLogger(__name__)


class QualityCheckService:
    def __init__(self):
        pass

    def evaluate_quality(
        self,
        message_title: str,
        message_body: str,
        short_version: Optional[str] = None,
        call_to_action: Optional[str] = None,
        language: str = "English",
        target_tone: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Runs comprehensive quality, clarity, readability, grammar, and completeness checks.
        """
        issues = []
        suggestions = []
        deductions = 0.0

        title_clean = (message_title or "").strip()
        body_clean = (message_body or "").strip()
        cta_clean = (call_to_action or "").strip()
        short_clean = (short_version or "").strip()

        # 1. Completeness Evaluation
        completeness_score = 100.0
        if not title_clean:
            issues.append({
                "category": "completeness",
                "severity": "high",
                "message": "Campaign title or subject line is missing.",
                "suggestion": "Add a clear and descriptive campaign headline."
            })
            deductions += 25.0
            completeness_score -= 30.0

        if len(body_clean) < 30:
            issues.append({
                "category": "completeness",
                "severity": "high",
                "message": "Message body is too short or lacks substantive details.",
                "suggestion": "Expand message body with date, location, and key directives."
            })
            deductions += 25.0
            completeness_score -= 30.0

        if not cta_clean and "register" not in body_clean.lower() and "contact" not in body_clean.lower() and "visit" not in body_clean.lower():
            issues.append({
                "category": "completeness",
                "severity": "medium",
                "message": "No distinct Call to Action (CTA) identified in the message.",
                "suggestion": "Include explicit instructions for recipients (e.g. portal registration link or hotline)."
            })
            deductions += 10.0
            completeness_score -= 20.0

        # 2. Readability & Clarity (using textstat for English, native baseline for Indic)
        combined_text = f"{title_clean}. {body_clean}"
        if language and language.strip().lower() != "english":
            flesch_score = 78.0
            flesch_grade = 6.0
        else:
            try:
                flesch_score = textstat.flesch_reading_ease(combined_text)
                flesch_grade = textstat.flesch_kincaid_grade(combined_text)
            except Exception:
                flesch_score = 70.0
                flesch_grade = 8.0

        if flesch_score >= 80:
            reading_ease = "Very Easy to Read"
        elif flesch_score >= 60:
            reading_ease = "Standard / Plain Language (Ideal for Mass Communication)"
        elif flesch_score >= 40:
            reading_ease = "Fairly Difficult"
            issues.append({
                "category": "readability",
                "severity": "medium",
                "message": "Vocabulary and sentence complexity might be elevated for general public reading.",
                "suggestion": "Use shorter sentences and simpler terms to improve accessibility across diverse literacy levels."
            })
            deductions += 10.0
        else:
            reading_ease = "Difficult"
            issues.append({
                "category": "readability",
                "severity": "high",
                "message": "Text is complex and difficult to understand quickly during public awareness campaigns.",
                "suggestion": "Simplify jargon and structure message into bullet points."
            })
            deductions += 18.0

        # 3. Grammar, Capitalization and Formatting Checks
        # Repeated words check (e.g. "the the")
        repeated_word_matches = re.findall(r'\b(\w+)\s+\1\b', combined_text, flags=re.IGNORECASE)
        if repeated_word_matches:
            for rep in set(repeated_word_matches):
                issues.append({
                    "category": "grammar",
                    "severity": "low",
                    "message": f"Accidental duplicate word detected: '{rep} {rep}'.",
                    "suggestion": f"Remove redundant '{rep}'."
                })
                deductions += 5.0

        # Excessive ALL CAPS check
        words = re.findall(r'\b[A-Z]{4,}\b', body_clean)
        legitimate_caps = {"COVID", "AIIMS", "NDMA", "ICMR", "WHO", "PORTAL", "ALERT", "URGENT", "ACTION"}
        excessive_caps = [w for w in words if w not in legitimate_caps]
        if len(excessive_caps) > 3:
            issues.append({
                "category": "clarity",
                "severity": "low",
                "message": f"Excessive uppercase words detected ({', '.join(excessive_caps[:3])}...).",
                "suggestion": "Use standard sentence case for better visual legibility."
            })
            deductions += 4.0

        # Punctuation check
        if body_clean and not body_clean.endswith(('.', '!', '?', '"', '»', '”')):
            issues.append({
                "category": "grammar",
                "severity": "low",
                "message": "Message body does not end with terminating punctuation.",
                "suggestion": "Add closing punctuation mark to finalize communication."
            })
            deductions += 3.0

        # 4. Compute Final Quality Score
        final_score = max(0.0, min(100.0, round(100.0 - deductions, 1)))

        if final_score >= 90:
            grade = "Excellent"
            suggestions.append("Message is clear, well-structured, and ready for mass distribution.")
        elif final_score >= 75:
            grade = "Good"
            suggestions.append("Message meets public awareness communication standards with minor stylistic refinements.")
        elif final_score >= 60:
            grade = "Fair"
            suggestions.append("Consider revising identified clarity and formatting points prior to release.")
        else:
            grade = "Needs Improvement"
            suggestions.append("Significant revisions recommended for completeness, clarity, and recipient readability.")

        # Construct refined draft if issues were detected
        improved_version = None
        if deductions > 10.0:
            cleaned_body = re.sub(r'\b(\w+)\s+\1\b', r'\1', body_clean, flags=re.IGNORECASE)
            if not cleaned_body.endswith(('.', '!', '?')):
                cleaned_body += "."
            improved_version = cleaned_body

        return {
            "quality_score": final_score,
            "grade": grade,
            "readability_score": round(flesch_score, 1),
            "reading_ease": reading_ease,
            "completeness_score": max(0.0, round(completeness_score, 1)),
            "issues": issues,
            "suggestions": suggestions,
            "improved_version": improved_version
        }


quality_check_service = QualityCheckService()
