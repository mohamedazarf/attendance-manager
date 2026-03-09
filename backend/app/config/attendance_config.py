from datetime import time
from typing import Dict, Any
import os
from pathlib import Path
from dotenv import load_dotenv

# Chemin absolu vers le .env — robuste peu importe d'où on lance uvicorn
_ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=_ENV_PATH, override=True)

class AttendanceConfig:
    """
    Configurable business rules for attendance calculation.
    All times are in HH:MM format.
    """
    
    # Device Connection Config
    DEVICE_IP = os.getenv("DEVICE_IP", "192.168.100.5")
    DEVICE_PORT = int(os.getenv("DEVICE_PORT", "4370"))

    # Standard working hours
    START_TIME = time(8, 30)      # 8:30 AM
    END_TIME = time(17, 30)        # 5:30 PM
    
    # Department-specific configurations
    DEPARTMENT_CONFIG = {
        "administration": {
            "start_time": time(8, 30),
            "end_time": time(17, 30)
        },
        "employee": {
            "start_time": time(7, 30),
            "end_time": time(16, 30)
        }
    }

    @staticmethod
    def get_department_config(department: str = None) -> dict:
        """Get work hours for a specific department. Defaults to administration if unknown."""
        department = (department or "administration").lower()
        return AttendanceConfig.DEPARTMENT_CONFIG.get(
            department, 
            AttendanceConfig.DEPARTMENT_CONFIG["employee"]
        )

    # Pause/Break duration (in minutes)
    PAUSE_DURATION = 75           # 1 hour and 15 minutes lunch break
    
    # Tolerance for late arrival (in minutes)
    LATE_TOLERANCE = 0           # Allow 0 min grace period

    OVERTIME_THRESHOLD = 173.33  # Monthly overtime threshold (hours)

    
    # Thresholds for anomalies
    EARLY_DEPARTURE_THRESHOLD = 30  # Leave more than 30 min early = anomaly

    # ── Overtime / Monthly Email Alert ─────────────────────────────────────
    # Ces valeurs sont lues dynamiquement depuis os.environ à chaque appel
    # pour éviter le problème de cache Python au moment de l'import.

    @classmethod
    def get_overtime_threshold(cls) -> float:
        return float(os.getenv("OVERTIME_THRESHOLD_HOURS", "173.33"))

    @classmethod
    def get_admin_email(cls) -> str:
        return os.getenv("ADMIN_EMAIL", "admin@example.com")

    @classmethod
    def get_smtp_host(cls) -> str:
        return os.getenv("SMTP_HOST", "smtp.gmail.com")

    @classmethod
    def get_smtp_port(cls) -> int:
        return int(os.getenv("SMTP_PORT", "587"))

    @classmethod
    def get_smtp_user(cls) -> str:
        return os.getenv("SMTP_USER", "")

    @classmethod
    def get_smtp_password(cls) -> str:
        return os.getenv("SMTP_PASSWORD", "")

    @classmethod
    def get_smtp_use_tls(cls) -> bool:
        return os.getenv("SMTP_USE_TLS", "true").lower() == "true"

    # Propriétés de classe pour la compatibilité avec le code existant
    # (= appel dynamique à chaque accès)
    @property
    def OVERTIME_THRESHOLD_HOURS(self) -> float:
        return self.get_overtime_threshold()

    @property
    def ADMIN_EMAIL(self) -> str:
        return self.get_admin_email()

    @property
    def SMTP_HOST(self) -> str:
        return self.get_smtp_host()

    @property
    def SMTP_PORT(self) -> int:
        return self.get_smtp_port()

    @property
    def SMTP_USER(self) -> str:
        return self.get_smtp_user()

    @property
    def SMTP_PASSWORD(self) -> str:
        return self.get_smtp_password()

    @property
    def SMTP_USE_TLS(self) -> bool:
        return self.get_smtp_use_tls()


    @staticmethod
    def get_expected_working_hours() -> float:
        """Calculate expected working hours per day"""
        start = AttendanceConfig.START_TIME
        end = AttendanceConfig.END_TIME
        
        total_seconds = (
            end.hour * 3600 + end.minute * 60
        ) - (
            start.hour * 3600 + start.minute * 60
        )
        
        expected_hours = (total_seconds / 3600) - (AttendanceConfig.PAUSE_DURATION / 60)
        return expected_hours
    


class AnomalyType:
    """Types of attendance anomalies"""
    ABSENCE = "absence"                      # No check-in for the day
    RETARD = "retard"                        # Late arrival
    ENTREE_SANS_SORTIE = "entree_sans_sortie"  # Check-in without check-out
    SORTIE_SANS_ENTREE = "sortie_sans_entree"  # Check-out without check-in
    EARLY_DEPARTURE = "early_departure"      # Left significantly early
    INCOMPLETE_DAY = "incomplete_day"         # Day not fully worked
