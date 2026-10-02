import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from main import app
from database.connection import SessionLocal
from models.admin import Admin
from models.campaign import Campaign
from services.auth_service import hash_password, create_access_token

client = TestClient(app)


def test_comm_team_schedule_draft_and_admin_approval():
    db = SessionLocal()
    try:
        # 1. Ensure test users
        admin_user = db.query(Admin).filter(Admin.email == "admin_flow@example.com").first()
        if not admin_user:
            admin_user = Admin(
                email="admin_flow@example.com",
                password_hash=hash_password("Pass123!"),
                full_name="Flow Admin",
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

        comm_user = db.query(Admin).filter(Admin.email == "comm_flow@example.com").first()
        if not comm_user:
            comm_user = Admin(
                email="comm_flow@example.com",
                password_hash=hash_password("Pass123!"),
                full_name="Flow Comm",
                role="communication_team",
                is_active=True
            )
            db.add(comm_user)
            db.commit()
            db.refresh(comm_user)


        admin_token = create_access_token(admin_id=admin_user.id, email=admin_user.email, role="admin")
        comm_token = create_access_token(admin_id=comm_user.id, email=comm_user.email, role="communication_team")


        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        comm_headers = {"Authorization": f"Bearer {comm_token}"}

        # 2. Comm team creates a campaign draft
        create_res = client.post("/ai/campaigns", json={
            "title": "Community Health Advisory 2026",
            "purpose": "Vaccination and Wellness Drive",
            "target_audience": "Senior Citizens and Families",
            "key_information": "Free booster clinics available at all primary health centers starting Monday.",
            "desired_language": "English",
            "desired_tone": "Reassuring"
        }, headers=comm_headers)
        assert create_res.status_code == 200
        camp_id = create_res.json()["id"]

        # 3. Comm team submits scheduling preferences for approval
        sched_time = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
        sched_res = client.post(f"/ai/campaigns/{camp_id}/submit-approval", json={
            "scheduled_at": sched_time,
            "scheduled_timezone": "Asia/Kolkata",
            "selected_channels": ["sms", "whatsapp", "email"],
            "notes": "Please review for state-wide distribution."
        }, headers=comm_headers)
        assert sched_res.status_code == 200
        assert sched_res.json()["status"] == "pending_approval"


        # 4. Admin checks the approval queue
        queue_res = client.get("/ai/campaigns/approvals/queue?status_filter=pending_approval", headers=admin_headers)
        assert queue_res.status_code == 200
        items = queue_res.json()
        target_item = next((it for it in items if it["id"] == camp_id), None)
        assert target_item is not None
        assert target_item["status"] == "pending_approval"
        assert target_item["selected_channels"] == ["sms", "whatsapp", "email"]
        assert target_item["scheduled_at"] is not None

        # 5. Admin approves the scheduled campaign
        approve_res = client.post(f"/ai/campaigns/{camp_id}/approve", json={
            "notes": "Verified and authorized for scheduled broadcast."
        }, headers=admin_headers)
        assert approve_res.status_code == 200
        assert approve_res.json()["status"] in ["scheduled", "approved"]

        # 6. Verify campaign in database is updated
        db.expire_all()
        updated_camp = db.query(Campaign).filter(Campaign.id == camp_id).first()
        assert updated_camp.status in ["scheduled", "approved"]


    finally:
        db.close()
