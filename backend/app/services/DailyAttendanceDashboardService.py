from datetime import datetime, date, time
from app import utils
from typing import Dict, Any, List
from app.services.attendance_processing_service import AttendanceProcessingService
from app.schemas.processed_attendance import ProcessedAttendance, DailyAttendanceSummary, AttendanceCheckPoint

class DailyAttendanceDashboardService:

    def __init__(self):
        self.db = utils.get_db()
        self.logs_collection = self.db["attendance_logs"]
        self.employees_collection = self.db["employees"]
        self.processor = AttendanceProcessingService()

    def get_today_data(self, target_date: date = None):
        if not target_date:
            target_date = date.today()

        start_dt = datetime.combine(target_date, time.min)
        end_dt = datetime.combine(target_date, time.max)

        employees = list(self.employees_collection.find(
            {}, {"_id": 0, "employee_code": 1, "name": 1}
        ))

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

        self.processor.process_logs(logs)  # Process logs to detect anomalies, late arrivals, etc.

        # Grouper par employé
        logs_by_employee = {}
        for log in logs:
            emp_id = int(log["user_id"])
            logs_by_employee.setdefault(emp_id, []).append(log)

        present_today = 0
        employees_data = []

        for emp in employees:
            emp_id = int(emp["employee_code"])
            emp_logs = logs_by_employee.get(emp_id, [])
            late_minutes = 0
            anomalies = []

            if emp_logs:
                # Tri sûr sur timestamp
                emp_logs.sort(key=lambda x: x["timestamp"] or datetime.min)
                check_in = emp_logs[0]["timestamp"]
                check_out = emp_logs[-1]["timestamp"]
                status = "present"
                present_today += 1
                events = [AttendanceCheckPoint(event_type="in", timestamp=check_in,event_order=1),
                          AttendanceCheckPoint(event_type="out", timestamp=check_out,event_order=2)]
                processed = ProcessedAttendance(
                    user_id=emp_id,
                    date=target_date,
                    check_in_time=check_in,
                    check_out_time=check_out,
                    events=events
                )
                self.processor.calculate_hours(processed)
                self.processor._detect_anomalies(processed)
                worked_hours = processed.total_hours_worked
                is_late = processed.is_late
                late_minutes = processed.late_minutes if is_late else 0
                anomalies = processed.anomalies
            else:
                check_in = None
                check_out = None
                status = "absent"
                worked_hours = 0
                is_late = False

            employees_data.append({
                "employee_id": emp_id,
                "employee_name": emp.get("name"),
                "status": status,
                "check_in_time": check_in,
                "check_out_time": check_out,
                "worked_hours": worked_hours,
                "is_late": is_late,
                "late_minutes": late_minutes,
                "anomalies": anomalies
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



# #new
#     def get_dashboard_day_detailed(day: str) -> Dict[str, Any]:

#         employees_collection = db["employees"]
#         attendance_collection = db["attendances_logs"]

#         employees = list(employees_collection.find({}, {"_id": 0}))
#         attendances = list(attendance_collection.find(
#             {"date": day},
#             {"_id": 0}
#         ))

#         attendance_map = {
#             a["employee_code"]: a for a in attendances
#         }

#         employees_output: List[Dict[str, Any]] = []

#         present_count = 0

#         for emp in employees:

#             emp_id = emp["employee_code"]
#             emp_name = emp["name"]

#             record = attendance_map.get(emp_id)

#             if not record:
#                 # ABSENT
#                 employees_output.append({
#                     "employee_id": emp_id,
#                     "employee_name": emp_name,
#                     "status": "absent",
#                     "check_in_time": None,
#                     "check_out_time": None,
#                     "missing_punch": False,
#                     "is_late": False,
#                     "late_minutes": 0,
#                     "total_hours_worked": 0,
#                     "expected_hours": DailyAttendanceDashboardService.EXPECTED_HOURS,
#                     "overtime_hours": 0
#                 })
#                 continue

#             check_in = record.get("first_event")
#             check_out = record.get("last_event")
#             total_hours = record.get("total_hours_worked", 0)

#             missing_punch = not check_in or not check_out

#             is_late = False
#             late_minutes = 0

#             if check_in:
#                 check_in_dt = datetime.fromisoformat(check_in)
#                 if check_in_dt.time() > DailyAttendanceDashboardService.REGULAR_START_TIME:
#                     is_late = True
#                     late_minutes = (
#                         datetime.combine(check_in_dt.date(), check_in_dt.time()) -
#                         datetime.combine(check_in_dt.date(), DailyAttendanceDashboardService.REGULAR_START_TIME)
#                     ).seconds // 60

#             overtime_hours = max(
#                 0,
#                 total_hours - DailyAttendanceDashboardService.EXPECTED_HOURS
#             )

#             present_count += 1

#             employees_output.append({
#                 "employee_id": emp_id,
#                 "employee_name": emp_name,
#                 "status": "present",
#                 "check_in_time": check_in,
#                 "check_out_time": check_out,
#                 "missing_punch": missing_punch,
#                 "is_late": is_late,
#                 "late_minutes": late_minutes,
#                 "total_hours_worked": round(total_hours, 2),
#                 "expected_hours": DailyAttendanceDashboardService.EXPECTED_HOURS,
#                 "overtime_hours": round(overtime_hours, 2)
#             })

#         total_employees = len(employees)
#         absent_count = total_employees - present_count

#         attendance_rate = (
#             round((present_count / total_employees) * 100)
#             if total_employees > 0 else 0
#         )

#         return {
#             "date": day,
#             "global": {
#                 "total_employees": total_employees,
#                 "present_today": present_count,
#                 "absent_today": absent_count,
#                 "attendance_rate": attendance_rate
#             },
#             "employees": employees_output
#         }


# from app.services.attendance_processing_service import AttendanceProcessingService



# class DailyAttendanceDashboardService:

#     def __init__(self):
#         self.processor = AttendanceProcessingService()

#     def get_today_data(self, day: str):

#         db = get_db()

#         logs_collection = db["attendances_mock"]
#         employees_collection = db["employees_mock"]

#         # 1️⃣ Get raw logs of the day
#         logs = list(logs_collection.find(
#             {"timestamp": {"$regex": f"^{day}"}},
#             {"_id": 0}
#         ))

#         # 2️⃣ Process logs using your existing service
#         processed = self.processor.process_logs(logs)

#         # 3️⃣ Get all employees
#         employees = list(employees_collection.find({}, {"_id": 0}))

#         employees_output = []
#         present_count = 0

#         for emp in employees:

#             key = (emp["employee_id"], datetime.fromisoformat(day).date())
#             record = processed.get(key)

#             if not record:
#                 # ABSENT
#                 employees_output.append({
#                     "employee_id": emp["employee_id"],
#                     "employee_name": emp["name"],
#                     "status": "absent",
#                     "check_in_time": None,
#                     "check_out_time": None,
#                     "is_late": False,
#                     "late_minutes": 0,
#                     "missing_punch": False,
#                     "overtime_hours": 0,
#                     "total_hours_worked": 0
#                 })
#                 continue

#             present_count += 1

#             employees_output.append({
#                 "employee_id": emp["employee_id"],
#                 "employee_name": emp["name"],
#                 "status": record.status,
#                 "check_in_time": record.check_in_time,
#                 "check_out_time": record.check_out_time,
#                 "is_late": getattr(record, "is_late", False),
#                 "late_minutes": getattr(record, "late_minutes", 0),
#                 "missing_punch": not record.is_complete_day,
#                 "overtime_hours": max(0, record.total_hours_worked - record.expected_hours),
#                 "total_hours_worked": record.total_hours_worked,
#                 "expected_hours": record.expected_hours,
#                 "anomalies": record.anomalies
#             })

#         total = len(employees)
#         absent = total - present_count
#         attendance_rate = round((present_count / total) * 100) if total else 0

#         return {
#             "date": day,
#             "global": {
#                 "total_employees": total,
#                 "present_today": present_count,
#                 "absent_today": absent,
#                 "attendance_rate": attendance_rate
#             },
#             "employees": employees_output
#         }
