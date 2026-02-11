from datetime import time
from typing import Dict, Any

class AttendanceConfig:
    """
    Configurable business rules for attendance calculation.
    All times are in HH:MM format.
    """
    
    # Standard working hours
    START_TIME = time(8, 30)      # 8:30 AM
    END_TIME = time(12, 30)        # 5:30 PM
    
    # Pause/Break duration (in minutes)
    PAUSE_DURATION = 60           # 1 hour lunch break
    
    # Tolerance for late arrival (in minutes)
    LATE_TOLERANCE = 0           # Allow 0 min grace period
    
    # Thresholds for anomalies
    EARLY_DEPARTURE_THRESHOLD = 30  # Leave more than 30 min early = anomaly
    
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
