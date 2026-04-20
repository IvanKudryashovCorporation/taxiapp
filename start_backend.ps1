Set-Location "$PSScriptRoot"

if (-not $env:DATABASE_URL) {
    $env:DATABASE_URL = "postgresql://taxiapp:taxiapp@127.0.0.1:5432/taxiapp"
}

if (Get-Command docker -ErrorAction SilentlyContinue) {
    docker compose up -d postgres | Out-Null
}

python backend/setup_db.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "PostgreSQL bootstrap failed. Fix DB connection and run again." -ForegroundColor Red
    exit $LASTEXITCODE
}

python -m uvicorn backend.main:app --reload --host 0.0.0.0
