"""Bootstrap PostgreSQL for local MVP runs."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))


SUPERUSER_DSN = os.environ.get(
    "POSTGRES_SUPERUSER_DSN",
    "postgresql://postgres:postgres@127.0.0.1:5432/postgres",
)
APP_DB = os.environ.get("POSTGRES_APP_DB", "taxiapp")
APP_USER = os.environ.get("POSTGRES_APP_USER", "taxiapp")
APP_PASS = os.environ.get("POSTGRES_APP_PASSWORD", "taxiapp")
APP_DSN = os.environ.get(
    "DATABASE_URL",
    f"postgresql://{APP_USER}:{APP_PASS}@127.0.0.1:5432/{APP_DB}",
)


def _try_connect(dsn: str) -> bool:
    try:
        conn = psycopg2.connect(dsn)
        conn.close()
        return True
    except psycopg2.OperationalError:
        return False


def _ensure_env() -> None:
    os.environ["DATABASE_URL"] = APP_DSN


def _create_role_and_db() -> None:
    print("[1/3] App DSN is not ready, trying superuser bootstrap...")
    conn = psycopg2.connect(SUPERUSER_DSN)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()

    cur.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", (APP_USER,))
    if not cur.fetchone():
        cur.execute(f"CREATE ROLE {APP_USER} WITH LOGIN PASSWORD %s", (APP_PASS,))
        print(f"  Created role '{APP_USER}'")
    else:
        print(f"  Role '{APP_USER}' already exists")

    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (APP_DB,))
    if not cur.fetchone():
        cur.execute(f"CREATE DATABASE {APP_DB} OWNER {APP_USER}")
        print(f"  Created database '{APP_DB}'")
    else:
        print(f"  Database '{APP_DB}' already exists")

    cur.execute(f"GRANT ALL PRIVILEGES ON DATABASE {APP_DB} TO {APP_USER}")
    cur.close()
    conn.close()


def _create_tables() -> None:
    print("[2/3] Initializing schema...")
    _ensure_env()
    from backend.database import init_db

    init_db()


def _verify() -> None:
    print("[3/3] Verifying connection...")
    _ensure_env()
    from backend.database import query

    rows = query("SELECT current_database() AS db, current_user AS usr")
    print(f"  Connected as: {rows[0]}")
    print("\nPostgreSQL setup complete.")


def main() -> None:
    _ensure_env()

    if _try_connect(APP_DSN):
        print("[1/3] App database is already reachable.")
    else:
        try:
            _create_role_and_db()
        except psycopg2.OperationalError as exc:
            print(f"\nERROR: Cannot connect to PostgreSQL.\n{exc}")
            print("\nTried:")
            print(f"  APP_DSN={APP_DSN}")
            print(f"  SUPERUSER_DSN={SUPERUSER_DSN}")
            print("\nStart PostgreSQL locally or via docker compose, then rerun setup.")
            sys.exit(1)

    _create_tables()
    _verify()


if __name__ == "__main__":
    main()
