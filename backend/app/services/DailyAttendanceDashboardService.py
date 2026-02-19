from datetime import datetime, date, time
from app import utils
from typing import Dict, Any, List
from app.services.attendance_processing_service import AttendanceProcessingService
from app.schemas.processed_attendance import ProcessedAttendance, DailyAttendanceSummary, AttendanceCheckPoint
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

        # Récupérer les justifications du jour
        justifications = {
            j["employee_id"]: j for j in self.justifications_collection.find(
                {"date": target_date.isoformat()}, {"_id": 0}
            )
        }

        # Récupérer les logs du jour
        logs = list(self.logs_collection.find({
            "timestamp": {"$gte": start_dt, "$lte": end_dt}
        }))

        # ⚡ Normaliser tous les timestamps en datetime naive
        for log in logs:
            ts = log.get("timestamp")
            if isinstance(ts, str):
                log["timestamp"] = datetime.fromisoformat(ts)
            elif isinstance(ts, datetime):
                log["timestamp"] = ts.replace(tzinfo=None)  # enlever timezone si present
            else:
                log["timestamp"] = None  # fallback

        # self.processor.process_logs(logs)  # Process logs to detect anomalies, late arrivals, etc.

        # Grouper par employé
        logs_by_employee = {}
        for log in logs:
            emp_id = int(log["user_id"])
            logs_by_employee.setdefault(emp_id, []).append(log)

        present_today = 0
        employees_data = []

       # Process logs once
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
                worked_hours = processed.total_hours_worked
                is_late = processed.is_late
                late_minutes = processed.late_minutes if is_late else 0
                anomalies = processed.anomalies
                extra_hours = 0

                expected_hours = AttendanceConfig.get_expected_working_hours()
                if worked_hours > expected_hours:
                    extra_hours = round(worked_hours - expected_hours, 2)

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
                    "check_in_time": check_in,
                    "check_out_time": check_out,
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



