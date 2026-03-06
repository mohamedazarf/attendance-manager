from datetime import datetime, timedelta, date, time as dtime
from typing import List, Dict, Tuple
from app.schemas.attendanceLog import AttendanceLog
from app.schemas.processed_attendance import (
    ProcessedAttendance,
    DailyAttendanceSummary,
    AttendanceCheckPoint,
)
from app.config.attendance_config import AttendanceConfig, AnomalyType
from app.services.day_rules_service import DayRulesService
from app.utils import to_datetime

class AttendanceProcessingService:
    """
    Service to process raw attendance logs and calculate working hours,
    detect anomalies, and generate summaries based on configurable business rules.
    """
    
    def __init__(self, config: AttendanceConfig = None):
        self.config = config or AttendanceConfig()
        self.day_rules_service = DayRulesService()
    
    def process_logs(self, logs: List[dict], user_departments: Dict[int, str] = None) -> Dict[Tuple[int, date], ProcessedAttendance]:
        """
        Process raw attendance logs and group by user_id and date.
        
        Args:
            logs: List of raw attendance logs with user_id and timestamp
            user_departments: Optional map of user_id to department name
            
        Returns:
            Dictionary with (user_id, date) as key and ProcessedAttendance as value
        """
        user_departments = user_departments or {}
        
        # Group logs by user_id and date
        grouped_logs: Dict[Tuple[int, date], List[dict]] = {}
        
        for log in logs:
            user_id = log["user_id"]
            timestamp = log["timestamp"]  # si c’est déjà un datetime
# ou pour être sûr :
            if isinstance(log["timestamp"], str):
                timestamp = datetime.fromisoformat(log["timestamp"])
            else:
                timestamp = log["timestamp"]

            log_date = timestamp.date()
            key = (user_id, log_date)
            
            if key not in grouped_logs:
                grouped_logs[key] = []
            grouped_logs[key].append(log)
        
        # Process each group
        processed = {}
        for (user_id, log_date), date_logs in grouped_logs.items():
            dept = user_departments.get(user_id, "employee")
            processed[(user_id, log_date)] = self._process_daily_logs(user_id, log_date, date_logs, department=dept)
        
        return processed

    
    def _process_daily_logs(self, user_id: int, log_date: date, logs: List[dict], department: str = "employee") -> ProcessedAttendance:
        """
        Process all logs for a specific user on a specific day.
        Determine in/out events and calculate hours.
        """
        # Remove duplicates and sort by timestamp
        unique_logs = self._deduplicate_logs(logs)
        unique_logs.sort(key=lambda x: to_datetime(x["timestamp"]))
        
        # Determine in/out events
        events = self._determine_events(unique_logs)
        
        # Create processed attendance record
        processed = ProcessedAttendance(
            user_id=user_id,
            date=log_date,
            events=events
        )
        
        # Set check-in and check-out times
        if events:
            processed.check_in_time = to_datetime(events[0].timestamp)
            # processed.check_out_time = to_datetime(events[-1].timestamp) if len(events) > 1 else None
            if len(events) > 1 and events[-1].event_type == "out":
                processed.check_out_time = to_datetime(events[-1].timestamp)
            else:
                processed.check_out_time = None
        # Calculate hours and detect anomalies
        self.calculate_hours(processed, department=department)
        self._detect_anomalies(processed, department=department)
        
        return processed

    
    def _deduplicate_logs(self, logs: List[dict]) -> List[dict]:
        """Remove duplicate logs (same user_id and timestamp within 5 seconds)"""
        if not logs:
            return []
        
        unique = [logs[0]]
        for log in logs[1:]:
            last_time = to_datetime(unique[-1]["timestamp"])
            curr_time = to_datetime(log["timestamp"])
            
            # If timestamps differ by more than 5 seconds, keep the log
            if (curr_time - last_time).total_seconds() > 5:
                unique.append(log)
        
        return unique
    
    def _determine_events(self, logs: List[dict]) -> List[AttendanceCheckPoint]:
        """
        Determine in/out events by alternating pattern.
        First event = in, Second = out, Third = in, etc.
        """
        events = []
        for order, log in enumerate(logs, 1):
            timestamp = to_datetime(log["timestamp"])  # si c’est déjà un datetime
# ou pour être sûr :
            if isinstance(log["timestamp"], str):
                timestamp = datetime.fromisoformat(log["timestamp"])
            else:
                timestamp = log["timestamp"]

            event_type = "in" if order % 2 == 1 else "out"
            
            events.append(AttendanceCheckPoint(
                timestamp=timestamp,
                event_type=event_type,
                event_order=order
            ))
        
        return events
    
    def _get_effective_department_times(
        self, processed: ProcessedAttendance, department: str = "employee"
    ) -> Dict[str, dtime]:
        """
        Resolve department working hours for a specific date, taking into
        account potential ramadan overrides.
        """
        dept_cfg = self.config.get_department_config(department)
        base_start = dept_cfg["start_time"]
        base_end = dept_cfg["end_time"]

        try:
            override = self.day_rules_service.get_department_hours_for_date(
                processed.date, department
            )
        except Exception:
            override = None

        if override:
            return {
                "start_time": override["start_time"],
                "end_time": override["end_time"],
            }

        return {"start_time": base_start, "end_time": base_end}

    def calculate_hours(self, processed: ProcessedAttendance, department: str = "employee"):
        """Calculate total working hours from in/out pairs"""
        if not processed.events:
            processed.total_hours_worked = 0.0
            return
        
        total_seconds = 0
        
        # Pair up in/out events
        for i in range(0, len(processed.events) - 1, 2):
            in_event = processed.events[i]
            out_event = processed.events[i + 1]
            
            if in_event.event_type == "in" and out_event.event_type == "out":
                duration = (out_event.timestamp - in_event.timestamp).total_seconds()
                total_seconds += duration
        
        # Convert to hours and subtract pause
        total_hours = total_seconds / 3600

        # Pas de pause pendant ramadhan (si horaires overrides définis)
        try:
            ramadan_override = self.day_rules_service.get_department_hours_for_date(
                processed.date, department
            )
        except Exception:
            ramadan_override = None

        if ramadan_override:
            pause_hours = 0
        else:
            pause_hours = self.config.PAUSE_DURATION / 60
        
        processed.total_hours_worked = max(0, total_hours - pause_hours)
        processed.pause_hours = pause_hours
        
        # Department-specific expected hours (with possible ramadan override)
        dept_times = self._get_effective_department_times(processed, department)
        start = dept_times["start_time"]
        end = dept_times["end_time"]
        
        total_seconds_expected = (
            end.hour * 3600 + end.minute * 60
        ) - (
            start.hour * 3600 + start.minute * 60
        )
        
        expected_hours = (total_seconds_expected / 3600) - pause_hours
        processed.expected_hours = expected_hours
    
    def _detect_anomalies(self, processed: ProcessedAttendance, department: str = "employee"):
        """Detect various types of attendance anomalies"""
        from datetime import timezone as dt_timezone
        
        anomalies = []
        
        dept_times = self._get_effective_department_times(processed, department)
        dept_start_time = dept_times["start_time"]
        dept_end_time = dept_times["end_time"]

        # Check for absence (no check-in)
        if not processed.events:
            anomalies.append(AnomalyType.ABSENCE)
            processed.has_anomaly = True
            processed.status = "absence"
            processed.anomalies = anomalies
            return
        
        # Check for late arrival
        if processed.check_in_time:
            # Create timezone-aware start time for comparison
            start_time = datetime.combine(processed.date, dept_start_time)
            start_time_utc = start_time.replace(tzinfo=None)
            start_with_tolerance = start_time_utc + timedelta(minutes=self.config.LATE_TOLERANCE)
            
            if processed.check_in_time > start_with_tolerance:
                late_minutes = int(
                    (processed.check_in_time - start_time_utc).total_seconds() / 60
                )
                anomalies.append(AnomalyType.RETARD)
                processed.is_late = True
                processed.late_minutes = late_minutes
        
        # Check for unpaired events
        unpaired_count = len(processed.events) % 2
        if unpaired_count == 1:  # Odd number of events
            last_event = processed.events[-1]
            if last_event.event_type == "in":
                anomalies.append(AnomalyType.ENTREE_SANS_SORTIE)
            else:
                anomalies.append(AnomalyType.SORTIE_SANS_ENTREE)
        
        # Check for early departure
        if processed.check_out_time:
            end_time = datetime.combine(processed.date, dept_end_time)
            end_time_utc = end_time.replace(tzinfo=None)
            
            if processed.check_out_time < end_time_utc:
                early_minutes = int(
                    (end_time_utc - processed.check_out_time).total_seconds() / 60
                )
                if early_minutes > self.config.EARLY_DEPARTURE_THRESHOLD:
                    anomalies.append(AnomalyType.EARLY_DEPARTURE)
        
        # Check if day is complete (both check-in and check-out)
        processed.is_complete_day = bool(processed.check_in_time and processed.check_out_time)
        if not processed.is_complete_day:
            anomalies.append(AnomalyType.INCOMPLETE_DAY)
        
        # # Check if worked less than expected
        # if processed.total_hours_worked < (processed.expected_hours * 0.9):  # 90% threshold
        #     anomalies.append(AnomalyType.INCOMPLETE_DAY)
        
        # Set anomaly status
        if anomalies:
            processed.has_anomaly = True
            processed.anomalies = list(set(anomalies))  # Remove duplicates
            processed.status = "anomaly"
        else:
            processed.status = "normal"

    
    def generate_summary(self, processed: ProcessedAttendance, employee_info: dict = None) -> DailyAttendanceSummary:
        """
        Generate a summary from processed attendance record.
        Optionally enrich with employee information.
        """
        summary = DailyAttendanceSummary(
            user_id=processed.user_id,
            date=processed.date,
            first_event=processed.check_in_time,
            last_event=processed.check_out_time,
            total_hours_worked=processed.total_hours_worked,
            expected_hours=processed.expected_hours,
            hours_difference=processed.total_hours_worked - processed.expected_hours,
            anomalies=processed.anomalies,
            status=processed.status,
            is_late=processed.is_late,
            late_minutes=processed.late_minutes if processed.is_late else 0
        )
        
        # Add employee info if available
        if employee_info:
            summary.employee_code = employee_info.get("employee_code")
            summary.employee_name = employee_info.get("name")
        
        return summary
