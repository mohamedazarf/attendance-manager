from datetime import datetime, date, time
from app import utils
from typing import Dict, Any, List
from app.services.attendance_processing_service import AttendanceProcessingService
from app.schemas.processed_attendance import ProcessedAttendance
from app.config.attendance_config import AttendanceConfig


class DailyAttendanceDashboardService:

    def __init__(self):
        self.db = utils.get_db()
        self.logs_collection = self.db["attendance_logs"]
        self.employees_collection = self.db["employees"]
        self.justifications_collection = self.db["attendance_justifications"]
        self.processor = AttendanceProcessingService()

    def get_today_data(self, target_date: date = None):
        if not target_date:
            target_date = date.today()

        start_dt = datetime.combine(target_date, time.min)
        end_dt = datetime.combine(target_date, time.max)

        employees = list(self.employees_collection.find(
            {"is_active": True},
            {"_id": 0, "employee_code": 1, "name": 1}
        ))

        # Justifications
        justifications = {
            j["employee_id"]: j
            for j in self.justifications_collection.find(
                {"date": target_date.isoformat()},
                {"_id": 0}
            )
        }

        # Logs du jour
        logs = list(self.logs_collection.find({
            "timestamp": {"$gte": start_dt, "$lte": end_dt}
        }))

        # Normaliser timestamps
        for log in logs:
            ts = log.get("timestamp")
            if isinstance(ts, str):
                log["timestamp"] = datetime.fromisoformat(ts)
            elif isinstance(ts, datetime):
                log["timestamp"] = ts.replace(tzinfo=None)
            else:
                log["timestamp"] = None

        # Process logs une seule fois
        processed_map = self.processor.process_logs(logs)

        present_today = 0
        employees_data = []

        for emp in employees:
            emp_id = int(emp["employee_code"])
            key = (emp_id, target_date)

            processed = processed_map.get(key)

            if processed:
                status = "present"
                present_today += 1

                check_in = processed.check_in_time
                check_out = processed.check_out_time
                worked_hours = processed.total_hours_worked or 0
                is_late = processed.is_late
                late_minutes = processed.late_minutes if is_late else 0
                anomalies = processed.anomalies or []

                expected_hours = AttendanceConfig.get_expected_working_hours()
                extra_hours = round(worked_hours - expected_hours, 2) if worked_hours > expected_hours else 0

            else:
                status = "absent"
                check_in = None
                check_out = None
                worked_hours = 0
                is_late = False
                late_minutes = 0
                anomalies = []
                extra_hours = 0

            employees_data.append({
                "employee_id": emp_id,
                "employee_name": emp.get("name"),
                "status": status,
                "check_in_time": check_in.isoformat() if check_in else None,
                "check_out_time": check_out.isoformat() if check_out else None,
                "worked_hours": worked_hours,
                "is_late": is_late,
                "late_minutes": late_minutes,
                "anomalies": anomalies,
                "extra_hours": extra_hours,
                "justification": justifications.get(emp_id)
            })

        total_employees = len(employees)
        absent_today = total_employees - present_today

        attendance_rate = round(
            (present_today / total_employees) * 100, 2
        ) if total_employees else 0

        return {
            "date": target_date.isoformat(),
            "global": {
                "total_employees": total_employees,
                "present_today": present_today,
                "absent_today": absent_today,
                "attendance_rate": attendance_rate
            },
            "employees": employees_data
        }

