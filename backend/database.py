"""PostgreSQL database access and bootstrap helpers."""
from __future__ import annotations

import os
from contextlib import contextmanager
from threading import Lock
from typing import Any, Generator
from urllib.parse import urlparse

DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql://" + DATABASE_URL[len("postgres://") :]

_pg_pool: Any = None
_pg_pool_lock = Lock()


def _require_database_url() -> str:
    if not DATABASE_URL.startswith("postgresql://"):
        raise RuntimeError(
            "DATABASE_URL is required and must start with 'postgresql://'. "
            "Example: postgresql://taxiapp:taxiapp@127.0.0.1:5432/taxiapp"
        )
    return DATABASE_URL


def _safe_dsn_label(dsn: str) -> str:
    parsed = urlparse(dsn)
    host = parsed.hostname or "localhost"
    port = parsed.port or 5432
    db = parsed.path.lstrip("/") or "postgres"
    user = parsed.username or "user"
    return f"postgresql://{user}@{host}:{port}/{db}"


def _pg_get_pool() -> Any:
    global _pg_pool
    with _pg_pool_lock:
        if _pg_pool is None or _pg_pool.closed:
            import psycopg2
            import psycopg2.pool

            dsn = _require_database_url()
            try:
                _pg_pool = psycopg2.pool.ThreadedConnectionPool(
                    minconn=1,
                    maxconn=16,
                    dsn=dsn,
                )
            except psycopg2.OperationalError as exc:
                safe = _safe_dsn_label(dsn)
                details = str(exc).strip()
                hint = (
                    f"PostgreSQL connection failed for {safe}. "
                    "Run `python backend/setup_db.py` to bootstrap the database, "
                    "or set a working DATABASE_URL."
                )
                if details:
                    hint = f"{hint} Original error: {details}"
                raise RuntimeError(hint) from exc
    return _pg_pool


@contextmanager
def transaction() -> Generator[Any, None, None]:
    pool = _pg_get_pool()
    conn = pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


def query(sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    import psycopg2.extras

    with transaction() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            if cur.description:
                return [dict(row) for row in cur.fetchall()]
            return []


def query_one(sql: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    rows = query(sql, params)
    return rows[0] if rows else None


def execute(sql: str, params: tuple[Any, ...] = ()) -> int:
    import psycopg2

    with transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            try:
                row = cur.fetchone()
                return int(row[0]) if row else cur.rowcount
            except psycopg2.ProgrammingError:
                return cur.rowcount


def _seed_pricing(cur: Any) -> None:
    cur.execute(
        """
        INSERT INTO pricing_tariffs(car_class, title, base_fare, per_km, per_minute, class_multiplier, min_fare)
        VALUES
            ('econom', 'Эконом', 139, 18, 7, 1.00, 159),
            ('comfort', 'Комфорт', 179, 22, 8, 1.22, 219),
            ('business', 'Бизнес', 290, 35, 11, 1.65, 360)
        ON CONFLICT (car_class) DO NOTHING
        """
    )
    cur.execute(
        """
        INSERT INTO pricing_settings(key, value)
        VALUES
            ('commission_percent', 5),
            ('night_multiplier', 1.15),
            ('weather_multiplier', 1.00),
            ('demand_multiplier', 1.00),
            ('far_pickup_threshold_km', 4.0),
            ('far_pickup_multiplier', 1.10),
            ('extra_passenger_fee', 50),
            ('default_sms_code', 1111)
        ON CONFLICT (key) DO NOTHING
        """
    )


def init_db() -> None:
    _require_database_url()
    with transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS app_events (
                    id BIGSERIAL PRIMARY KEY,
                    time_utc TEXT NOT NULL,
                    app_type VARCHAR(20) NOT NULL,
                    app_name VARCHAR(100) NOT NULL
                );

                CREATE TABLE IF NOT EXISTS passengers (
                    id BIGSERIAL PRIMARY KEY,
                    phone VARCHAR(32) UNIQUE NOT NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'active',
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS sms_codes (
                    id BIGSERIAL PRIMARY KEY,
                    phone VARCHAR(32) NOT NULL,
                    code VARCHAR(8) NOT NULL,
                    purpose VARCHAR(32) NOT NULL DEFAULT 'login',
                    expires_at TIMESTAMPTZ NOT NULL,
                    used_at TIMESTAMPTZ NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS sessions (
                    id BIGSERIAL PRIMARY KEY,
                    token VARCHAR(128) UNIQUE NOT NULL,
                    actor_type VARCHAR(20) NOT NULL,
                    actor_id BIGINT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    expires_at TIMESTAMPTZ NULL
                );

                CREATE TABLE IF NOT EXISTS drivers (
                    id BIGSERIAL PRIMARY KEY,
                    public_id VARCHAR(32) UNIQUE,
                    invite_code VARCHAR(64) UNIQUE NOT NULL,
                    phone VARCHAR(32) NULL,
                    full_name VARCHAR(255) NOT NULL,
                    passport_data TEXT NOT NULL DEFAULT '',
                    vehicle_make VARCHAR(100) NOT NULL DEFAULT '',
                    vehicle_model VARCHAR(100) NOT NULL DEFAULT '',
                    vehicle_plate VARCHAR(32) NOT NULL DEFAULT '',
                    vehicle_color VARCHAR(64) NOT NULL DEFAULT '',
                    documents_data JSONB NOT NULL DEFAULT '{}'::jsonb,
                    rating NUMERIC(3,2) NOT NULL DEFAULT 5.0,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    is_online BOOLEAN NOT NULL DEFAULT FALSE,
                    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
                    service_class VARCHAR(32) NOT NULL DEFAULT 'econom',
                    current_lat DOUBLE PRECISION NULL,
                    current_lon DOUBLE PRECISION NULL,
                    last_location_at TIMESTAMPTZ NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS pricing_tariffs (
                    car_class VARCHAR(32) PRIMARY KEY,
                    title VARCHAR(64) NOT NULL,
                    base_fare NUMERIC(10,2) NOT NULL,
                    per_km NUMERIC(10,2) NOT NULL,
                    per_minute NUMERIC(10,2) NOT NULL,
                    class_multiplier NUMERIC(6,3) NOT NULL,
                    min_fare NUMERIC(10,2) NOT NULL,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS pricing_settings (
                    key VARCHAR(64) PRIMARY KEY,
                    value NUMERIC(12,3) NOT NULL,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS ride_orders (
                    id BIGSERIAL PRIMARY KEY,
                    public_id VARCHAR(32) UNIQUE,
                    passenger_id BIGINT NOT NULL REFERENCES passengers(id),
                    driver_id BIGINT NULL REFERENCES drivers(id),
                    status VARCHAR(32) NOT NULL,
                    created_source VARCHAR(32) NOT NULL DEFAULT 'passenger',
                    pickup_address TEXT NOT NULL,
                    pickup_lat DOUBLE PRECISION NOT NULL,
                    pickup_lon DOUBLE PRECISION NOT NULL,
                    dropoff_address TEXT NOT NULL,
                    dropoff_lat DOUBLE PRECISION NOT NULL,
                    dropoff_lon DOUBLE PRECISION NOT NULL,
                    waypoints JSONB NOT NULL DEFAULT '[]'::jsonb,
                    route_distance_meters INTEGER NOT NULL DEFAULT 0,
                    route_duration_seconds INTEGER NOT NULL DEFAULT 0,
                    driver_to_pickup_distance_meters INTEGER NULL,
                    driver_to_pickup_duration_seconds INTEGER NULL,
                    route_geometry JSONB NULL,
                    comment TEXT NOT NULL DEFAULT '',
                    passengers_count INTEGER NOT NULL DEFAULT 1,
                    car_class VARCHAR(32) NOT NULL DEFAULT 'econom',
                    payment_method VARCHAR(32) NOT NULL DEFAULT 'cash',
                    scheduled_for TIMESTAMPTZ NULL,
                    promo_code VARCHAR(64) NULL,
                    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
                    fare_total NUMERIC(10,2) NOT NULL DEFAULT 0,
                    fare_base NUMERIC(10,2) NOT NULL DEFAULT 0,
                    fare_distance_component NUMERIC(10,2) NOT NULL DEFAULT 0,
                    fare_time_component NUMERIC(10,2) NOT NULL DEFAULT 0,
                    fare_demand_multiplier NUMERIC(8,3) NOT NULL DEFAULT 1,
                    fare_weather_multiplier NUMERIC(8,3) NOT NULL DEFAULT 1,
                    fare_night_multiplier NUMERIC(8,3) NOT NULL DEFAULT 1,
                    fare_class_multiplier NUMERIC(8,3) NOT NULL DEFAULT 1,
                    fare_extra_conditions_component NUMERIC(10,2) NOT NULL DEFAULT 0,
                    service_commission_percent NUMERIC(5,2) NOT NULL DEFAULT 5,
                    service_commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
                    driver_payout_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
                    cancellation_by VARCHAR(32) NULL,
                    cancellation_reason TEXT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    accepted_at TIMESTAMPTZ NULL,
                    arrived_at TIMESTAMPTZ NULL,
                    started_at TIMESTAMPTZ NULL,
                    completed_at TIMESTAMPTZ NULL,
                    cancelled_at TIMESTAMPTZ NULL,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS ride_order_rejections (
                    id BIGSERIAL PRIMARY KEY,
                    ride_order_id BIGINT NOT NULL REFERENCES ride_orders(id) ON DELETE CASCADE,
                    driver_id BIGINT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
                    reason TEXT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    UNIQUE(ride_order_id, driver_id)
                );

                CREATE TABLE IF NOT EXISTS ride_order_events (
                    id BIGSERIAL PRIMARY KEY,
                    ride_order_id BIGINT NOT NULL REFERENCES ride_orders(id) ON DELETE CASCADE,
                    event_type VARCHAR(64) NOT NULL,
                    actor_type VARCHAR(20) NOT NULL,
                    actor_id VARCHAR(64) NOT NULL,
                    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS chat_drivers (
                    driver_id VARCHAR(64) PRIMARY KEY,
                    source VARCHAR(50) NOT NULL,
                    registered_utc TEXT NOT NULL,
                    updated_utc TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS chat_messages (
                    id BIGSERIAL PRIMARY KEY,
                    driver_id VARCHAR(64) NULL,
                    sender VARCHAR(20) NULL,
                    text TEXT NULL,
                    time_utc TEXT NULL
                );

                CREATE TABLE IF NOT EXISTS driver_balance_entries (
                    id BIGSERIAL PRIMARY KEY,
                    driver_id BIGINT NOT NULL REFERENCES drivers(id),
                    ride_order_id BIGINT NULL REFERENCES ride_orders(id),
                    type VARCHAR(32) NOT NULL,
                    direction VARCHAR(16) NOT NULL,
                    payment_method VARCHAR(32) NULL,
                    amount NUMERIC(10,2) NOT NULL,
                    comment TEXT NOT NULL DEFAULT '',
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS driver_feedback (
                    id BIGSERIAL PRIMARY KEY,
                    ride_order_id BIGINT UNIQUE NOT NULL REFERENCES ride_orders(id) ON DELETE CASCADE,
                    passenger_id BIGINT NOT NULL REFERENCES passengers(id),
                    driver_id BIGINT NOT NULL REFERENCES drivers(id),
                    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
                    complaint_reason VARCHAR(64) NULL,
                    complaint_text TEXT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )

            cur.execute(
                """
                ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS ride_order_id BIGINT NULL REFERENCES ride_orders(id) ON DELETE CASCADE;
                ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS chat_kind VARCHAR(20) NOT NULL DEFAULT 'operator';
                ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sender_type VARCHAR(20) NULL;
                ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sender_id VARCHAR(64) NULL;
                ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS receiver_type VARCHAR(20) NULL;
                ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS receiver_id VARCHAR(64) NULL;
                ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS message_text TEXT NULL;
                ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NULL;
                ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ NULL;
                ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ NULL;

                ALTER TABLE drivers ADD COLUMN IF NOT EXISTS public_id VARCHAR(32);
                ALTER TABLE drivers ADD COLUMN IF NOT EXISTS phone VARCHAR(32) NULL;
                ALTER TABLE drivers ADD COLUMN IF NOT EXISTS service_class VARCHAR(32) NOT NULL DEFAULT 'econom';
                ALTER TABLE ride_orders ADD COLUMN IF NOT EXISTS public_id VARCHAR(32);
                """
            )

            cur.execute(
                """
                UPDATE chat_messages
                SET message_text = COALESCE(message_text, text)
                WHERE message_text IS NULL;

                UPDATE chat_messages
                SET created_at = COALESCE(created_at, NULLIF(time_utc, '')::timestamptz, NOW())
                WHERE created_at IS NULL;

                UPDATE chat_messages
                SET sender_type = COALESCE(sender_type, CASE WHEN sender = 'driver' THEN 'driver' ELSE 'operator' END)
                WHERE sender_type IS NULL;

                UPDATE chat_messages
                SET sender_id = COALESCE(sender_id, CASE WHEN sender = 'driver' THEN driver_id ELSE 'operator' END)
                WHERE sender_id IS NULL;

                UPDATE chat_messages
                SET receiver_type = COALESCE(receiver_type, CASE WHEN sender = 'driver' THEN 'operator' ELSE 'driver' END)
                WHERE receiver_type IS NULL;

                UPDATE chat_messages
                SET receiver_id = COALESCE(receiver_id, CASE WHEN sender = 'driver' THEN 'operator' ELSE driver_id END)
                WHERE receiver_id IS NULL;
                """
            )

            cur.execute(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
                CREATE UNIQUE INDEX IF NOT EXISTS idx_drivers_public_id ON drivers(public_id);
                CREATE UNIQUE INDEX IF NOT EXISTS idx_ride_orders_public_id ON ride_orders(public_id);
                CREATE INDEX IF NOT EXISTS idx_sms_codes_phone_created ON sms_codes(phone, created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_ride_orders_status ON ride_orders(status, created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_ride_orders_driver_status ON ride_orders(driver_id, status, created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_ride_orders_passenger_status ON ride_orders(passenger_id, status, created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_rejections_driver_order ON ride_order_rejections(driver_id, ride_order_id);
                CREATE INDEX IF NOT EXISTS idx_chat_messages_operator ON chat_messages(driver_id, chat_kind, id);
                CREATE INDEX IF NOT EXISTS idx_chat_messages_ride ON chat_messages(ride_order_id, chat_kind, id);
                CREATE INDEX IF NOT EXISTS idx_driver_balance_entries_driver ON driver_balance_entries(driver_id, created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_feedback_driver ON driver_feedback(driver_id, created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_app_events_type ON app_events(app_type);
                """
            )

            _seed_pricing(cur)

    print(f"[DB] Initialized: PostgreSQL ({_safe_dsn_label(DATABASE_URL)})")


def close_pool() -> None:
    global _pg_pool
    if _pg_pool and not _pg_pool.closed:
        _pg_pool.closeall()
        _pg_pool = None
