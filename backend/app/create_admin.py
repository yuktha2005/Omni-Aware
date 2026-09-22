from database.connection import SessionLocal
from models.admin import Admin
from services.auth_service import hash_password


db = SessionLocal()

try:
    existing = db.query(Admin).filter(Admin.email == "admin@example.com").first()
    if existing:
        print(f"Admin already exists. ID: {existing.id} (Email: {existing.email})")
    else:
        admin = Admin(
            full_name="System Admin",
            email="admin@example.com",
            password_hash=hash_password("TestPassword123!"),
            phone="9000000000",
            is_active=True
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print(f"Admin created successfully. ID: {admin.id}")

finally:
    db.close()