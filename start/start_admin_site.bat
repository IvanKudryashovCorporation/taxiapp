@echo off
setlocal
cd /d "%~dp0.."

set "PYTHON_EXE=python"
if exist ".venv\Scripts\python.exe" set "PYTHON_EXE=.venv\Scripts\python.exe"

start "Taxi Admin Backend" cmd /k ""%PYTHON_EXE%" -m uvicorn backend.main:app --reload"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8000/"
