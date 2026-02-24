import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Dict
from app.config.attendance_config import AttendanceConfig

logger = logging.getLogger(__name__)


class EmailService:
    """
    Service d'envoi d'emails via SMTP (smtplib standard Python).
    Utilise les paramètres SMTP définis dans AttendanceConfig / .env
    """

    def __init__(self, config: AttendanceConfig = None):
        self.config = config or AttendanceConfig()

    def _build_html_body(
        self,
        period: str,
        employees: List[Dict],
        threshold: float
    ) -> str:
        """Construit le corps HTML de l'email."""
        rows = ""
        for emp in employees:
            rows += f"""
            <tr>
                <td style="padding:8px 12px; border-bottom:1px solid #e2e8f0;">{emp.get('employee_name', 'N/A')}</td>
                <td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; text-align:center;">{emp.get('employee_id', '')}</td>
                <td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; text-align:center; font-weight:bold; color:#e53e3e;">
                    {emp.get('monthly_hours_worked', 0):.1f}h
                </td>
                <td style="padding:8px 12px; border-bottom:1px solid #e2e8f0; text-align:center; color:#718096;">
                    {emp.get('days_present', 0)} / {emp.get('total_working_days', 0)} jours
                </td>
            </tr>"""

        return f"""
        <!DOCTYPE html>
        <html lang="fr">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; background:#f7fafc; margin:0; padding:20px;">
          <div style="max-width:700px; margin:auto; background:white; border-radius:8px;
                      box-shadow:0 2px 8px rgba(0,0,0,0.08); overflow:hidden;">

            <!-- Header -->
            <div style="background:#2d3748; padding:24px 32px;">
              <h1 style="color:white; margin:0; font-size:20px;">
                📋 Rapport Mensuel — Heures Supplémentaires
              </h1>
              <p style="color:#a0aec0; margin:6px 0 0 0; font-size:14px;">Période : {period}</p>
            </div>

            <!-- Body -->
            <div style="padding:24px 32px;">
              <p style="color:#4a5568; margin-bottom:20px;">
                Les employés suivants ont dépassé le seuil de
                <strong>{threshold:.0f} heures</strong> de travail ce mois-ci.
              </p>

              <table style="width:100%; border-collapse:collapse; font-size:14px;">
                <thead>
                  <tr style="background:#edf2f7;">
                    <th style="padding:10px 12px; text-align:left; color:#4a5568;">Employé</th>
                    <th style="padding:10px 12px; text-align:center; color:#4a5568;">ID</th>
                    <th style="padding:10px 12px; text-align:center; color:#4a5568;">Heures travaillées</th>
                    <th style="padding:10px 12px; text-align:center; color:#4a5568;">Présence</th>
                  </tr>
                </thead>
                <tbody>
                  {rows}
                </tbody>
              </table>

              <p style="margin-top:24px; color:#718096; font-size:13px;">
                Total : <strong>{len(employees)}</strong> employé(s) concerné(s).
              </p>
            </div>

            <!-- Footer -->
            <div style="background:#f7fafc; padding:16px 32px; border-top:1px solid #e2e8f0;">
              <p style="color:#a0aec0; font-size:12px; margin:0;">
                Ce rapport est généré automatiquement par le système de gestion de pointage.
              </p>
            </div>
          </div>
        </body>
        </html>
        """

    def send_overtime_report(
        self,
        admin_email: str,
        period: str,
        employees: List[Dict],
        threshold: float
    ) -> bool:
        """
        Envoie un email HTML à l'admin listant les employés en heures sup.

        Args:
            admin_email: Adresse email du destinataire (admin)
            period: Période au format "YYYY-MM" (ex: "2025-01")
            employees: Liste de dicts avec les infos employé
            threshold: Seuil d'heures mensuelles utilisé

        Returns:
            True si l'email a été envoyé avec succès, False sinon
        """
        if not self.config.SMTP_USER or not self.config.SMTP_PASSWORD:
            logger.error(
                "SMTP_USER ou SMTP_PASSWORD non configuré dans .env. "
                "Email non envoyé."
            )
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"[Pointage] Rapport heures supplémentaires — {period}"
            msg["From"] = self.config.SMTP_USER
            msg["To"] = admin_email

            html_body = self._build_html_body(period, employees, threshold)
            msg.attach(MIMEText(html_body, "html", "utf-8"))

            with smtplib.SMTP(self.config.SMTP_HOST, self.config.SMTP_PORT) as server:
                if self.config.SMTP_USE_TLS:
                    server.starttls()
                server.login(self.config.SMTP_USER, self.config.SMTP_PASSWORD)
                server.sendmail(self.config.SMTP_USER, admin_email, msg.as_string())

            logger.info(
                f"Rapport heures sup envoyé à {admin_email} pour la période {period} "
                f"({len(employees)} employé(s))"
            )
            return True

        except smtplib.SMTPAuthenticationError:
            logger.error("Échec authentification SMTP — vérifiez SMTP_USER / SMTP_PASSWORD dans .env")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"Erreur SMTP lors de l'envoi du rapport : {e}")
            return False
        except Exception as e:
            logger.error(f"Erreur inattendue lors de l'envoi de l'email : {e}")
            return False
