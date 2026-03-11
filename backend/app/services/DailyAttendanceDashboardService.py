from datetime import datetime, date, time
from typing import Dict, Any, List

from app import utils
from app.config.attendance_config import AttendanceConfig
from app.schemas.processed_attendance import ProcessedAttendance
from app.services.attendance_processing_service import AttendanceProcessingService
from app.services.day_rules_service import DayRulesService


class DailyAttendanceDashboardService:
    def __init__(self):
        self.db = utils.get_db()
        self.logs_collection = self.db["attendance_logs"]
        self.employees_collection = self.db["employees"]
        self.justifications_collection = self.db["attendance_justifications"]
        self.processor = AttendanceProcessingService()
        self.day_rules_service = DayRulesService()

    def _is_employee_remote(self, start_str: str | None, end_str: str | None, target_date: date) -> bool:
        if not start_str and not end_str:
            return False
            
        start_d = None
        end_d = None
        if start_str:
            try:
                start_d = date.fromisoformat(start_str)
            except ValueError:
                pass
                
        if end_str:
            try:
                end_d = date.fromisoformat(end_str)
            except ValueError:
                pass
                
        if start_d and target_date < start_d:
            return False
        if end_d and target_date > end_d:
            return False
            
        return True

    def _build_ramadan_context(self, target_date: date) -> Dict[str, Any]:
        """
        Retourne un petit contexte ramadhan pour la date:
        {
          "is_ramadan": bool,
          "departments": {
             "administration": {"start_time": "HH:MM", "end_time": "HH:MM"},
             "employee": {"start_time": "HH:MM", "end_time": "HH:MM"},
             ...
          }
        }
        """
        cfg = self.day_rules_service.get_ramadan_config()
        start_iso = cfg.get("start_date")
        end_iso = cfg.get("end_date")
        if not start_iso or not end_iso:
            return {"is_ramadan": False, "departments": {}}

        try:
            start_d = date.fromisoformat(start_iso)
            end_d = date.fromisoformat(end_iso)
        except ValueError:
            return {"is_ramadan": False, "departments": {}}

        if not (start_d <= target_date <= end_d):
            return {"is_ramadan": False, "departments": {}}

        return {
            "is_ramadan": True,
            "departments": cfg.get("departments", {}) or {},
        }

    def get_today_data(self, target_date: date = None):
        if not target_date:
            target_date = date.today()
        day_context = self.day_rules_service.get_day_context(target_date)
        ramadan_context = self._build_ramadan_context(target_date)

        start_dt = datetime.combine(target_date, time.min)
        end_dt = datetime.combine(target_date, time.max)

        employees = list(
            self.employees_collection.find(
                {"is_active": True},
                {"_id": 0, "employee_code": 1, "name": 1, "department": 1, "remote_start_date": 1, "remote_end_date": 1},
            )
        )

        # Build user_id -> department map
        user_departments: Dict[int, str] = {}
        for emp in employees:
            try:
                user_departments[int(emp["employee_code"])] = emp.get(
                    "department", "usine"
                )
            except (ValueError, TypeError):
                continue

        # Justifications
        justifications = {
            j["employee_id"]: j
            for j in self.justifications_collection.find(
                {"date": target_date.isoformat()}, {"_id": 0}
            )
        }

        # Logs du jour
        logs = list(
            self.logs_collection.find(
                {"timestamp": {"$gte": start_dt, "$lte": end_dt}}
            )
        )

        # Normaliser timestamps
        for log in logs:
            ts = log.get("timestamp")
            if isinstance(ts, str):
                log["timestamp"] = datetime.fromisoformat(ts)
            elif isinstance(ts, datetime):
                log["timestamp"] = ts.replace(tzinfo=None)
            else:
                log["timestamp"] = None

        # Process logs with department info
        processed_map = self.processor.process_logs(
            logs, user_departments=user_departments
        )

        present_today = 0
        remote_today = 0
        employees_data: List[Dict[str, Any]] = []

        for emp in employees:
            emp_id = int(emp["employee_code"])
            key = (emp_id, target_date)

            processed: ProcessedAttendance | None = processed_map.get(key)

            if processed:
                status = "present"
                present_today += 1

                check_in = processed.check_in_time
                check_out = processed.check_out_time
                worked_hours = processed.total_hours_worked or 0
                is_late = processed.is_late
                late_minutes = processed.late_minutes if is_late else 0
                anomalies = processed.anomalies or []

                expected_hours = processed.expected_hours
                extra_hours = (
                    round(worked_hours - expected_hours, 2)
                    if worked_hours > expected_hours
                    else 0
                )
            else:
                if self._is_employee_remote(emp.get("remote_start_date"), emp.get("remote_end_date"), target_date):
                    status = "remote"
                    remote_today += 1
                else:
                    status = "absent"
                check_in = None
                check_out = None
                worked_hours = 0
                is_late = False
                late_minutes = 0
                anomalies = []
                extra_hours = 0

            employees_data.append(
                {
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
                    "justification": justifications.get(emp_id),
                }
            )

        total_employees = len(employees)
        raw_absent_today = sum(1 for e in employees_data if e["status"] == "absent")
        absent_today = 0 if day_context.get("suppress_absence") else raw_absent_today

        attendance_rate = (
            round((present_today / total_employees) * 100, 2)
            if total_employees and not day_context.get("suppress_absence")
            else 0
        )

        return {
            "date": target_date.isoformat(),
            "day_context": day_context,
            "ramadan": ramadan_context,
            "global": {
                "total_employees": total_employees,
                "present_today": present_today,
                "remote_today": remote_today,
                "absent_today": absent_today,
                "raw_absent_today": raw_absent_today,
                "attendance_rate": attendance_rate,
            },
            "employees": employees_data,
        }

