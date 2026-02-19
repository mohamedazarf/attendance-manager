from app.services.zk_service import ZKService
from app.repositories.employeeRepo import EmployeeRepository
from app.repositories.attendanceRepo import AttendanceRepository
from app.schemas.employee import Employee
from app.schemas.attendanceLog import AttendanceLog
import logging
from datetime import datetime, timezone

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

    # def sync_attendances(self,from_date: datetime=None):
    #     """
    #     Sync attendance logs from the device incrementally.
    #     """
    #     try:
    #         # 1. Get the latest timestamp from DB
    #         if from_date is None:
    #         # Default to today at midnight
    #             start_date = datetime.now(timezone.utc).replace(
    #                 hour=0, minute=0, second=0, microsecond=0
    #             )
    #         else:
    #         # Ensure timezone awareness
    #             if from_date.tzinfo is None:
    #                 start_date = from_date.replace(tzinfo=timezone.utc)
    #             else:
    #                 start_date = from_date

            
    #         # 2. Fetch all logs from device (ZK library limitation usually requires fetching all)
    #         attendances = self.zk_service.get_attendances()
            
    #         new_logs = []
    #         for att in attendances:
    #              # Only include logs from start_date onwards
    #             if att.timestamp >= start_date:
    #                 log_data = AttendanceLog(
    #                     user_id=int(att.user_id),
    #                     timestamp=att.timestamp
    #                 )
    #                 new_logs.append(log_data)
            
    #         # 3. Bulk insert new logs
    #         if new_logs:
    #             self.attendance_repo.insert_many(new_logs)
            
    #         return {
    #             "attendance_logs_synced": len(new_logs),
    #             "total_device_logs": len(attendances),
    #             "from_date": start_date.isoformat(),
    #             "to_date": datetime.now(timezone.utc).isoformat()
    #         }
                # If we have a latest_timestamp, skip logs that are older or equal

        # except Exception as e:
        #     logging.error(f"Error syncing attendances: {e}")
        #     raise e

    

    def sync_attendances(self):
        try:
            # Get today's date at midnight (UTC)
            today_start = datetime.now(timezone.utc).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            
            attendances = self.zk_service.get_attendances()
            
            new_logs = []
            for att in attendances:
                # Si att.timestamp est naive, le rendre aware (supposé UTC)
                if att.timestamp.tzinfo is None:
                    att_timestamp = att.timestamp.replace(tzinfo=timezone.utc)
                else:
                    att_timestamp = att.timestamp
                
                # Comparaison (maintenant les deux sont aware)
                if att_timestamp >= today_start:
                    log_data = AttendanceLog(
                        user_id=int(att.user_id),
                        timestamp=att.timestamp  # Garder le timestamp original
                    )
                    new_logs.append(log_data)
            
            if new_logs:
                self.attendance_repo.insert_many(new_logs)
            
            return {
                "attendance_logs_synced": len(new_logs),
                "total_device_logs": len(attendances),
                "from_date": today_start.isoformat()
            }

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
