import subprocess
import sys
from pathlib import Path

from sqlalchemy import text


backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.modules.core.database import engine


def reset_db() -> None:
    print("Resetting database schema...")
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO postgres;"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
    print("Schema reset complete.")

    print("Applying migrations...")
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=backend_dir,
        check=True,
    )
    print("Migrations applied.")


def seed_db() -> None:
    print("\nSeeding admin account...")
    from seed_admin import seed_admin

    seed_admin()

    print("\nSeeding core data...")
    from seed_data import generate_records

    generate_records()

    print("\nReset and reseed complete.")


if __name__ == "__main__":
    reset_db()
    seed_db()
