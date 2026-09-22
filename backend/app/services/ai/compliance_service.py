import re
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)


class ComplianceCheckService:
    def __init__(self):
        # Offensive and harmful keywords
        self.harmful_terms = [
            "hate", "violence", "threat", "kill", "bomb", "fraud", "scam",
            "illegal", "weapon", "abuse", "curse", "harass", "terror", "riot"
        ]

        # Misleading / Unsupported absolute claim phrases
        self.unsupported_claim_phrases = [
            "100% cure guaranteed", "miracle cure", "instant cure", "guaranteed cash",
            "risk-free guaranteed", "completely eliminate disease overnight", "free money for all",
            "secret government loophole", "unlimited returns", "magic remedy"
        ]

        # PII Regex Patterns
        self.pii_patterns = {
            "email_address": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b',
            "phone_number": r'(?:\+91[\-\s]?)?[6789]\d{9}\b',
            "aadhaar_number": r'\b\d{4}\s\d{4}\s\d{4}\b',
            "credit_card": r'\b(?:\d{4}[-\s]?){3}\d{4}\b',
            "password_leak": r'(?:password|secret|pin)\s*[:=]\s*\S+'
        }

    def evaluate_compliance(
        self,
        message_title: str,
        message_body: str,
        short_version: Optional[str] = None,
        call_to_action: Optional[str] = None,
        factual_claims_present: bool = True
    ) -> Dict[str, Any]:
        """
        Executes multi-factor safety, PII detection, hate-speech check, and factual verification status labeling.
        """
        combined_text = f"{message_title or ''} {message_body or ''} {short_version or ''} {call_to_action or ''}"
        text_lower = combined_text.lower()

        issues = []
        pii_detected = []
        suggestions = []
        deductions = 0.0

        # 1. PII Detection Check
        # Note: Official public helpline numbers (like 100, 108, 112, 1800-xxx) or generic emails (info@gov.in) are permissible,
        # but private personal numbers/emails or IDs should be flagged.
        for pii_type, pattern in self.pii_patterns.items():
            matches = re.findall(pattern, combined_text, flags=re.IGNORECASE)
            if matches:
                # Filter out generic toll-free hotlines
                filtered_matches = [m for m in matches if not (str(m).startswith("1800") or str(m).startswith("112") or str(m).startswith("108"))]
                if filtered_matches:
                    for m in filtered_matches:
                        masked = m[:3] + "******" + m[-2:] if len(m) > 5 else "***"
                        pii_detected.append(f"{pii_type}: {masked}")
                    issues.append({
                        "category": "pii",
                        "severity": "high",
                        "description": f"Potential personally identifiable information ({pii_type}) detected in broadcast content.",
                        "matched_term": pii_type
                    })
                    deductions += 25.0
                    suggestions.append("Replace specific private personal contact numbers or identifiers with official institutional portal links or verified public hotlines.")

        # 2. Harmful and Offensive Language Check
        for term in self.harmful_terms:
            if re.search(r'\b' + re.escape(term) + r'\b', text_lower):
                issues.append({
                    "category": "offensive_language",
                    "severity": "critical",
                    "description": f"Potentially sensitive, offensive, or hazardous term '{term}' detected.",
                    "matched_term": term
                })
                deductions += 40.0
                suggestions.append(f"Remove or replace prohibited term '{term}' to maintain community safety standards.")

        # 3. Misleading and Unsupported Superlative Claims Check
        misleading_found = False
        for claim in self.unsupported_claim_phrases:
            if claim in text_lower:
                issues.append({
                    "category": "misleading_claims",
                    "severity": "high",
                    "description": f"Unsupported or unverified absolute guarantee detected: '{claim}'.",
                    "matched_term": claim
                })
                deductions += 30.0
                misleading_found = True
                suggestions.append(f"Remove absolute claims like '{claim}' and cite verified medical, legal, or governmental authorities.")

        # 4. Determine Factual Verification Status
        # Guidelines:
        # - passed: Content uses standard verified public awareness advisories, clear verifiable dates, official links.
        # - warning: Contains unverified claims or strong assertions without authority citations.
        # - unable_to_verify: General subjective awareness without external verification feed.
        if misleading_found:
            factual_status = "warning"
            suggestions.append("Factual verification flagged a WARNING due to unsupported absolute claims.")
        elif any(kw in text_lower for kw in ["health", "safety", "vaccin", "guidelines", "protocol", "awareness", "official"]):
            factual_status = "passed"
        else:
            factual_status = "unable_to_verify"

        final_score = max(0.0, min(100.0, round(100.0 - deductions, 1)))
        passed = final_score >= 70.0 and not any(i["severity"] == "critical" for i in issues)

        if passed and not issues:
            suggestions.append("Content passes all AI compliance and safety screening criteria.")

        return {
            "passed": passed,
            "compliance_score": final_score,
            "factual_verification_status": factual_status,
            "issues": issues,
            "pii_detected": pii_detected,
            "suggestions": suggestions
        }


compliance_check_service = ComplianceCheckService()
