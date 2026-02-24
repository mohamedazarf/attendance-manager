from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime

from app.config.attendance_config import AttendanceConfig
from app.services.overtime_report_service import OvertimeReportService

router = APIRouter()


# ──────────────────────────────────────────────────────────────────────────────
# GET /overtime-employees
# Retourne la liste des employés en dépassement sans envoyer d'email
# ──────────────────────────────────────────────────────────────────────────────
@router.get("/overtime-employees")
def get_overtime_employees(
    year: int = Query(..., description="Année (ex: 2025)"),
    month: int = Query(..., ge=1, le=12, description="Mois (1-12)"),
    threshold_hours: Optional[float] = Query(
        None,
        description="Seuil d'heures mensuelles (défaut: valeur config)"
    ),
):
    """
    Retourne la liste des employés ayant dépassé le seuil d'heures mensuel.
    N'envoie PAS d'email — utile pour prévisualiser le rapport.
    """
    service = OvertimeReportService()
    effective_threshold = threshold_hours or service.config.OVERTIME_THRESHOLD_HOURS

    employees = service.get_overtime_employees(year, month, effective_threshold)

    return {
        "status": "success",
        "period": f"{year}-{month:02d}",
        "threshold_hours": effective_threshold,
        "employees_count": len(employees),
        "data": employees,
    }


# ──────────────────────────────────────────────────────────────────────────────
# POST /send
# Déclenche manuellement l'envoi de l'email rapport à l'admin
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/send")
@router.get("/send")
def send_monthly_report(
    year: Optional[int] = Query(
        None,
        description="Année (défaut: mois précédent)"
    ),
    month: Optional[int] = Query(
        None,
        ge=1, le=12,
        description="Mois (défaut: mois précédent)"
    ),
    threshold_hours: Optional[float] = Query(
        None,
        description="Seuil d'heures (défaut: valeur config)"
    ),
    admin_email: Optional[str] = Query(
        None,
        description="Email destinataire (défaut: valeur config)"
    ),
):
    """
    Déclenche manuellement l'envoi du rapport mensuel des heures supplémentaires.
    Par défaut, utilise le mois précédent et les paramètres de la config.
    """
    now = datetime.now()

    # Par défaut : mois précédent
    if year is None or month is None:
        if now.month == 1:
            default_year = now.year - 1
            default_month = 12
        else:
            default_year = now.year
            default_month = now.month - 1
        year = year or default_year
        month = month or default_month

    try:
        service = OvertimeReportService()
        result = service.send_monthly_report(
            year=year,
            month=month,
            threshold_hours=threshold_hours,
            admin_email=admin_email,
        )
        return {"status": "success", **result}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ──────────────────────────────────────────────────────────────────────────────
# GET /config — Lire la configuration actuelle
# ──────────────────────────────────────────────────────────────────────────────
@router.get("/config")
def get_email_report_config():
    """
    Retourne la configuration actuelle du rapport email.
    Les valeurs proviennent de AttendanceConfig / .env
    """
    return {
        "status": "success",
        "config": {
            "overtime_threshold_hours": AttendanceConfig.get_overtime_threshold(),
            "admin_email": AttendanceConfig.get_admin_email(),
            "smtp_host": AttendanceConfig.get_smtp_host(),
            "smtp_port": AttendanceConfig.get_smtp_port(),
            "smtp_use_tls": AttendanceConfig.get_smtp_use_tls(),
            "smtp_user_configured": bool(AttendanceConfig.get_smtp_user()),
            "smtp_password_configured": bool(AttendanceConfig.get_smtp_password()),
        },
    }
