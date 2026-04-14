from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import HTMLResponse

from backend.database import close_pool, init_db
from backend.routers import auth, driver, health, legacy_chat, operator, passenger, ws

COMPANY_NAME = 'Профсоюз "Рассвет"'
BASE_DIR = Path(__file__).resolve().parent
ADMIN_HTML_PATH = BASE_DIR / "admin_page.html"

app = FastAPI(title=f"{COMPANY_NAME} Backend")


@app.on_event("startup")
def _startup() -> None:
    init_db()


@app.on_event("shutdown")
def _shutdown() -> None:
    close_pool()


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(passenger.router)
app.include_router(driver.router)
app.include_router(operator.router)
app.include_router(legacy_chat.router)
app.include_router(ws.router)


@app.get("/", response_class=HTMLResponse)
def admin_page() -> str:
    return ADMIN_HTML_PATH.read_text(encoding="utf-8")
