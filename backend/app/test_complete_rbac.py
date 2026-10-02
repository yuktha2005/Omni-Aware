import pytest
from fastapi.testclient import TestClient
from main import app
from database.connection import SessionLocal
from models.admin import Admin
from models.audit import AuditLog
from models.campaign import Campaign

client = TestClient(app)


from models.campaign import Campaign, CampaignContent

def cleanup_data():
    db = SessionLocal()
    try:
        test_admins = db.query(Admin).filter(Admin.email.like("test_%@example.com")).all()
        admin_ids = [a.id for a in test_admins]
        if admin_ids:
            test_camps = db.query(Campaign).filter(Campaign.created_by_admin_id.in_(admin_ids)).all()
            camp_ids = [c.id for c in test_camps]
            if camp_ids:
                db.query(CampaignContent).filter(CampaignContent.campaign_id.in_(camp_ids)).delete(synchronize_session=False)
                db.query(Campaign).filter(Campaign.id.in_(camp_ids)).delete(synchronize_session=False)
            db.query(AuditLog).filter(AuditLog.admin_id.in_(admin_ids)).delete(synchronize_session=False)
            db.query(Admin).filter(Admin.id.in_(admin_ids)).delete(synchronize_session=False)
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


@pytest.fixture(autouse=True)
def cleanup_rbac_data():
    cleanup_data()
    yield
    cleanup_data()


def test_complete_rbac_lifecycle():
    """
    Full RBAC testing covering:
    1. Role Registration & Authentication (Admin, Campaign Manager, Communication Team)
    2. Endpoint Authorizations & HTTP 403 blocks on direct API calls
    3. Campaign Distribution / Emergency SOS access control
    4. User Governance & Role Modifications
    5. User Deactivation & Access Revocation
    6. Audit Logging Verification
    """
    cleanup_data()
    # -------------------------------------------------------------
    # 1. SETUP: Register 3 users with distinct roles
    # -------------------------------------------------------------
    admin_reg = client.post("/auth/register", json={
        "full_name": "RBAC Super Admin",
        "email": "test_rbac_admin@example.com",
        "password": "Password123!",
        "role": "admin",
        "organization": "Central Governance"
    })
    assert admin_reg.status_code == 201
    admin_token = admin_reg.json()["access_token"]
    admin_id = admin_reg.json()["user"]["id"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    cm_reg = client.post("/auth/register", json={
        "full_name": "RBAC Campaign Manager",
        "email": "test_rbac_cm@example.com",
        "password": "Password123!",
        "role": "campaign_manager",
        "organization": "Operations"
    })
    assert cm_reg.status_code == 201
    cm_token = cm_reg.json()["access_token"]
    cm_id = cm_reg.json()["user"]["id"]
    cm_headers = {"Authorization": f"Bearer {cm_token}"}

    comm_reg = client.post("/auth/register", json={
        "full_name": "RBAC Comm Specialist",
        "email": "test_rbac_comm@example.com",
        "password": "Password123!",
        "role": "communication_team",
        "organization": "Field Media"
    })
    assert comm_reg.status_code == 201
    comm_token = comm_reg.json()["access_token"]
    comm_id = comm_reg.json()["user"]["id"]
    comm_headers = {"Authorization": f"Bearer {comm_token}"}

    # -------------------------------------------------------------
    # 2. USER GOVERNANCE & ACCESS CONTROL
    # -------------------------------------------------------------
    # Communication Team CANNOT access user list -> 403 Forbidden
    res = client.get("/auth/users", headers=comm_headers)
    assert res.status_code == 403

    # Campaign Manager CANNOT access user list -> 403 Forbidden
    res = client.get("/auth/users", headers=cm_headers)
    assert res.status_code == 403

    # Admin CAN access user list -> 200 OK
    res = client.get("/auth/users", headers=admin_headers)
    assert res.status_code == 200
    assert any(u["email"] == "test_rbac_admin@example.com" for u in res.json())

    # Campaign Manager CANNOT modify roles -> 403 Forbidden
    res = client.put(f"/auth/users/{comm_id}/role", headers=cm_headers, json={"role": "admin"})
    assert res.status_code == 403

    # Admin CAN modify roles -> 200 OK
    res = client.put(f"/auth/users/{comm_id}/role", headers=admin_headers, json={"role": "campaign_manager"})
    assert res.status_code == 200
    assert res.json()["role"] == "campaign_manager"

    # Revert role back to communication_team
    res = client.put(f"/auth/users/{comm_id}/role", headers=admin_headers, json={"role": "communication_team"})
    assert res.status_code == 200
    assert res.json()["role"] == "communication_team"

    # -------------------------------------------------------------
    # 3. CAMPAIGN CREATION & CONTENT DRAFTING
    # -------------------------------------------------------------
    # Create a campaign draft (All 3 roles are allowed to draft campaigns & generate content)
    camp_res = client.post("/ai/campaigns", headers=comm_headers, json={
        "title": "RBAC Test Campaign Cyclone Alert",
        "purpose": "Public safety alert for coastal regions",
        "key_information": "Severe cyclone landfall expected within 24 hours. Move to safe shelters.",
        "target_audience": "General Public",
        "desired_language": "English",
        "desired_tone": "Urgent",
        "communication_channel": "All"
    })
    assert camp_res.status_code in [200, 201], camp_res.text
    campaign_id = camp_res.json()["id"]

    # -------------------------------------------------------------
    # 4. DISTRIBUTION & BROADCAST AUTHORIZATION
    # -------------------------------------------------------------
    # Direct API check: Communication Team CANNOT trigger distribution -> 403 Forbidden
    dist_res = client.post(f"/campaigns/{campaign_id}/distribute", headers=comm_headers, json=["sms"])
    assert dist_res.status_code == 403
    assert "campaign_manager" in dist_res.json()["detail"].lower() or "access denied" in dist_res.json()["detail"].lower()

    # Direct API check: Communication Team CANNOT schedule distribution -> 403 Forbidden
    sched_res = client.post(f"/campaigns/{campaign_id}/schedule", headers=comm_headers, json={
        "scheduled_at": "2026-10-15T10:00:00Z",
        "scheduled_timezone": "Asia/Kolkata",
        "selected_channels": ["sms"]
    })
    assert sched_res.status_code == 403

    # Direct API check: Communication Team CANNOT trigger Emergency SOS -> 403 Forbidden
    sos_res = client.post("/api/emergency/broadcast", headers=comm_headers, json={
        "title": "SOS Flood Warning",
        "zone_name": "Adyar Corridor",
        "headline": "Immediate Evacuation Alert",
        "body": "Evacuate immediately to designated relief shelters.",
        "center_lat": 13.0827,
        "center_lng": 80.2707,
        "channels": ["flash_sms"]
    })
    assert sos_res.status_code == 403

    # Campaign Manager CAN trigger distribution -> 200 OK
    cm_dist_res = client.post(f"/campaigns/{campaign_id}/distribute?channels=web", headers=cm_headers)
    assert cm_dist_res.status_code in [200, 202]
    assert cm_dist_res.json()["status"] in ["queued", "completed", "running"]

    # -------------------------------------------------------------
    # 5. USER DEACTIVATION & SESSION REVOCATION
    # -------------------------------------------------------------
    # Admin deactivates CM user
    toggle_res = client.post(f"/auth/users/{cm_id}/toggle-status", headers=admin_headers)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_active"] is False

    # Deactivated user cannot log in
    deactivated_login = client.post("/auth/login", json={
        "email": "test_rbac_cm@example.com",
        "password": "Password123!"
    })
    assert deactivated_login.status_code == 403
    assert "inactive" in deactivated_login.json()["detail"].lower() or "deactivated" in deactivated_login.json()["detail"].lower()

    # Deactivated user's existing token is rejected
    blocked_req = client.get("/auth/me", headers=cm_headers)
    assert blocked_req.status_code == 403

    # Admin self-deactivation is blocked -> 400 Bad Request
    self_deact = client.post(f"/auth/users/{admin_id}/toggle-status", headers=admin_headers)
    assert self_deact.status_code == 400
    assert "cannot deactivate their own active session" in self_deact.json()["detail"].lower()

    # Reactivate CM user
    reactivate_res = client.post(f"/auth/users/{cm_id}/toggle-status", headers=admin_headers)
    assert reactivate_res.status_code == 200
    assert reactivate_res.json()["is_active"] is True

    # -------------------------------------------------------------
    # 6. AUDIT LOGGING INSPECTION (ADMIN ONLY)
    # -------------------------------------------------------------
    # Communication Team cannot view audit logs -> 403
    audit_comm = client.get("/auth/audit-logs", headers=comm_headers)
    assert audit_comm.status_code == 403

    # Campaign Manager cannot view audit logs -> 403
    audit_cm = client.get("/auth/audit-logs", headers=cm_headers)
    assert audit_cm.status_code == 403

    # Admin can view audit logs -> 200 OK
    audit_admin = client.get("/auth/audit-logs", headers=admin_headers)
    assert audit_admin.status_code == 200
    logs = audit_admin.json()
    assert len(logs) > 0

    actions_logged = [l["action"] for l in logs]
    assert "ROLE_CHANGED" in actions_logged
    assert "USER_STATUS_TOGGLED" in actions_logged
    assert any("DISTRIBUTION" in a or "CAMPAIGN" in a for a in actions_logged)
