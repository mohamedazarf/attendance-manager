from app.services.zk_service import ZKService
from app.repositories.employeeRepo import EmployeeRepository
from app.repositories.attendanceRepo import AttendanceRepository
from app.schemas.employee import Employee
from app.schemas.attendanceLog import AttendanceLog
import logging
from datetime import datetime

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

            # Map device user_id (employee_code) -> uid to attach fingerprint/template count
            id_to_uid_map = {str(u.user_id): u.uid for u in device_users}
            fingerprint_counts = self.zk_service.get_all_fingerprint_counts()

            # Step 1: Fetch all employees from DB
            db_employees = self.employee_repo.get_all_employees()
            db_user_ids = [str(e["employee_code"]) for e in db_employees]
            # Map for quick lookup (to preserve fields like department)
            db_emp_map = {
                str(e["employee_code"]): e
                for e in db_employees
            }

            # Step 2: Insert new employees or update existing ones
            for user in device_users:
                user_id_str = str(user.user_id)
                existing_emp = db_emp_map.get(user_id_str)

                existing_department = None
                existing_matricule = None
                if existing_emp is not None:
                    existing_department = existing_emp.get("department")
                    existing_matricule = existing_emp.get("matricule")

                # Auto fix based on privilege
                if user.privilege == 14:
                    department = "administration"
                else:
                    department = existing_department or "usine"

                uid = id_to_uid_map.get(user_id_str)
                fingerprint_count = fingerprint_counts.get(uid, 0) if uid is not None else 0

                employee_data = Employee(
                    employee_code=user_id_str,
                    name=user.name,
                    privilege=user.privilege,
                    card=getattr(user, "card", None),
                    is_active=True,  # mark as active since it's on device
                    department=department,
                    fingerprint_count=fingerprint_count,
                    matricule=existing_matricule,
                )

                if user_id_str in db_user_ids:
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
        Sync attendance logs from the device incrementally.
        Uses the latest timestamp in DB as starting point.
        All timestamps are treated as naive local time (device local clock).
        """
        try:
            now_local = datetime.now()
            
            # 1. Get the latest VALID (non-future) timestamp from DB
            latest_db_timestamp = self.attendance_repo.get_latest_timestamp(max_timestamp=now_local)
            
            if latest_db_timestamp is None:
                # Fallback to today at midnight if no valid logs exist
                start_date = now_local.replace(
                    hour=0, minute=0, second=0, microsecond=0
                )
            else:
                # Strip any tzinfo for consistent naive-local comparison
                start_date = latest_db_timestamp.replace(tzinfo=None) if latest_db_timestamp.tzinfo else latest_db_timestamp

            # 2. Fetch all logs from device
            attendances = self.zk_service.get_attendances()
            
            new_logs = []
            for att in attendances:
                # Device timestamps are always local-naive; strip tzinfo if present
                att_timestamp = att.timestamp.replace(tzinfo=None) if att.timestamp.tzinfo else att.timestamp
                
                # Ignore logs from the future (erroneous device time)
                if att_timestamp > now_local:
                    continue

                # Incrementally add logs that are strictly newer than the latest in DB
                if att_timestamp > start_date:
                    log_data = AttendanceLog(
                        user_id=int(att.user_id),
                        timestamp=att_timestamp
                    )
                    new_logs.append(log_data)
            
            # 3. Bulk insert new logs
            if new_logs:
                # Sorted by timestamp to be safe, though not strictly required by insert_many
                new_logs.sort(key=lambda x: x.timestamp)
                self.attendance_repo.insert_many(new_logs)
            
            return {
                "attendance_logs_synced": len(new_logs),
                "total_device_logs": len(attendances),
                "last_db_timestamp": start_date.isoformat() if latest_db_timestamp else "None (started from today)",
                "status": "success"
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
