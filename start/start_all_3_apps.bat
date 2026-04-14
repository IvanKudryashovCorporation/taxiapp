@echo off
setlocal
cd /d "%~dp0.."

set "PYTHON_EXE=python"

if not defined DATABASE_URL set "DATABASE_URL=postgresql://taxiapp:taxiapp@127.0.0.1:5432/taxiapp"
where docker >nul 2>nul && docker compose up -d postgres >nul 2>nul
"%PYTHON_EXE%" backend\setup_db.py
if errorlevel 1 (
  echo PostgreSQL bootstrap failed. Fix DB connection and run again.
  pause
  exit /b 1
)

start "Taxi Backend" cmd /k ""%PYTHON_EXE%" -m uvicorn backend.main:app --reload"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8000/"
start "Taxi Driver App" cmd /k ""%PYTHON_EXE%" driver_app\app.py"
start "Taxi Passenger App" cmd /k ""%PYTHON_EXE%" passenger_app\app.py"
