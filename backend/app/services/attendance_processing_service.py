from datetime import datetime, timedelta, date, time as dtime
from typing import List, Dict, Tuple
from app.schemas.attendanceLog import AttendanceLog
from app.schemas.processed_attendance import ProcessedAttendance, DailyAttendanceSummary, AttendanceCheckPoint
from app.config.attendance_config import AttendanceConfig, AnomalyType
from app.utils import to_datetime

class AttendanceProcessingService:
    """
    Service to process raw attendance logs and calculate working hours,
    detect anomalies, and generate summaries based on configurable business rules.
    """
    
    def __init__(self, config: AttendanceConfig = None):
        self.config = config or AttendanceConfig()
    
    def process_logs(self, logs: List[dict]) -> Dict[Tuple[int, date], ProcessedAttendance]:
        """
        Process raw attendance logs and group by user_id and date.
        
        Args:
            logs: List of raw attendance logs with user_id and timestamp
            
        Returns:
            Dictionary with (user_id, date) as key and ProcessedAttendance as value
        """
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
            processed[(user_id, log_date)] = self._process_daily_logs(user_id, log_date, date_logs)
        
        return processed
    
    def _process_daily_logs(self, user_id: int, log_date: date, logs: List[dict]) -> ProcessedAttendance:
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
            processed.check_out_time = to_datetime(events[-1].timestamp) if len(events) > 1 else None
        
        # Calculate hours and detect anomalies
        self.calculate_hours(processed)
        self._detect_anomalies(processed)
        
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
    
    def calculate_hours(self, processed: ProcessedAttendance):
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
        pause_hours = self.config.PAUSE_DURATION / 60
        
        processed.total_hours_worked = max(0, total_hours - pause_hours)
        processed.pause_hours = pause_hours
        processed.expected_hours = self.config.get_expected_working_hours()
    
    def _detect_anomalies(self, processed: ProcessedAttendance):
        """Detect various types of attendance anomalies"""
        from datetime import timezone as dt_timezone
        
        anomalies = []
        
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
            start_time = datetime.combine(processed.date, self.config.START_TIME)
            start_time_utc = start_time.replace(tzinfo=None)
            start_with_tolerance = start_time_utc + timedelta(minutes=self.config.LATE_TOLERANCE)
            
            if to_datetime(processed.check_in_time) > to_datetime(start_with_tolerance):
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
            end_time = datetime.combine(processed.date, self.config.END_TIME)
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
        
        # Check if worked less than expected
        if processed.total_hours_worked < (processed.expected_hours * 0.9):  # 90% threshold
            anomalies.append(AnomalyType.INCOMPLETE_DAY)
        
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
            status=processed.status
        )
        
        # Add employee info if available
        if employee_info:
            summary.employee_code = employee_info.get("employee_code")
            summary.employee_name = employee_info.get("name")
        
        return summary
