# from datetime import datetime, date, time
# from typing import Dict, List
# from app import utils

# class DailyAttendanceDashboardService:

#     def __init__(self):
#         self.db = utils.get_db()
#         self.logs_collection = self.db["attendance_logs"]
#         self.employees_collection = self.db["employees"]

#     def get_today_dashboard_data(self, target_date: date = None) -> Dict:
#         """
#         Returns global and per-employee attendance data for today
#         """
#         if not target_date:
#             target_date = date.today()

#         start_dt = datetime.combine(target_date, time.min)
#         end_dt = datetime.combine(target_date, time.max)

#         employees = list(self.employees_collection.find(
#             {}, {"_id": 0, "employee_code": 1, "name": 1}
#         ))

#         logs = list(self.logs_collection.find({
#             "timestamp": {"$gte": start_dt, "$lte": end_dt}
#         }))

#         # Group logs by user_id
#         logs_by_employee = {}
#         for log in logs:
#             user_id = log["user_id"]
#             logs_by_employee.setdefault(user_id, []).append(log)

#         present_today = 0
#         employee_details = []

#         for emp in employees:
#             emp_id = int(emp["employee_code"])
#             emp_logs = logs_by_employee.get(emp_id, [])

#             if emp_logs:
#                 present_today += 1
#                 emp_logs.sort(key=lambda x: x["timestamp"])
#                 check_in = emp_logs[0]["timestamp"]
#                 check_out = emp_logs[-1]["timestamp"]
#                 status = "present"
#             else:
#                 check_in = None
#                 check_out = None
#                 status = "absent"

#             employee_details.append({
#                 "employee_id": emp_id,
#                 "employee_name": emp.get("name", ""),
#                 "status": status,
#                 "check_in_time": check_in,
#                 "check_out_time": check_out
#             })

#         total_employees = len(employees)
#         absent_today = total_employees - present_today
#         attendance_rate = round(
#             (present_today / total_employees) * 100, 2
#         ) if total_employees > 0 else 0

#         return {
#             "date": target_date.isoformat(),
#             "global": {
#                 "total_employees": total_employees,
#                 "present_today": present_today,
#                 "absent_today": absent_today,
#                 "attendance_rate": attendance_rate
#             },
#             "employees": employee_details
#         }


from datetime import datetime, date, time
from app import utils
from app import utils


class DailyAttendanceDashboardService:

    def __init__(self):
        self.db = utils.get_db()
        self.logs_collection = self.db["attendance_logs"]
        self.employees_collection = self.db["employees"]

    def get_today_data(self, target_date: date = None):
        if not target_date:
            target_date = date.today()

        start_dt = datetime.combine(target_date, time.min)
        end_dt = datetime.combine(target_date, time.max)

        employees = list(self.employees_collection.find(
            {}, {"_id": 0, "employee_code": 1, "name": 1}
        ))

        logs = list(self.logs_collection.find({
            "timestamp": {"$gte": start_dt, "$lte": end_dt}
        }))

        logs_by_employee = {}
        for log in logs:
            logs_by_employee.setdefault(log["user_id"], []).append(log)

        present_today = 0
        employees_data = []

        for emp in employees:
            emp_id = int(emp["employee_code"])
            emp_logs = logs_by_employee.get(emp_id, [])

            if emp_logs:
                emp_logs.sort(key=lambda x: x["timestamp"])
                check_in = emp_logs[0]["timestamp"]
                check_out = emp_logs[-1]["timestamp"]
                status = "present"
                present_today += 1
            else:
                check_in = None
                check_out = None
                status = "absent"

            employees_data.append({
                "employee_id": emp_id,
                "employee_name": emp.get("name"),
                "status": status,
                "check_in_time": check_in,
                "check_out_time": check_out
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
