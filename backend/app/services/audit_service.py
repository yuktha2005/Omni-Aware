import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from models.audit import AuditLog
from models.admin import Admin

logger = logging.getLogger("audit_service")


def log_audit_event(
    db: Session,
    action: str,
    admin: Optional[Admin] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
) -> Optional[AuditLog]:
    """
    Records an immutable audit event in the database for governance, DPDP compliance, and security oversight.
    """
    try:
        log_entry = AuditLog(
            admin_id=admin.id if admin else None,
            actor_email=admin.email if admin else "system",
            actor_role=admin.role if admin else "system",
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id is not None else None,
            details=details or {},
            ip_address=ip_address,
            created_at=datetime.now(timezone.utc)
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
    except Exception as e:
        logger.error(f"Failed to record audit event '{action}': {e}")
        db.rollback()
        return None
