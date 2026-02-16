# from app.services.zk_service import ZKService
# from app.repositories.employeeRepo import EmployeeRepository
# from app.repositories.attendanceRepo import AttendanceRepository
# from app.schemas.employee import Employee
# from app.schemas.attendanceLog import AttendanceLog
# import logging

# class SyncService:
#     def __init__(self):
#         self.zk_service = ZKService()
#         self.employee_repo = EmployeeRepository()
#         # AttendanceRepository expects a collection argument, though it overrides it internally.
#         # We pass None to satisfy the signature.
#         self.attendance_repo = AttendanceRepository(collection=None)
    
#     def sync_employees(self):
#         try:
#             users = self.zk_service.list_users()
#             for user in users:
#                 # Map ZK user to Employee schema
#                 employee_data = Employee(
#                     employee_code=user.user_id,
#                     name=user.name,
#                     privilege=user.privilege,
#                     card=user.card
#                 )
#                 self.employee_repo.insert_employee(employee_data)
#             return {"count": len(users)}
#         except Exception as e:
#             logging.error(f"Error syncing employees: {e}")
#             raise e
    
#     def sync_attendances(self):
#         try:
#             attendances = self.zk_service.get_attendances()
#             for att in attendances:
#                 # Map ZK attendance to AttendanceLog schema
#                 # ZK attendance user_id is typically a string in some SDKs, ensure it matches schema
#                 log_data = AttendanceLog(
#                     user_id=int(att.user_id),
#                     timestamp=att.timestamp
#                 )
#                 self.attendance_repo.insert_log(log_data)
#             return {"count": len(attendances)}
#         except Exception as e:
#             logging.error(f"Error syncing attendances: {e}")
#             raise e

#     def sync_all(self):
#         emp_result = self.sync_employees()
#         att_result = self.sync_attendances()
#         return {
#             "status": "success",
#             "message": "All data synced successfully",
#             "details": {
#                 "employees_synced": emp_result["count"],
#                 "attendance_logs_synced": att_result["count"]
#             }
#         }


from app.services.zk_service import ZKService
from app.repositories.employeeRepo import EmployeeRepository
from app.repositories.attendanceRepo import AttendanceRepository
from app.schemas.employee import Employee
from app.schemas.attendanceLog import AttendanceLog
import logging

class SyncService:
    def __init__(self):
        self.zk_service = ZKService()
        self.employee_repo = EmployeeRepository()
        self.attendance_repo = AttendanceRepository(collection=None)

    def sync_employees(self):
        """
        Sync all employees from the device:
        - Insert new employees
        - Update existing employees info
        - Mark as inactive employees not found on device
        """
        try:
            device_users = self.zk_service.list_users()
            device_user_ids = [str(u.user_id) for u in device_users]

            # Step 1: Fetch all employees from DB
            db_employees = self.employee_repo.get_all_employees()
            db_user_ids = [str(e["employee_code"]) for e in db_employees]

            # Step 2: Insert new employees or update existing ones
            for user in device_users:
                employee_data = Employee(
                    employee_code=str(user.user_id),
                    name=user.name,
                    privilege=user.privilege,
                    card=getattr(user, "card", None),
                    is_active=True  # mark as active since it's on device
                )
                if str(user.user_id) in db_user_ids:
                    self.employee_repo.update_employee(employee_data)
                else:
                    self.employee_repo.insert_employee(employee_data)

            # Step 3: Mark as inactive employees not on device
            for db_emp in db_employees:
                if str(db_emp["employee_code"]) not in device_user_ids:
                    self.employee_repo.mark_inactive(db_emp["employee_code"])

            return {
                "employees_synced": len(device_users),
                "inactive_employees_marked": len(db_employees) - len(device_users)
            }

        except Exception as e:
            logging.error(f"Error syncing employees: {e}")
            raise e

    def sync_attendances(self):
        """
        Sync attendance logs from the device.
        """
        try:
            attendances = self.zk_service.get_attendances()
            for att in attendances:
                log_data = AttendanceLog(
                    user_id=int(att.user_id),
                    timestamp=att.timestamp
                )
                self.attendance_repo.insert_log(log_data)
            return {"attendance_logs_synced": len(attendances)}

        except Exception as e:
            logging.error(f"Error syncing attendances: {e}")
            raise e

    def sync_all(self):
        """
        Sync both employees and attendances
        """
        emp_result = self.sync_employees()
        att_result = self.sync_attendances()
        return {
            "status": "success",
            "message": "All data synced successfully",
            "details": {
                **emp_result,
                **att_result
            }
        }
