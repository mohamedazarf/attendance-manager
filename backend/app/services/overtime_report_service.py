import logging
from datetime import datetime
from typing import List, Dict
from calendar import month_name

from app.config.attendance_config import AttendanceConfig
from app.services.attendance_metrics_service import AttendanceMetricsService
from app.services.email_service import EmailService
from app import utils

logger = logging.getLogger(__name__)


class OvertimeReportService:
    """
    Service qui orchestre le rapport mensuel des heures supplémentaires :
    1. Récupère les métriques mensuelles de chaque employé
    2. Filtre ceux qui dépassent le seuil configurable
    3. Envoie le rapport par email à l'admin
    """

    def __init__(self, config: AttendanceConfig = None):
        self.config = config or AttendanceConfig()
        self.metrics_service = AttendanceMetricsService()
        self.email_service = EmailService(self.config)

    def get_overtime_employees(
        self,
        year: int,
        month: int,
        threshold_hours: float = None
    ) -> List[Dict]:
        """
        Retourne la liste des employés ayant dépassé le seuil d'heures mensuel.

        Args:
            year: Année (ex: 2025)
            month: Mois (1-12)
            threshold_hours: Seuil en heures (utilise la config par défaut si None)

        Returns:
            Liste de dicts avec les infos de chaque employé en dépassement
        """
        if threshold_hours is None:
            threshold_hours = self.config.OVERTIME_THRESHOLD_HOURS

        db = utils.get_db()
        employees_collection = db["employees"]
        employees = list(employees_collection.find({}, {"_id": 0}))

        overtime_employees = []

        for employee in employees:
            emp_code = employee.get("employee_code")
            if not emp_code:
                continue

            try:
                emp_id = int(emp_code)
            except (ValueError, TypeError):
                logger.warning(f"employee_code invalide : {emp_code} — ignoré")
                continue

            try:
                metrics = self.metrics_service.get_employee_attendance_status(
                    emp_id, year, month
                )
            except Exception as e:
                logger.error(
                    f"Erreur calcul métriques pour employé {emp_id} "
                    f"({year}-{month:02d}) : {e}"
                )
                continue

            monthly_hours = metrics.get("monthly_hours_worked", 0.0)

            if monthly_hours > threshold_hours:
                overtime_employees.append({
                    "employee_id": emp_id,
                    "employee_name": employee.get("name", "Inconnu"),
                    "employee_code": emp_code,
                    "monthly_hours_worked": monthly_hours,
                    "days_present": metrics.get("days_present", 0),
                    "total_working_days": metrics.get("total_working_days", 0),
                    "presence_rate": metrics.get("presence_rate", 0),
                    "overtime_hours": round(monthly_hours - threshold_hours, 2),
                    "period": f"{year}-{month:02d}",
                })

        # Trier par heures décroissantes
        overtime_employees.sort(
            key=lambda x: x["monthly_hours_worked"], reverse=True
        )

        return overtime_employees

    def send_monthly_report(
        self,
        year: int,
        month: int,
        threshold_hours: float = None,
        admin_email: str = None
    ) -> Dict:
        """
        Calcule les dépassements et envoie l'email à l'admin.
        C'est cette méthode qui est appelée par le scheduler APScheduler.

        Args:
            year: Année du rapport
            month: Mois du rapport (1-12)
            threshold_hours: Seuil heures (config par défaut si None)
            admin_email: Destinataire (config par défaut si None)

        Returns:
            Dict résumant le résultat (success, employees_count, etc.)
        """
        if threshold_hours is None:
            threshold_hours = self.config.OVERTIME_THRESHOLD_HOURS
        if admin_email is None:
            admin_email = self.config.ADMIN_EMAIL

        period = f"{year}-{month:02d}"

        logger.info(
            f"Génération du rapport heures sup — période {period}, "
            f"seuil={threshold_hours}h, destinataire={admin_email}"
        )

        overtime_employees = self.get_overtime_employees(year, month, threshold_hours)

        if not overtime_employees:
            logger.info(
                f"Aucun employé n'a dépassé {threshold_hours}h pour {period}. "
                "Email non envoyé."
            )
            return {
                "success": True,
                "email_sent": False,
                "reason": "no_overtime_employees",
                "period": period,
                "threshold_hours": threshold_hours,
                "employees_count": 0,
                "employees": [],
            }

        email_sent = self.email_service.send_overtime_report(
            admin_email=admin_email,
            period=period,
            employees=overtime_employees,
            threshold=threshold_hours,
        )

        return {
            "success": True,
            "email_sent": email_sent,
            "period": period,
            "threshold_hours": threshold_hours,
            "admin_email": admin_email,
            "employees_count": len(overtime_employees),
            "employees": overtime_employees,
        }
