import re
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)


class PersonalizationService:
    def __init__(self):
        pass

    def personalize_content(
        self,
        message_title: str,
        message_body: str,
        short_version: Optional[str] = None,
        call_to_action: Optional[str] = None,
        audience_role: str = "General Public",
        language: str = "English",
        location_context: Optional[str] = None,
        organization_context: Optional[str] = None,
        department_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Dynamically adapts and personalizes public awareness content for specific audience segments,
        occupations, organizations, and locations.
        """
        role_cleaned = audience_role.strip().capitalize()
        role_lower = audience_role.strip().lower()
        applied_rules = []

        # 1. Role-specific Salutation and Call to Action adaptation
        if "student" in role_lower:
            role_header = "Attention Students:"
            role_context = "As active learners and student community members, your participation is vital."
            role_cta = "Students, please register through the student portal or contact your class representative."
            short_prefix = "Students: "
            applied_rules.append("Applied student-centric portal registration hooks")
        elif "teacher" in role_lower or "faculty" in role_lower or "professor" in role_lower:
            role_header = "Dear Esteemed Faculty & Teachers:"
            role_context = "As educators, your guidance and participation help lead our educational community."
            role_cta = "Faculty members, please coordinate with your academic department and encourage classroom participation."
            short_prefix = "Faculty & Teachers: "
            applied_rules.append("Applied educator coordination and departmental engagement hooks")
        elif "doctor" in role_lower or "nurse" in role_lower or "health" in role_lower or "medical" in role_lower:
            role_header = "Dear Healthcare Professionals:"
            role_context = "Your clinical expertise and leadership are critical in championing community wellness."
            role_cta = "Healthcare team members, please review the clinical schedule and consultation roster."
            short_prefix = "Healthcare Staff: "
            applied_rules.append("Applied medical/clinical workflow hooks")
        elif "employee" in role_lower or "staff" in role_lower or "admin" in role_lower:
            role_header = "Dear Team & Staff Members:"
            role_context = "As valued employees, maintaining high awareness and active participation benefits our entire organization."
            role_cta = "Staff members, please log into the internal employee portal to sign up for scheduled sessions."
            short_prefix = "Employees: "
            applied_rules.append("Applied workplace employee self-service portal hooks")
        elif "business" in role_lower or "owner" in role_lower:
            role_header = "Dear Local Business Owners & Entrepreneurs:"
            role_context = "As community enterprise leaders, your collaboration strengthens regional public health and safety."
            role_cta = "Business owners, please implement these practices across your establishments."
            short_prefix = "Business Owners: "
            applied_rules.append("Applied commercial and enterprise compliance hooks")
        else:
            role_header = f"Dear {role_cleaned} Community Members:"
            role_context = "Your active involvement makes a lasting positive impact across our locality."
            role_cta = call_to_action or f"Community members, please visit the nearest public center for registration."
            short_prefix = f"{role_cleaned}: "
            applied_rules.append("Applied demographic community personalization")

        # 2. Location Context Customization
        loc_str = ""
        if location_context:
            loc_str = f" for residents in {location_context}"
            applied_rules.append(f"Injected geographic localization ({location_context})")

        # 3. Organization & Department Customization
        org_str = ""
        if organization_context:
            org_str = f" at {organization_context}"
            if department_context:
                org_str += f" ({department_context} Division)"
            applied_rules.append(f"Injected institutional context ({organization_context})")

        # 4. Synthesize Personalized Message Title
        clean_title = re.sub(r'^(📢|🚨)\s*', '', message_title)
        personalized_title = f"{'📢 ' if 'urgent' not in message_title.lower() else '🚨 '}[{role_cleaned}] {clean_title}{loc_str}"

        # 5. Transform Body with Dynamic Slot Injections
        body_lines = message_body.split("\n")
        new_lines = []
        replaced_salutation = False

        for line in body_lines:
            if not replaced_salutation and any(line.strip().startswith(prefix) for prefix in ["Dear", "Public Announcement", "Hello", "URGENT", "Official"]):
                new_lines.append(f"{role_header}{org_str}")
                new_lines.append("")
                new_lines.append(role_context)
                replaced_salutation = True
            elif "Action Required:" in line or "Call to action:" in line:
                new_lines.append(f"Action Required ({role_cleaned}): {role_cta}")
            else:
                new_lines.append(line)

        if not replaced_salutation:
            new_lines.insert(0, f"{role_header}{org_str}\n{role_context}\n")

        personalized_body = "\n".join(new_lines)

        # 6. Adapt Short Version
        if short_version:
            base_short = re.sub(r'^(📢|🚨)\s*', '', short_version)
            base_short = re.sub(r'^(Alert:\s*|Notice:\s*|Students:\s*|Employees:\s*)', '', base_short, flags=re.IGNORECASE)
            personalized_short = f"{short_prefix}{base_short.strip()}"
        else:
            personalized_short = f"{short_prefix}{clean_title}. {role_cta}"

        if len(personalized_short) > 280:
            personalized_short = personalized_short[:277] + "..."

        return {
            "audience_role": role_cleaned,
            "original_title": message_title,
            "personalized_title": personalized_title,
            "original_body": message_body,
            "personalized_body": personalized_body,
            "personalized_short_version": personalized_short,
            "personalized_call_to_action": role_cta,
            "personalization_applied": applied_rules
        }


personalization_service = PersonalizationService()
