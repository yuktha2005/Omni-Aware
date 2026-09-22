from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from pathlib import Path
from dotenv import load_dotenv
import os

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def apply_schema_migrations():
    """
    Applies non-destructive schema updates to existing PostgreSQL tables.
    """
    migration_statements = [
        "ALTER TABLE admins ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin';",
        "ALTER TABLE admins ADD COLUMN IF NOT EXISTS organization VARCHAR(150);",
        "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP;",
        "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS scheduled_timezone VARCHAR(50) DEFAULT 'UTC';",
        "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_segment_id BIGINT;",
        "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS selected_channels JSONB;",
        "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;",
        "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;",
        "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS total_recipients INTEGER DEFAULT 0;",
        "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS total_delivered INTEGER DEFAULT 0;",
        "ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS total_failed INTEGER DEFAULT 0;"
    ]
    try:
        with engine.connect() as conn:
            for stmt in migration_statements:
                conn.execute(text(stmt))
            conn.commit()
    except Exception as e:
        # If database or table is not yet created, create_all will handle it
        pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()