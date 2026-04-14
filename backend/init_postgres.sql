-- Run as superuser (postgres) to create the taxiapp database and user.
-- psql -U postgres -f init_postgres.sql

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'taxiapp') THEN
        CREATE ROLE taxiapp WITH LOGIN PASSWORD 'taxiapp';
    END IF;
END $$;

SELECT 'CREATE DATABASE taxiapp OWNER taxiapp'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'taxiapp')\gexec

GRANT ALL PRIVILEGES ON DATABASE taxiapp TO taxiapp;
