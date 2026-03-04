from datetime import datetime, time
from app import utils
from app.services.attendance_processing_service import AttendanceProcessingService
from fastapi import HTTPException
from app.config.attendance_config import AttendanceConfig

class AttendanceHistoryService:

    def __init__(self):
        self.db = utils.get_db()
        self.logs_collection = self.db["attendance_logs"]
        self.processor = AttendanceProcessingService()
        self.employees_collection = self.db["employees"]

    def get_employee_history(self, employee_id: int, date_from, date_to):
        start_dt = datetime.combine(date_from, time.min)
        end_dt = datetime.combine(date_to, time.max)

        employee = self.employees_collection.find_one(
            {"employee_code": str(employee_id)},
            {"_id": 0, "name": 1, "employee_code": 1, "department": 1}
        )

        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        logs = list(self.logs_collection.find({
            "user_id": employee_id,
            "timestamp": {"$gte": start_dt, "$lte": end_dt}
        }))

        # Normalisation timestamp
        for log in logs:
            ts = log.get("timestamp")
            if isinstance(ts, str):
                log["timestamp"] = datetime.fromisoformat(ts.replace("Z", "+00:00")).replace(tzinfo=None)
            elif isinstance(ts, datetime):
                log["timestamp"] = ts.replace(tzinfo=None)
            else:
                log["timestamp"] = None

        logs = [log for log in logs if log.get("timestamp") is not None]

        user_departments = {employee_id: employee.get("department", "employee")}
        processed_map = self.processor.process_logs(logs, user_departments=user_departments)

        history = []
        total_period_hours = 0.0
        overtime_threshold = AttendanceConfig().OVERTIME_THRESHOLD_HOURS
        for (_, day), processed in sorted(processed_map.items(), key=lambda item: item[0][1]):
            if processed.total_hours_worked:
                total_period_hours += processed.total_hours_worked

            history.append({
                "date": day.isoformat(),
                "check_in_time": processed.check_in_time,
                "check_out_time": processed.check_out_time,
                "worked_hours": processed.total_hours_worked,
                "expected_hours": processed.expected_hours,
                "is_late": processed.is_late,
                "late_minutes": processed.late_minutes,
                "anomalies": processed.anomalies,
                "status": processed.status
            })

        total_overtime_hours = round(
            max(0.0, total_period_hours - overtime_threshold), 2
        )

        return {
            "employee_id": employee_id,
            "employee_name": employee.get("name", "Unknown"),
            "date_from": date_from,
            "date_to": date_to,
            "history": history,
            "total_period_hours": round(total_period_hours, 2),
            "total_overtime_hours": total_overtime_hours
        }
