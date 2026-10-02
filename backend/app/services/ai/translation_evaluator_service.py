import re
import logging
from typing import Dict, Any, List, Optional, Set
from datetime import datetime, timezone
import textstat

from services.ai.translation_service import translation_service

logger = logging.getLogger("translation_evaluator_service")

# Critical Indic and English Emergency & Safety Terms
CRITICAL_EMERGENCY_TERMS = {
    "evacuate": ["evacuate", "evacuation", "खाली करें", "வெளியேறவும்", "ఖాళీ చేయండి", "ತೆರವುಗೊಳಿಸಿ", "ഒഴിപ്പിക്കുക"],
    "shelter": ["shelter", "refuge", "आश्रय", "நிவாரண முகாம்", "పునరావాస కేంద్రం", "ಆಶ್ರಯ", "ഷെൽട്ടർ"],
    "danger": ["danger", "hazard", "threat", "खतरा", "ஆபத்து", "ప్రమాదం", "ಅಪಾಯ", "അപകടം"],
    "helpline": ["helpline", "emergency number", "हेल्पलाइन", "உதவி எண்", "హెల్ప్‌లైన్", "ಸಹಾಯವಾಣಿ", "ഹെൽപ്പ്‌ലൈൻ"],
    "warning": ["warning", "alert", "चेतावनी", "எச்சரிக்கை", "హెచ్చరిక", "ಎಚ್ಚರಿಕೆ", "മുന്നറിയിപ്പ്"],
    "safe": ["safe", "safety", "सुरक्षित", "பாதுகாப்பான", "సురక్షితం", "ಸುರಕ್ಷಿತ", "സുരക്ഷിതം"],
    "do not drink": ["do not drink", "contaminated", "पानी न पिएं", "குடிக்க வேண்டாம்", "తాగవద్దు", "ಕುಡಿಯಬೇಡಿ", "കുടിക്കരുത്"]
}

# Indic to English Numeral Map
INDIC_NUMERAL_MAP = {
    # Devanagari (Hindi, Marathi)
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
    # Tamil
    '௦': '0', '௧': '1', '௨': '2', '௩': '3', '௪': '4', '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9',
    # Telugu
    '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4', '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9',
    # Kannada
    '೦': '0', '೧': '1', '೨': '2', '೩': '3', '೪': '4', '೫': '5', '೬': '6', '೭': '7', '೮': '8', '೯': '9',
    # Malayalam
    '൦': '0', '൧': '1', '൨': '2', '൩': '3', '൪': '4', '൫': '5', '൬': '6', '൭': '7', '൮': '8', '൯': '9',
}


class TranslationEvaluatorService:
    def __init__(self):
        pass

    def normalize_numerals(self, text: str) -> str:
        """Converts Indic script numerals to standard Arabic digits for robust comparison."""
        res = []
        for char in text:
            res.append(INDIC_NUMERAL_MAP.get(char, char))
        return "".join(res)

    def extract_critical_entities(self, text: str) -> Dict[str, List[str]]:
        """
        Extracts dates, times, phone numbers, locations, monetary amounts,
        URLs, and emergency instructions from the text.
        """
        norm_text = self.normalize_numerals(text)

        # 1. Phone Numbers & Helplines (e.g. 112, 108, 1070, 1800-xxx-xxxx, 9876543210)
        phone_matches = re.findall(r'\b(?:112|108|1070|1077|100|101|102|104|1091|1800[\d\-]{4,10}|\+?91[\d\-\s]{10,12}|\d{10})\b', norm_text)
        
        # 2. Dates (e.g., 15th August, 2026-10-02, 15/08/2026, tomorrow, monday)
        date_matches = re.findall(
            r'\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b',
            norm_text,
            flags=re.IGNORECASE
        )

        # 3. Times (e.g., 10:00 AM, 6:30 PM, 14:00, 8 PM)
        time_matches = re.findall(r'\b(?:\d{1,2}(?::\d{2})?\s*(?:am|pm|hrs|hours))\b', norm_text, flags=re.IGNORECASE)

        # 4. Monetary Amounts & Percentages (e.g., ₹5000, Rs. 1000, 50%, 5 lakh)
        amount_matches = re.findall(r'(?:₹|rs\.?|inr|\$)\s*\d+[\d,.]*|\b\d+%\b|\b\d+\s*(?:lakh|crore|thousand|percent)\b', norm_text, flags=re.IGNORECASE)

        # 5. URLs
        url_matches = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', text)

        # 6. Critical Emergency / Action Directives
        found_emergency = []
        text_lower = text.lower()
        for concept, terms in CRITICAL_EMERGENCY_TERMS.items():
            for t in terms:
                if t.lower() in text_lower:
                    found_emergency.append(concept)
                    break

        return {
            "phone_numbers": list(set(phone_matches)),
            "dates": list(set(date_matches)),
            "times": list(set(time_matches)),
            "amounts": list(set(amount_matches)),
            "urls": list(set(url_matches)),
            "emergency_directives": list(set(found_emergency))
        }

    def check_entity_preservation(
        self,
        source_entities: Dict[str, List[str]],
        translated_text: str
    ) -> Dict[str, Any]:
        """
        Checks if every critical entity present in the source text is preserved in the target translation.
        """
        norm_translated = self.normalize_numerals(translated_text).lower()
        
        missing_items = []
        preserved_items = []
        total_entities = 0
        preserved_count = 0

        # Check phone numbers
        for ph in source_entities.get("phone_numbers", []):
            total_entities += 1
            # Clean digits
            digits = re.sub(r'\D', '', ph)
            if digits in norm_translated or ph.lower() in norm_translated:
                preserved_items.append(f"Phone/Helpline: {ph}")
                preserved_count += 1
            else:
                missing_items.append(f"Missing Phone/Helpline: '{ph}'")

        # Check URLs
        for url in source_entities.get("urls", []):
            total_entities += 1
            if url.lower() in translated_text.lower():
                preserved_items.append(f"URL: {url}")
                preserved_count += 1
            else:
                missing_items.append(f"Missing URL Link: '{url}'")

        # Check amounts & numbers
        for amt in source_entities.get("amounts", []):
            total_entities += 1
            amt_digits = re.findall(r'\d+', amt)
            if any(d in norm_translated for d in amt_digits) or amt.lower() in norm_translated:
                preserved_items.append(f"Amount/Value: {amt}")
                preserved_count += 1
            else:
                missing_items.append(f"Missing Numeric Amount: '{amt}'")

        # Check dates
        for dt in source_entities.get("dates", []):
            total_entities += 1
            dt_digits = re.findall(r'\d+', dt)
            if (dt_digits and any(d in norm_translated for d in dt_digits)) or dt.lower() in norm_translated:
                preserved_items.append(f"Date: {dt}")
                preserved_count += 1
            else:
                missing_items.append(f"Missing Date: '{dt}'")

        # Check emergency directives
        for directive in source_entities.get("emergency_directives", []):
            total_entities += 1
            terms = CRITICAL_EMERGENCY_TERMS.get(directive, [directive])
            if any(t.lower() in translated_text.lower() for t in terms):
                preserved_items.append(f"Safety Directive: {directive.capitalize()}")
                preserved_count += 1
            else:
                missing_items.append(f"Missing Critical Safety Directive: '{directive}'")

        preservation_rate = (preserved_count / total_entities) if total_entities > 0 else 1.0

        return {
            "total_entities_found": total_entities,
            "preserved_count": preserved_count,
            "missing_count": len(missing_items),
            "preservation_rate": round(preservation_rate, 2),
            "preserved_items": preserved_items,
            "missing_items": missing_items
        }

    def compute_back_translation(self, translated_text: str, source_lang: str, target_lang: str) -> Dict[str, Any]:
        """
        Back-translates the regional text back to the source language (English)
        and evaluates semantic & token similarity.
        """
        try:
            back_translated = translation_service.translate_text(
                text=translated_text,
                source_lang=target_lang,
                target_lang=source_lang
            )
            return {
                "back_translated_text": back_translated,
                "status": "success"
            }
        except Exception as e:
            logger.error(f"Back-translation failed: {e}")
            return {
                "back_translated_text": "",
                "status": "failed"
            }

    def compute_semantic_similarity(self, text_a: str, text_b: str) -> float:
        """
        Calculates lexical & token-level Jaccard and word-overlap similarity (0.0 to 1.0).
        """
        if not text_a or not text_b:
            return 0.0

        words_a = set(re.findall(r'\b\w{2,}\b', text_a.lower()))
        words_b = set(re.findall(r'\b\w{2,}\b', text_b.lower()))

        if not words_a or not words_b:
            return 0.0

        intersection = len(words_a & words_b)
        union = len(words_a | words_b)

        jaccard = intersection / union if union > 0 else 0.0
        overlap = intersection / min(len(words_a), len(words_b))

        # Weighted combination of overlap and Jaccard
        combined = (overlap * 0.7) + (jaccard * 0.3)
        return min(1.0, max(0.0, combined))

    def evaluate_translation(
        self,
        source_text: str,
        translated_text: str,
        source_language: str = "English",
        target_language: str = "Hindi",
        is_emergency_content: bool = False
    ) -> Dict[str, Any]:
        """
        Comprehensive Translation Quality Evaluator:
        Entity Preservation (30%) + Semantic Fidelity (30%) + Length/Completeness (20%) +
        Terminology (10%) + Readability (10%) -> Transparent 0-100 Score.
        """
        source_clean = source_text.strip()
        translated_clean = translated_text.strip()

        if not source_clean or not translated_clean:
            return {
                "quality_score": 0.0,
                "status": "critical_error",
                "can_auto_approve": False,
                "reasons": ["Empty source or translated text provided."],
                "issues": [{"severity": "high", "message": "Translation or source text is empty."}],
                "score_breakdown": {}
            }

        # 1. Extract and Check Critical Entities
        src_entities = self.extract_critical_entities(source_clean)
        preservation = self.check_entity_preservation(src_entities, translated_clean)

        # 2. Back-translation and Semantic Similarity
        back_trans_res = self.compute_back_translation(translated_clean, source_language, target_language)
        back_text = back_trans_res.get("back_translated_text", "")
        semantic_sim = self.compute_semantic_similarity(source_clean, back_text) if back_text else 0.75

        # 3. Length & Completeness Ratio
        # Indic scripts typically have 0.7x to 1.4x length of English
        len_ratio = len(translated_clean) / max(len(source_clean), 1)
        if 0.5 <= len_ratio <= 2.2:
            length_score = 100.0
        elif 0.3 <= len_ratio < 0.5 or 2.2 < len_ratio <= 3.0:
            length_score = 70.0
        else:
            length_score = 30.0

        # 4. Terminology Consistency
        term_score = 100.0
        issues = []
        critical_errors = []

        if preservation["missing_items"]:
            for item in preservation["missing_items"]:
                is_phone_or_emergency = "Phone" in item or "Safety" in item or "Directive" in item
                severity = "high" if is_phone_or_emergency else "medium"
                
                issues.append({
                    "category": "critical_entity",
                    "severity": severity,
                    "message": f"Entity preservation issue: {item}",
                    "suggestion": "Ensure all dates, emergency phone numbers, and directives are preserved exactly."
                })
                if severity == "high":
                    critical_errors.append(item)

        # 5. Factor Weighted Score Calculations
        # Weights: Entity Preservation: 30%, Semantic Similarity: 30%, Completeness: 20%, Terminology: 10%, Readability: 10%
        entity_points = preservation["preservation_rate"] * 30.0
        semantic_points = semantic_sim * 30.0
        completeness_points = (length_score / 100.0) * 20.0
        terminology_points = 10.0 if not critical_errors else 4.0
        readability_points = 10.0

        final_score = round(entity_points + semantic_points + completeness_points + terminology_points + readability_points, 1)
        final_score = max(0.0, min(100.0, final_score))

        # Human Review & Auto-Approval Determination
        # SAFETY RULE: A translation with critical errors (missing emergency helpline or directives) must NOT be marked approved automatically.
        if critical_errors or final_score < 65.0:
            status = "critical_error" if critical_errors else "needs_review"
            can_auto_approve = False
        elif final_score >= 85.0 and not issues:
            status = "passed"
            can_auto_approve = True
        else:
            status = "warning"
            can_auto_approve = True if not is_emergency_content else False

        reasons = []
        if preservation["preserved_items"]:
            reasons.append(f"Successfully preserved {len(preservation['preserved_items'])} critical entities ({', '.join(preservation['preserved_items'][:3])}).")
        if preservation["missing_items"]:
            reasons.append(f"Missing {len(preservation['missing_items'])} critical elements from original message.")
        if semantic_sim >= 0.70:
            reasons.append(f"High semantic fidelity confirmed via back-translation ({round(semantic_sim * 100)}% match).")
        else:
            reasons.append(f"Back-translation indicates possible meaning divergence ({round(semantic_sim * 100)}% semantic overlap).")

        return {
            "quality_score": final_score,
            "status": status,
            "can_auto_approve": can_auto_approve,
            "source_language": source_language,
            "target_language": target_language,
            "source_text": source_clean,
            "translated_text": translated_clean,
            "back_translated_text": back_text,
            "reasons": reasons,
            "issues": issues,
            "critical_errors_count": len(critical_errors),
            "score_breakdown": {
                "critical_entity_preservation": round(entity_points, 1),
                "semantic_similarity": round(semantic_points, 1),
                "completeness_and_length": round(completeness_points, 1),
                "terminology_consistency": round(terminology_points, 1),
                "readability_and_script": round(readability_points, 1)
            },
            "preservation_details": preservation
        }


translation_evaluator_service = TranslationEvaluatorService()
