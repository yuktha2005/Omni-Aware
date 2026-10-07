from database.connection import SessionLocal
from models.admin import Admin
from services.auth_service import hash_password


db = SessionLocal()

DEMO_USERS = [
    {
        "full_name": "System Administrator",
        "email": "admin@example.com",
        "role": "admin",
        "phone": "9000000001",
    },
    {
        "full_name": "Rajesh Sharma (Campaign Director)",
        "email": "manager@example.com",
        "role": "campaign_manager",
        "phone": "9000000002",
    },
    {
        "full_name": "Ananya Verma (Communications Lead)",
        "email": "commteam@example.com",
        "role": "communication_team",
        "phone": "9000000003",
    },
    {
        "full_name": "Ananya Verma (Communications Lead)",
        "email": "comm@example.com",
        "role": "communication_team",
        "phone": "9000000004",
    },
]

try:
    for u in DEMO_USERS:
        existing = db.query(Admin).filter(Admin.email == u["email"]).first()
        if existing:
            existing.role = u["role"]
            existing.password_hash = hash_password("TestPassword123!")
            existing.is_active = True
            print(f"User updated: {u['email']} (Role: {u['role']})")
        else:
            admin = Admin(
                full_name=u["full_name"],
                email=u["email"],
                password_hash=hash_password("TestPassword123!"),
                role=u["role"],
                phone=u["phone"],
                is_active=True,
            )
            db.add(admin)
            print(f"User created: {u['email']} (Role: {u['role']})")

    db.commit()
    print("All demo accounts initialized successfully.")

finally:
    db.close()