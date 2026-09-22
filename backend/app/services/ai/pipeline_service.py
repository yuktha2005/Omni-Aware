import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from models.campaign import Campaign, CampaignContent
from services.ai.content_generator import content_generator_service
from services.ai.translation_service import translation_service, LANGUAGE_NAME_MAP
from services.ai.personalization_service import personalization_service
from services.ai.sentiment_service import sentiment_tone_service
from services.ai.quality_service import quality_check_service
from services.ai.compliance_service import compliance_check_service

logger = logging.getLogger(__name__)


class ContentPipelineService:
    def __init__(self):
        pass

    def run_pipeline(
        self,
        campaign_title: str,
        purpose: str,
        target_audience: str = "General Public",
        key_information: str = "",
        desired_language: str = "English",
        desired_tone: str = "Informative",
        communication_channel: str = "All",
        optional_instructions: Optional[str] = None,
        target_languages: Optional[List[str]] = None,
        audience_roles: Optional[List[str]] = None,
        db: Optional[Session] = None,
        admin_id: Optional[int] = None,
        save_to_db: bool = True
    ) -> Dict[str, Any]:
        """
        Executes the end-to-end Milestone 2 AI Multilingual Pipeline.
        """
        if target_languages is None:
            target_languages = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam"]

        # Normalize and deduplicate audience roles
        if audience_roles is None or len(audience_roles) == 0:
            active_roles = [target_audience if target_audience else "General Public"]
        else:
            # Preserve user provided list uniquely
            seen = set()
            active_roles = []
            for r in audience_roles:
                r_clean = r.strip()
                if r_clean and r_clean.lower() not in seen:
                    seen.add(r_clean.lower())
                    active_roles.append(r_clean)

        # ------------------------------------------------------------------
        # Step 1: AI Content Generation (Base message)
        # ------------------------------------------------------------------
        base_content = content_generator_service.generate_content(
            campaign_title=campaign_title,
            purpose=purpose,
            target_audience=target_audience,
            key_information=key_information,
            desired_language=desired_language,
            desired_tone=desired_tone,
            communication_channel=communication_channel,
            optional_instructions=optional_instructions
        )

        # ------------------------------------------------------------------
        # Step 2: Database Campaign Record Initialization (if save_to_db)
        # ------------------------------------------------------------------
        campaign_record = None
        if save_to_db and db is not None:
            campaign_record = Campaign(
                title=campaign_title,
                purpose=purpose,
                target_audience=target_audience,
                key_information=key_information,
                desired_language=desired_language,
                desired_tone=desired_tone,
                communication_channel=communication_channel,
                optional_instructions=optional_instructions,
                status="processing",
                created_by_admin_id=admin_id
            )
            db.add(campaign_record)
            db.commit()
            db.refresh(campaign_record)

        # ------------------------------------------------------------------
        # Step 3: Audience Personalization & Multilingual Matrix Processing
        # ------------------------------------------------------------------
        processed_items: List[Dict[str, Any]] = []

        for role in active_roles:
            # Personalize base English content for the given role
            personalized_base = personalization_service.personalize_content(
                message_title=base_content["message_title"],
                message_body=base_content["message_body"],
                short_version=base_content["short_version"],
                call_to_action=base_content["call_to_action"],
                audience_role=role,
                language="English"
            )

            # --------------------------------------------------------------
            # Step 4: Multilingual Translation across target Indian languages
            # --------------------------------------------------------------
            translations_map = translation_service.translate_campaign_content(
                message_title=personalized_base["personalized_title"],
                message_body=personalized_base["personalized_body"],
                short_version=personalized_base["personalized_short_version"],
                call_to_action=personalized_base["personalized_call_to_action"],
                source_language="English",
                target_languages=target_languages
            )

            for lang_name, trans_data in translations_map.items():
                cur_title = trans_data["message_title"]
                cur_body = trans_data["message_body"]
                cur_short = trans_data["short_version"]
                cur_cta = trans_data["call_to_action"]

                # ----------------------------------------------------------
                # Step 5: Sentiment and Tone Optimization
                # ----------------------------------------------------------
                tone_eval = sentiment_tone_service.optimize_tone(
                    message_title=cur_title,
                    message_body=cur_body,
                    campaign_purpose=purpose,
                    target_tone=desired_tone
                )

                # ----------------------------------------------------------
                # Step 6: AI Quality Check
                # ----------------------------------------------------------
                quality_eval = quality_check_service.evaluate_quality(
                    message_title=cur_title,
                    message_body=cur_body,
                    short_version=cur_short,
                    call_to_action=cur_cta,
                    language=lang_name,
                    target_tone=desired_tone
                )

                # ----------------------------------------------------------
                # Step 7: AI Compliance & Safety Check
                # ----------------------------------------------------------
                compliance_eval = compliance_check_service.evaluate_compliance(
                    message_title=cur_title,
                    message_body=cur_body,
                    short_version=cur_short,
                    call_to_action=cur_cta
                )

                # Determine final distribution readiness status
                if compliance_eval["passed"] and quality_eval["quality_score"] >= 60.0:
                    item_status = "ready_for_distribution"
                elif not compliance_eval["passed"]:
                    item_status = "compliance_flagged"
                else:
                    item_status = "needs_revision"

                # ----------------------------------------------------------
                # Step 8: Persistence in PostgreSQL (if save_to_db)
                # ----------------------------------------------------------
                content_row = None
                if save_to_db and db is not None and campaign_record is not None:
                    content_row = CampaignContent(
                        campaign_id=campaign_record.id,
                        language=lang_name,
                        language_code=trans_data["language_code"],
                        message_title=cur_title,
                        message_body=cur_body,
                        short_version=cur_short,
                        call_to_action=cur_cta,
                        audience_role=role,
                        is_personalized=(role.lower() != "general public"),
                        personalization_details={
                            "applied_rules": personalized_base["personalization_applied"],
                            "audience_role": role
                        },
                        sentiment=tone_eval["sentiment"],
                        sentiment_score=tone_eval["sentiment_score"],
                        detected_tone=tone_eval["detected_tone"],
                        tone_improved=not tone_eval["is_tone_optimal"],
                        quality_score=quality_eval["quality_score"],
                        quality_details=quality_eval,
                        compliance_passed=compliance_eval["passed"],
                        compliance_score=compliance_eval["compliance_score"],
                        compliance_details=compliance_eval,
                        factual_status=compliance_eval["factual_verification_status"],
                        status=item_status
                    )
                    db.add(content_row)

                processed_items.append({
                    "language": lang_name,
                    "language_code": trans_data["language_code"],
                    "audience_role": role,
                    "message_title": cur_title,
                    "message_body": cur_body,
                    "short_version": cur_short,
                    "call_to_action": cur_cta,
                    "sentiment": tone_eval["sentiment"],
                    "sentiment_score": tone_eval["sentiment_score"],
                    "detected_tone": tone_eval["detected_tone"],
                    "quality_score": quality_eval["quality_score"],
                    "compliance_passed": compliance_eval["passed"],
                    "compliance_score": compliance_eval["compliance_score"],
                    "factual_verification_status": compliance_eval["factual_verification_status"],
                    "status": item_status,
                    "db_row": content_row
                })

        # Update campaign overall status and commit all contents atomically
        if save_to_db and db is not None and campaign_record is not None:
            all_ready = all(i["status"] == "ready_for_distribution" for i in processed_items)
            campaign_record.status = "ready_for_distribution" if all_ready else "partially_ready"
            db.commit()
            for item in processed_items:
                if item.get("db_row") is not None:
                    db.refresh(item["db_row"])
                    item["db_id"] = item["db_row"].id
                item.pop("db_row", None)
        else:
            for item in processed_items:
                item.pop("db_row", None)
                item["db_id"] = None

        return {
            "campaign_id": campaign_record.id if campaign_record else None,
            "campaign_title": campaign_title,
            "purpose": purpose,
            "target_audience": target_audience,
            "base_content": base_content,
            "processed_contents": processed_items,
            "total_generated": len(processed_items),
            "languages_covered": list(set(i["language"] for i in processed_items)),
            "ready_for_distribution": any(i["status"] == "ready_for_distribution" for i in processed_items),
            "summary": {
                "roles_personalized": active_roles,
                "languages_translated": target_languages,
                "total_items": len(processed_items),
                "ready_count": sum(1 for i in processed_items if i["status"] == "ready_for_distribution")
            }
        }


content_pipeline_service = ContentPipelineService()
