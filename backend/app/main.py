# ── Load .env FIRST — avant tout autre import ───────────────────────────────
from dotenv import load_dotenv
load_dotenv()  # charge backend/.env dans os.environ
# ─────────────────────────────────────────────────────────────────────────────

import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.api.v1.attendance import router as attendance_router
from app.api.v1.employee import router as employee_router
from app.api.v1.zk_test import router as testConnexion
from app.api.v1.fingerprint import router as fingerprint_router
from app.api.v1.users import router as users_router
from app.api.v1.attendance_manual import router as attendance_manual_router
from app.api.v1.device import router as device_router
from app.api.v1.auth import router as auth_router
from app.api.v1.roles import router as roles_router
from app.api.v1.email_report import router as email_report_router

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# APScheduler job — fires on the 1st of every month at 08:00
# ──────────────────────────────────────────────────────────────────────────────
scheduler = AsyncIOScheduler()


def send_monthly_report_job():
    """Rapport heures supplémentaires du mois précédent — déclenché automatiquement."""
    from app.services.overtime_report_service import OvertimeReportService

    now = datetime.now()
    if now.month == 1:
        report_year, report_month = now.year - 1, 12
    else:
        report_year, report_month = now.year, now.month - 1

    logger.info(
        f"[Scheduler] Déclenchement rapport mensuel : {report_year}-{report_month:02d}"
    )
    try:
        service = OvertimeReportService()
        result = service.send_monthly_report(year=report_year, month=report_month)
        logger.info(f"[Scheduler] Résultat : {result}")
    except Exception as e:
        logger.error(f"[Scheduler] Erreur lors du rapport mensuel : {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan — démarre le scheduler au startup, l'arrête au shutdown."""
    scheduler.add_job(
        send_monthly_report_job,
        trigger="cron",
        day=1,
        hour=8,
        minute=50,
        id="monthly_overtime_report",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("[Scheduler] APScheduler démarré — rapport mensuel le 1er à 08h00")
    yield
    scheduler.shutdown(wait=False)
    logger.info("[Scheduler] APScheduler arrêté")


# ──────────────────────────────────────────────────────────────────────────────
app = FastAPI(lifespan=lifespan)

# Allow your frontend origin
origins = [
    "http://localhost:5173",  # Vite dev server
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint for desktop app
@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "API is running"}

# Desktop app endpoints (no /v1/ prefix for compatibility)
app.include_router(fingerprint_router, prefix="/api/fingerprint")
app.include_router(users_router, prefix="/api/users")
app.include_router(attendance_manual_router, prefix="/api/attendance")
app.include_router(device_router, prefix="/api/device")

# Web app endpoints (with /v1/ prefix)
app.include_router(attendance_router, prefix="/api/v1/attendance")
app.include_router(employee_router, prefix="/api/v1/employee")
app.include_router(testConnexion, prefix="/api/v1/zk_test")
app.include_router(device_router, prefix="/api/v1/device")
app.include_router(attendance_manual_router, prefix="/api/v1/attendance")
app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(roles_router, prefix="/api/v1/roles")
app.include_router(email_report_router, prefix="/api/v1/email-report")
