import os
import re
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from models.fact_verification import TrustedSource, FactClaimVerification
from models.campaign import Campaign, CampaignContent

logger = logging.getLogger("fact_verification_service")

# Curated, authoritative baseline reference corpus for Indian public administration, health & disaster response
DEFAULT_TRUSTED_SOURCES = [
    {
        "name": "NDMA — National Disaster Management Authority",
        "url": "https://ndma.gov.in",
        "category": "Disaster Management",
        "description": "Official apex body for disaster risk management and emergency advisories in India.",
        "verified_facts": [
            "National Emergency Helpline number across India is 112.",
            "Disaster Management Helpline is 1070 (State) and 1077 (District).",
            "In flood emergencies, citizens should avoid walking or driving through moving floodwater and move to designated high ground.",
            "Do not touch fallen electric poles, power cables, or submerged transformers during inundation.",
            "Keep an emergency grab-bag with torch, dry rations, first-aid, medications, and vital documents."
        ]
    },
    {
        "name": "MoHFW — Ministry of Health & Family Welfare",
        "url": "https://mohfw.gov.in",
        "category": "Public Health",
        "description": "Official nodal ministry for public health guidelines, disease prevention, and national medical advisories.",
        "verified_facts": [
            "National Health & Ambulance Helpline number across India is 108.",
            "National Health Portal toll-free helpline is 1800-180-1104.",
            "Vector-borne disease prevention requires clearing stagnant water from coolers, tires, and pots weekly.",
            "Boil drinking water or use certified chlorine purification during monsoon and flood advisories.",
            "Ayushman Bharat PM-JAY provides health cover up to ₹5 lakh per eligible family per year."
        ]
    },
    {
        "name": "IMD — India Meteorological Department",
        "url": "https://mausam.imd.gov.in",
        "category": "Weather",
        "description": "Official meteorological agency responsible for weather forecasts, cyclone warnings, and rainfall alerts.",
        "verified_facts": [
            "Red Alert indicates take action for extremely heavy rainfall (>204.4 mm) or severe weather.",
            "Orange Alert indicates be prepared for very heavy rainfall (115.6 to 204.4 mm).",
            "Yellow Alert indicates be aware of localized weather disruption.",
            "Coastal fishermen are advised not to venture into deep sea during cyclone and depression warnings."
        ]
    },
    {
        "name": "Ministry of Agriculture & Farmers Welfare",
        "url": "https://agricoop.gov.in",
        "category": "Government Schemes",
        "description": "Nodal ministry for agricultural policies, Kisan welfare, and crop insurance programs.",
        "verified_facts": [
            "Kisan Call Centre toll-free number is 1800-180-1551.",
            "PM-KISAN provides income support of ₹6,000 per year in three equal installments to eligible farmer families.",
            "Pradhan Mantri Fasal Bima Yojana (PMFBY) covers crop loss due to non-preventable natural risks."
        ]
    }
]


class FactVerificationService:
    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")

    def seed_default_sources(self, db: Session) -> List[TrustedSource]:
        """Seeds official baseline trusted sources if database table is empty."""
        try:
            count = db.query(TrustedSource).count()
            if count == 0:
                created = []
                for src in DEFAULT_TRUSTED_SOURCES:
                    source_obj = TrustedSource(
                        name=src["name"],
                        url=src["url"],
                        category=src["category"],
                        description=src["description"],
                        verification_status="verified",
                        is_active=True,
                        last_checked_at=datetime.now(timezone.utc)
                    )
                    db.add(source_obj)
                    created.append(source_obj)
                db.commit()
                return created
            return db.query(TrustedSource).all()
        except Exception as e:
            logger.error(f"Error seeding trusted sources: {e}")
            db.rollback()
            return []

    def extract_claims(self, title: str, body: str, key_info: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Extracts verifiable factual statements, dates, figures, helplines, scheme details,
        and safety directives from campaign text.
        """
        full_text = f"{title}. {body}. {key_info or ''}".strip()
        sentences = [s.strip() for s in re.split(r'[.!?\n]+', full_text) if len(s.strip()) > 10]
        
        extracted_claims = []
        seen_texts = set()

        # Regular expression patterns for claim classification
        phone_pattern = r'(\b(?:112|108|1070|1077|100|101|102|104|1091|1800[\d\-]{4,10}|\+?91[\d\-\s]{10,12})\b)'
        date_pattern = r'(\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|today|tomorrow|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b)'
        money_pattern = r'(\b(?:₹|rs\.?|inr|lakh|crore|\d+\s*(?:percent|%))\b)'
        emergency_words = {"evacuate", "flood", "cyclone", "danger", "warning", "alert", "rescue", "shelter", "quarantine", "inundation", "landslide"}
        medical_words = {"vaccine", "dose", "disease", "infection", "symptoms", "boil water", "treatment", "hospital", "clinic", "fever", "dengue", "malaria"}
        scheme_words = {"yojana", "scheme", "eligibility", "benefit", "subsidy", "registration", "pm-kisan", "pm-jay", "ayushman"}

        for sentence in sentences:
            if sentence.lower() in seen_texts:
                continue

            category = "General Advisory"
            requires_human_review = False
            
            has_phone = bool(re.search(phone_pattern, sentence, re.IGNORECASE))
            has_date = bool(re.search(date_pattern, sentence, re.IGNORECASE))
            has_money = bool(re.search(money_pattern, sentence, re.IGNORECASE))
            
            words_lower = set(re.findall(r'\b\w+\b', sentence.lower()))
            
            if has_phone or "helpline" in sentence.lower() or "emergency contact" in sentence.lower():
                category = "Emergency Helpline"
                requires_human_review = True
            elif words_lower & emergency_words or "evacuation" in sentence.lower():
                category = "Weather & Hazard Warning"
                requires_human_review = True
            elif words_lower & medical_words:
                category = "Public Health"
                requires_human_review = True
            elif words_lower & scheme_words or has_money:
                category = "Government Scheme Eligibility"
                requires_human_review = True
            elif has_date or "deadline" in sentence.lower() or "timings" in sentence.lower():
                category = "Dates & Deadlines"
            elif any(w in sentence.lower() for w in ["sector", "camp", "center", "river", "coastal", "district", "city"]):
                category = "Location Directive"
            else:
                # Only include sentences that make a distinct assertion
                if len(sentence.split()) < 4:
                    continue
                category = "General Fact"

            seen_texts.add(sentence.lower())
            extracted_claims.append({
                "claim_text": sentence,
                "claim_category": category,
                "requires_human_review": requires_human_review
            })

        if not extracted_claims and full_text:
            if title and len(title.strip()) > 3:
                extracted_claims.append({
                    "claim_text": title.strip(),
                    "claim_category": "General Advisory",
                    "requires_human_review": False
                })
            if body and len(body.strip()) > 3:
                extracted_claims.append({
                    "claim_text": body.strip()[:250],
                    "claim_category": "Public Advisory Fact",
                    "requires_human_review": False
                })

        return extracted_claims

    def verify_claim(self, claim_text: str, category: str, db: Optional[Session] = None) -> Dict[str, Any]:
        """
        Compares an extracted claim against authoritative trusted sources.
        Safety Rule: If verified evidence is unavailable, returns 'Insufficient Evidence'.
        Emergency, medical, and policy claims require human review.
        """
        self.seed_default_sources(db) if db else None
        
        # Build reference pool from default verified knowledge & active DB trusted sources
        reference_items = []
        for src in DEFAULT_TRUSTED_SOURCES:
            for fact in src["verified_facts"]:
                reference_items.append({
                    "fact": fact,
                    "source_name": src["name"],
                    "source_url": src["url"],
                    "category": src["category"]
                })

        if db:
            db_sources = db.query(TrustedSource).filter(TrustedSource.is_active == True).all()
            for s in db_sources:
                if s.description:
                    reference_items.append({
                        "fact": s.description,
                        "source_name": s.name,
                        "source_url": s.url,
                        "category": s.category
                    })

        claim_clean = claim_text.strip().lower()
        claim_words = set(re.findall(r'\b\w{3,}\b', claim_clean))

        best_match = None
        best_score = 0.0

        # Semantic word-overlap & keyword matching against trusted facts
        for ref in reference_items:
            fact_words = set(re.findall(r'\b\w{3,}\b', ref["fact"].lower()))
            if not fact_words:
                continue
            
            overlap = len(claim_words & fact_words)
            overlap_ratio = overlap / max(len(claim_words), 1)

            # Check specific entity matches (phone numbers, scheme names)
            phone_in_claim = re.findall(r'\b(?:\d{3,5}|1800[\d\-]+|\+?91[\d\-\s]{10})\b', claim_text)
            phone_in_ref = re.findall(r'\b(?:\d{3,5}|1800[\d\-]+|\+?91[\d\-\s]{10})\b', ref["fact"])
            
            if phone_in_claim and phone_in_ref:
                if set(phone_in_claim) == set(phone_in_ref):
                    overlap_ratio += 0.5
                elif overlap_ratio > 0.20:
                    # Mismatched phone numbers on matching topic -> Direct Contradiction
                    return {
                        "status": "Contradicted",
                        "confidence_score": 92.0,
                        "evidence_summary": f"Official records indicate helpline is {', '.join(phone_in_ref)}, whereas claim states {', '.join(phone_in_claim)}.",
                        "source_name": ref["source_name"],
                        "source_url": ref["source_url"],
                        "requires_human_review": True
                    }

            if overlap_ratio > best_score:
                best_score = overlap_ratio
                best_match = ref

        # Evaluate match thresholds
        if best_match and best_score >= 0.40:
            confidence = min(98.0, round(best_score * 100, 1))
            status = "Supported"
            evidence = f"Corroborated by {best_match['source_name']}: \"{best_match['fact']}\""
            requires_human_review = category in ["Emergency Helpline", "Public Health", "Weather & Hazard Warning", "Government Scheme Eligibility"]
            return {
                "status": status,
                "confidence_score": confidence,
                "evidence_summary": evidence,
                "source_name": best_match["source_name"],
                "source_url": best_match["source_url"],
                "requires_human_review": requires_human_review
            }
        else:
            # Insufficient Evidence / Needs Human Review
            requires_human = category in ["Emergency Helpline", "Public Health", "Weather & Hazard Warning", "Government Scheme Eligibility"]
            status = "Needs Human Review" if requires_human else "Insufficient Evidence"
            return {
                "status": status,
                "confidence_score": round(max(10.0, best_score * 50), 1),
                "evidence_summary": "No conclusive direct matching evidence found in active official registry. Human verification mandatory prior to mass public dispatch.",
                "source_name": "Official Registry Verification Required",
                "source_url": "https://ndma.gov.in",
                "requires_human_review": True
            }

    def verify_campaign(
        self,
        title: str,
        body: str,
        key_info: Optional[str] = None,
        campaign_id: Optional[int] = None,
        content_id: Optional[int] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Full end-to-end verification pipeline:
        Extract Claims -> Query Trusted Evidence -> Assign Status & Confidence -> Persist to DB.
        """
        extracted = self.extract_claims(title, body, key_info)
        results = []
        overall_supported = 0
        overall_needs_review = 0
        overall_contradicted = 0
        overall_insufficient = 0

        for item in extracted:
            verification = self.verify_claim(item["claim_text"], item["claim_category"], db)
            status = verification["status"]

            if status == "Supported":
                overall_supported += 1
            elif status == "Contradicted":
                overall_contradicted += 1
            elif status == "Needs Human Review":
                overall_needs_review += 1
            else:
                overall_insufficient += 1

            claim_record_id = None
            if db:
                try:
                    # Find trusted source ID if matched
                    matched_src = None
                    if verification.get("source_name"):
                        matched_src = db.query(TrustedSource).filter(TrustedSource.name == verification["source_name"]).first()

                    claim_obj = FactClaimVerification(
                        campaign_id=campaign_id,
                        content_id=content_id,
                        trusted_source_id=matched_src.id if matched_src else None,
                        claim_text=item["claim_text"],
                        claim_category=item["claim_category"],
                        status=status,
                        evidence_summary=verification["evidence_summary"],
                        source_name=verification["source_name"],
                        source_url=verification["source_url"],
                        confidence_score=verification["confidence_score"],
                        requires_human_review=verification["requires_human_review"],
                        reviewer_decision="Pending"
                    )
                    db.add(claim_obj)
                    db.commit()
                    db.refresh(claim_obj)
                    claim_record_id = claim_obj.id
                except Exception as e:
                    logger.error(f"Error persisting fact claim verification: {e}")
                    db.rollback()

            results.append({
                "id": claim_record_id,
                "claim_text": item["claim_text"],
                "claim_category": item["claim_category"],
                "status": status,
                "evidence_summary": verification["evidence_summary"],
                "source_name": verification["source_name"],
                "source_url": verification["source_url"],
                "confidence_score": verification["confidence_score"],
                "requires_human_review": verification["requires_human_review"],
                "reviewer_decision": "Pending",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })

        # Overall Campaign Verification Status
        if overall_contradicted > 0:
            campaign_verdict = "Contradicted"
            can_publish = False
        elif overall_needs_review > 0:
            campaign_verdict = "Needs Human Review"
            can_publish = False
        elif overall_insufficient > 0 and overall_supported == 0:
            campaign_verdict = "Insufficient Evidence"
            can_publish = False
        else:
            campaign_verdict = "Supported"
            can_publish = True

        return {
            "campaign_id": campaign_id,
            "overall_status": campaign_verdict,
            "can_auto_publish": can_publish,
            "total_claims": len(results),
            "supported_count": overall_supported,
            "contradicted_count": overall_contradicted,
            "needs_review_count": overall_needs_review,
            "insufficient_count": overall_insufficient,
            "claims": results
        }

    def review_claim(
        self,
        claim_id: int,
        decision: str,  # Approved, Rejected, Overridden
        notes: Optional[str],
        admin_id: Optional[int],
        db: Session
    ) -> Dict[str, Any]:
        """
        Records an official human reviewer approval or rejection of a flagged claim.
        """
        claim = db.query(FactClaimVerification).filter(FactClaimVerification.id == claim_id).first()
        if not claim:
            raise ValueError(f"Fact claim verification with ID {claim_id} not found.")

        claim.reviewer_decision = decision
        claim.reviewer_notes = notes
        claim.reviewed_by_admin_id = admin_id
        claim.reviewed_at = datetime.now(timezone.utc)
        
        if decision == "Approved":
            claim.status = "Supported"
            claim.requires_human_review = False
        elif decision == "Rejected":
            claim.status = "Contradicted"
            claim.requires_human_review = False

        db.commit()
        db.refresh(claim)

        return {
            "id": claim.id,
            "claim_text": claim.claim_text,
            "status": claim.status,
            "reviewer_decision": claim.reviewer_decision,
            "reviewer_notes": claim.reviewer_notes,
            "reviewed_at": claim.reviewed_at.isoformat() if claim.reviewed_at else None
        }


fact_verification_service = FactVerificationService()
