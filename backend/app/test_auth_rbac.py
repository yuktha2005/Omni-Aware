import pytest
from fastapi.testclient import TestClient
from main import app
from database.connection import get_db, SessionLocal
from models.admin import Admin

client = TestClient(app)


@pytest.fixture(autouse=True)
def cleanup_test_users():
    yield
    db = SessionLocal()
    try:
        db.query(Admin).filter(Admin.email.like("test_%@example.com")).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()


def test_user_registration_and_authentication():
    # 1. Register Communication Team member
    reg_data = {
        "full_name": "Ravi Shastri",
        "email": "test_ravi@example.com",
        "password": "SecurePassword123!",
        "role": "communication_team",
        "organization": "State Health Outreach",
        "phone": "9876543210"
    }
    res = client.post("/auth/register", json=reg_data)
    assert res.status_code == 201, res.text
    body = res.json()
    assert "access_token" in body
    assert body["user"]["email"] == "test_ravi@example.com"
    assert body["user"]["role"] == "communication_team"

    # 2. Duplicate registration fails
    dup_res = client.post("/auth/register", json=reg_data)
    assert dup_res.status_code == 400
    assert "already registered" in dup_res.json()["detail"].lower()

    # 3. Login with newly created user
    login_res = client.post("/auth/login", json={
        "email": "test_ravi@example.com",
        "password": "SecurePassword123!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token

    # 4. Verify /auth/me returns profile
    me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "test_ravi@example.com"
    assert me_res.json()["role"] == "communication_team"


def test_role_based_access_control_and_user_management():
    # 1. Register an Admin
    admin_data = {
        "full_name": "Chief Administrator",
        "email": "test_chief_admin@example.com",
        "password": "AdminPassword123!",
        "role": "admin",
        "organization": "Headquarters"
    }
    admin_res = client.post("/auth/register", json=admin_data)
    assert admin_res.status_code == 201
    admin_token = admin_res.json()["access_token"]

    # 2. Register a Campaign Manager
    cm_data = {
        "full_name": "Priya Sharma",
        "email": "test_priya_cm@example.com",
        "password": "ManagerPassword123!",
        "role": "campaign_manager",
        "organization": "Regional Bureau"
    }
    cm_res = client.post("/auth/register", json=cm_data)
    assert cm_res.status_code == 201
    cm_token = cm_res.json()["access_token"]
    cm_id = cm_res.json()["user"]["id"]

    # 3. Register a Communication Team member
    comm_data = {
        "full_name": "Ananya Roy",
        "email": "test_ananya_comm@example.com",
        "password": "CommPassword123!",
        "role": "communication_team",
        "organization": "Content Cell"
    }
    comm_res = client.post("/auth/register", json=comm_data)
    assert comm_res.status_code == 201
    comm_token = comm_res.json()["access_token"]

    # 4. RBAC: Communication Team trying to list all users -> Forbidden
    comm_list_res = client.get("/auth/users", headers={"Authorization": f"Bearer {comm_token}"})
    assert comm_list_res.status_code == 403

    # 5. RBAC: Campaign Manager trying to list all users -> Forbidden
    cm_list_res = client.get("/auth/users", headers={"Authorization": f"Bearer {cm_token}"})
    assert cm_list_res.status_code == 403

    # 6. RBAC: Admin listing all users -> Success
    admin_list_res = client.get("/auth/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_list_res.status_code == 200
    user_list = admin_list_res.json()
    assert len(user_list) >= 3

    # 7. Admin updating Campaign Manager's role to Admin
    role_update_res = client.put(
        f"/auth/users/{cm_id}/role",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": "admin", "is_active": True}
    )
    assert role_update_res.status_code == 200
    assert role_update_res.json()["role"] == "admin"
