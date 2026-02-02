from datetime import datetime, date, timedelta, time
from typing import List, Dict, Optional
from calendar import monthrange
from app.repositories.attendanceRepo import AttendanceRepository
from app import utils


class AttendanceMetricsService:
    """
    Service to calculate attendance metrics including presence rate,
    absence rate, and other statistics per employee.
    """

    def __init__(self):
        db = utils.get_db()
        self.attendance_repo = AttendanceRepository(db["attendance_logs"])
        self.db = db

    def _is_weekend(self, date_obj: date) -> bool:
        """Check if date is Saturday (5) or Sunday (6)"""
        return date_obj.weekday() >= 5

    def _calculate_weekend_hours(self, logs: List[dict]) -> tuple:
        """Calculate weekend days worked and hours. Returns (days, hours)"""
        # Sort logs by timestamp first
        try:
            sorted_logs = sorted(logs, key=lambda x: x.get("timestamp", ""))
        except:
            sorted_logs = logs
        
        weekend_days = set()
        weekend_hours = 0.0
        
        for i in range(0, len(sorted_logs) - 1, 2):
            try:
                ts1 = sorted_logs[i].get("timestamp")
                ts2 = sorted_logs[i + 1].get("timestamp")
                
                # Handle both datetime objects and strings
                if isinstance(ts1, datetime):
                    dt1 = ts1
                else:
                    ts1_str = str(ts1).replace("+00:00", "")  # Remove timezone
                    dt1 = datetime.fromisoformat(ts1_str)
                
                if isinstance(ts2, datetime):
                    dt2 = ts2
                else:
                    ts2_str = str(ts2).replace("+00:00", "")  # Remove timezone
                    dt2 = datetime.fromisoformat(ts2_str)
                
                if self._is_weekend(dt1.date()):
                    weekend_days.add(dt1.date())
                    hours = (dt2 - dt1).total_seconds() / 3600
                    if hours > 0:
                        weekend_hours += hours
            except Exception as e:
                continue
        
        return len(weekend_days), round(weekend_hours, 2)

    def get_working_days_in_month(self, year: int, month: int) -> int:
        """
        Calculate number of working days (Monday-Friday) in a given month.
        
        Args:
            year: Year (e.g., 2024)
            month: Month (1-12)
            
        Returns:
            Number of working days
        """
        working_days = 0
        _, last_day = monthrange(year, month)
        
        for day in range(1, last_day + 1):
            current_date = date(year, month, day)
            # 0=Monday, 6=Sunday
            if current_date.weekday() < 5:  # Monday to Friday
                working_days += 1
        
        return working_days

    def get_employee_attendance_status(
        self, 
        employee_id: int, 
        year: int, 
        month: int
    ) -> Dict:
        """
        Get detailed attendance metrics for an employee in a specific month.
        
        Args:
            employee_id: Employee ID
            year: Year (e.g., 2024)
            month: Month (1-12)
            
        Returns:
            Dictionary with attendance metrics
        """
        # Get start and end dates for the month
        start_date = datetime(year, month, 1)
        _, last_day = monthrange(year, month)
        end_date = datetime(year, month, last_day, 23, 59, 59)
        
        # Get all attendance logs for employee in this month
        db = utils.get_db()
        collection = db["attendance_logs"]
        
        logs = list(collection.find({
            "user_id": employee_id,
            "timestamp": {
                "$gte": start_date,
                "$lte": end_date
            }
        }))
        
        # Count days with at least one attendance log
        days_with_attendance = set()
        for log in logs:
            log_date = log["timestamp"].date()  # Extract YYYY-MM-DD
            days_with_attendance.add(log_date)
        
        # Calculate weekend metrics
        weekend_days, weekend_hours = self._calculate_weekend_hours(logs)
        
        # Calculate metrics
        working_days = self.get_working_days_in_month(year, month)
        days_present = len(days_with_attendance)
        days_absent = working_days - days_present
        
        # Prevent division by zero
        if working_days == 0:
            presence_rate = 0
            absence_rate = 0
        else:
            presence_rate = round((days_present / working_days) * 100, 2)
            absence_rate = round((days_absent / working_days) * 100, 2)
        
        return {
            "employee_id": employee_id,
            "year": year,
            "month": month,
            "period": f"{year}-{month:02d}",
            "total_working_days": working_days,
            "days_present": days_present,
            "days_absent": days_absent,
            "presence_rate": presence_rate,
            "absence_rate": absence_rate,
            "attendance_count": len(logs),
            "weekend_days_worked": weekend_days,
            "weekend_hours_worked": weekend_hours
        }

    def get_all_employees_metrics(
        self,
        year: int,
        month: int
    ) -> List[Dict]:
        """
        Get attendance metrics for all employees in a specific month.
        
        Args:
            year: Year (e.g., 2024)
            month: Month (1-12)
            
        Returns:
            List of dictionaries with metrics for each employee
        """
        db = utils.get_db()
        attendance_collection = db["attendance_logs"]
        employees_collection = db["employees"]
        
        # Get all employees (exclude _id to avoid ObjectId serialization issues)
        employees = list(employees_collection.find({}, {"_id": 0, "name": 1, "employee_code": 1}))
        
        # Get metrics for each employee
        metrics_list = []
        for employee in employees:
            # emp_id = employee.get("employee_code") or employee.get("_id")
            emp_id = int(employee.get("employee_code")) if employee.get("employee_code") else employee.get("_id")
            metrics = self.get_employee_attendance_status(emp_id, year, month)
            metrics["employee_name"] = employee.get("name", "Unknown")
            metrics_list.append(metrics)
        
        return metrics_list

  

    def get_employee_metrics_date_range(
        self,
        employee_id: int,
        start_date: date,
        end_date: date
    ) -> Dict:
        db = utils.get_db()
        collection = db["attendance_logs"]

        logs = list(collection.find({
            "user_id": employee_id,
            "timestamp": {
                "$gte": datetime.combine(start_date, time.min),
                "$lte": datetime.combine(end_date, time.max)
            }
        }))

        days_with_attendance = set()
        for log in logs:
            log_date = log["timestamp"].date()
            days_with_attendance.add(log_date)

        # Calculate weekend metrics
        weekend_days, weekend_hours = self._calculate_weekend_hours(logs)

        total_working_days = 0
        current_date = start_date
        while current_date <= end_date:
            if current_date.weekday() < 5:
                total_working_days += 1
            current_date += timedelta(days=1)

        days_present = len(days_with_attendance)
        days_absent = total_working_days - days_present

        if total_working_days == 0:
            presence_rate = 0
            absence_rate = 0
        else:
            presence_rate = round((days_present / total_working_days) * 100, 2)
            absence_rate = round((days_absent / total_working_days) * 100, 2)

        return {
            "employee_id": employee_id,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "total_working_days": total_working_days,
            "days_present": days_present,
            "days_absent": days_absent,
            "presence_rate": presence_rate,
            "absence_rate": absence_rate,
            "attendance_count": len(logs),
            "weekend_days_worked": weekend_days,
            "weekend_hours_worked": weekend_hours
        }
