@echo off
setlocal
cd /d "%~dp0.."

set "PYTHON_EXE=python"
if exist ".venv\Scripts\python.exe" set "PYTHON_EXE=.venv\Scripts\python.exe"

start "Taxi Backend" cmd /k ""%PYTHON_EXE%" -m uvicorn backend.main:app --reload"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8000/"
start "Taxi Driver App" cmd /k ""%PYTHON_EXE%" driver_app\app.py"
start "Taxi Passenger App" cmd /k ""%PYTHON_EXE%" passenger_app\app.py"
