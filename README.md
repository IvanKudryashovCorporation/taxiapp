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

## 2) Run backend (admin web site)

```powershell
python -m uvicorn backend.main:app --reload
```

Admin site URL: `http://127.0.0.1:8000/`

## 3) Run desktop driver app (in another terminal)

```powershell
python driver_app/app.py
```

## 4) Run desktop passenger app (in another terminal)

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
