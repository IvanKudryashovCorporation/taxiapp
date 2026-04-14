# Taxi Platform Starter (Python)

This repository contains 3 connected starter projects:

1. `driver_app` - desktop stub for driver mobile app (Kivy, phone-like window)
2. `passenger_app` - desktop stub for passenger mobile app (Kivy, phone-like window)
3. `backend` - FastAPI backend + web page for admin/operators

Both apps call one shared backend API, so they are already connected.

## 1) Install dependencies

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## 2) Start PostgreSQL

Quick local option via Docker:

```powershell
docker compose up -d postgres
```

Default local connection used by scripts:
`postgresql://taxiapp:taxiapp@127.0.0.1:5432/taxiapp`

## 3) Run backend (admin web site)

```powershell
$env:DATABASE_URL="postgresql://taxiapp:taxiapp@127.0.0.1:5432/taxiapp"
python -m uvicorn backend.main:app --reload
```

Admin site URL: `http://127.0.0.1:8000/`

## 4) Run desktop driver app (in another terminal)

```powershell
python driver_app/app.py
```

## 5) Run desktop passenger app (in another terminal)

```powershell
python passenger_app/app.py
```

Enter invite code and press `Продолжить` in each app.
Then open admin site and you will see counters/events update.

## Mobile migration direction

- Driver/Passenger apps use Kivy UI, so they are easier to adapt for Android and iOS later.
- Android packaging path: Buildozer.
- iOS packaging path: `kivy-ios` + Xcode signing/export.

## Optional quick scripts

```powershell
.\start_backend.ps1
.\start_driver_app.ps1
.\start_passenger_app.ps1
```

`start_backend.ps1` and bat launchers in `start/` set `DATABASE_URL` automatically if it is not defined (and try `docker compose up -d postgres` when Docker is installed).
They also run `python backend/setup_db.py` before backend startup to auto-create user/database/tables.
