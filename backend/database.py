from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from core.config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def create_tables():
    from models import user, client, order, message, discount_program  # noqa: F401
    from models import campaign, audience, ab_test, placement, payment, crm  # noqa: F401
    Base.metadata.create_all(bind=engine)


def migrate_db():
    """Add new columns to existing tables if they don't exist."""
    with engine.connect() as conn:
        from sqlalchemy import text, inspect
        inspector = inspect(engine)

        user_cols = {c["name"] for c in inspector.get_columns("users")}
        if "is_admin" not in user_cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0"))

        order_cols = {c["name"] for c in inspector.get_columns("orders")}
        if "created_by_id" not in order_cols:
            conn.execute(text("ALTER TABLE orders ADD COLUMN created_by_id INTEGER REFERENCES users(id)"))
        if "attachment_filename" not in order_cols:
            conn.execute(text("ALTER TABLE orders ADD COLUMN attachment_filename VARCHAR"))
        if "attachment_path" not in order_cols:
            conn.execute(text("ALTER TABLE orders ADD COLUMN attachment_path VARCHAR"))
        if "discount_program_id" not in order_cols:
            conn.execute(text("ALTER TABLE orders ADD COLUMN discount_program_id INTEGER REFERENCES discount_programs(id)"))

        # Ensure the seeded admin user has is_admin = 1
        conn.execute(text("UPDATE users SET is_admin = 1 WHERE email = 'admin@adagency.com' AND is_admin = 0"))
        conn.commit()
