from datetime import datetime, time
from app import utils
from app.services.attendance_processing_service import AttendanceProcessingService
from app.schemas.processed_attendance import ProcessedAttendance, AttendanceCheckPoint
from fastapi import HTTPException

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
            {"_id": 0, "name": 1, "employee_code": 1}
        )

        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        logs = list(self.logs_collection.find({
            "user_id": employee_id,
            "timestamp": {"$gte": start_dt, "$lte": end_dt}
        }))

        # Normalisation timestamp
        for log in logs:
            log["timestamp"] = log["timestamp"].replace(tzinfo=None)

        # Grouper par jour
        logs_by_date = {}
        for log in logs:
            d = log["timestamp"].date()
            logs_by_date.setdefault(d, []).append(log)

        history = []
        total_period_hours = 0
        total_weekend_hours = 0
        for day, day_logs in sorted(logs_by_date.items()):
            day_logs.sort(key=lambda x: x["timestamp"])

            check_in = day_logs[0]["timestamp"]
            check_out = day_logs[-1]["timestamp"]

            events = [
                AttendanceCheckPoint(event_type="in", timestamp=check_in, event_order=1),
                AttendanceCheckPoint(event_type="out", timestamp=check_out, event_order=2),
            ]

            processed = ProcessedAttendance(
                user_id=employee_id,
                date=day,
                check_in_time=check_in,
                check_out_time=check_out,
                events=events
            )

            self.processor.calculate_hours(processed)
            self.processor._detect_anomalies(processed)
            if processed.total_hours_worked:
                total_period_hours += processed.total_hours_worked
                # Weekday() returns 5 for Saturday and 6 for Sunday
                if day.weekday() >= 5:
                    total_weekend_hours += processed.total_hours_worked

            history.append({
                "date": day.isoformat(),
                "check_in_time": check_in,
                "check_out_time": check_out,
                "worked_hours": processed.total_hours_worked,
                "expected_hours": processed.expected_hours,
                "is_late": processed.is_late,
                "late_minutes": processed.late_minutes,
                "anomalies": processed.anomalies,
                "status": processed.status
            })

        return {
            "employee_id": employee_id,
            "employee_name": employee.get("name", "Unknown"),
            "date_from": date_from,
            "date_to": date_to,
            "history": history,
            "total_period_hours": total_period_hours,
            "total_weekend_hours": total_weekend_hours
        }
