from zk import ZK
from app.repositories.employeeRepo import EmployeeRepository
from app.schemas.employee import Employee
from typing import Any, Dict, List
from app.config.attendance_config import AttendanceConfig
class ZKService:
    def __init__(self, ip=None, port=None):
        self.ip = ip or AttendanceConfig.DEVICE_IP
        self.port = port or AttendanceConfig.DEVICE_PORT

    def _connect(self):
        zk = ZK(self.ip, port=self.port, timeout=5)
        return zk.connect()

    def list_users(self):
        conn = self._connect()
        users = conn.get_users()
        conn.disconnect()
        return users

    def create_user(self, uid, name, user_id=None, privilege=0, password='', department='employee'):
        if user_id is None:
            user_id = str(uid)

        conn = self._connect()
        try:
            conn.set_user(uid=uid, name=name, privilege=privilege,
                          password=password, user_id=user_id)
            
            employee = Employee(
                employee_code=str(uid),
                name=name,
                privilege=privilege,
                card=None,
                is_active=True,
                department=department
            )
            EmployeeRepository().insert_employee(employee)
            
            return {"status": "success", "message": f"User {name} created"}
        finally:
            conn.disconnect()



    
    def delete_user(self, employee_code: str):
        conn = None
        try:
            conn = self._connect()
            # Get all device users
            users = conn.get_users()  # list of objects with attributes .uid, .user_id, .name
            # Find the device UID that matches your employee_code
            user = next((u for u in users if u.user_id == str(employee_code)), None)
            
            if not user:
                return {"status": "error", "message": f"Employee {employee_code} not found on device"}

            device_uid = user.uid
            print(f"Deleting user with UID {device_uid} from device...")
            print(f"User found on device with user_id {user.user_id}")
            print(f"User found on device with name {user.name}")
            
            # Delete user by device UID
            conn.delete_user(uid=device_uid)
            EmployeeRepository().mark_inactive(employee_code)
            return {"message": f"Employee {employee_code} deleted"}
        except Exception as e:
            return {"status": "error", "message": f"Failed to delete user {employee_code}: {str(e)}"}
        finally:
            if conn:
                conn.disconnect()

    def enroll_fingerprint(self, uid: int):
        conn = self._connect()
        try:
            print(f"Triggering enrollment mode for user {uid}...")
            conn.enroll_user(uid=uid)
            return {
                "status": "enroll_started",
                "message": f"Please enroll fingerprint for user {uid} on device."
            }
        except Exception as e:
            print("ERROR during enrollment:", str(e))
            return {"status": "error", "message": str(e)}
        finally:
            conn.disconnect()

    def get_attendances(self):
        conn = self._connect()
        attendances = conn.get_attendance()
        conn.disconnect()
        return attendances

    def get_all_fingerprint_counts(self):
        """
        Fetches all fingerprint templates from the device and returns a map of {uid: count}
        """
        conn = None
        try:
            conn = self._connect()
            templates = conn.get_templates()
            counts = {}
            for t in templates:
                counts[t.uid] = counts.get(t.uid, 0) + 1
            return counts
        except Exception as e:
            print(f"Error fetching templates: {e}")
            return {}
        finally:
            if conn:
                conn.disconnect()

    def check_fingerprints(self, uid):
                try:
                    conn = self._connect()
                    users = conn.get_users()
                    templates = conn.get_templates()

                    user = next((u for u in users if u.uid == uid), None)

                    if not user:
                        conn.disconnect()
                        return {
                            "status": "error",
                            "message": "User not found on device"
                        }

                    user_templates = [t for t in templates if t.uid == uid]
                    conn.disconnect()

                    if user_templates:
                        return {
                            "status": "enrolled",
                            "fingerprint_count": len(user_templates)
                        }
                    else:
                        return {
                            "status": "not_enrolled",
                            "fingerprint_count": 0
                        }

                except Exception as e:
                    return {
                        "status": "error",
                        "message": str(e)
                    }

    def set_user_password(self, uid, password):
        conn = None
        try:
            conn = self._connect()
            # user_id is what the device uses for the employee code
            user = next((u for u in conn.get_users() if u.user_id == str(uid)), None)

            if not user:
                return {
                    "status": "error",
                    "message": "User not found"
                }

            conn.set_user(
                uid=user.uid,
                name=user.name,
                privilege=user.privilege,
                password=password,
                user_id=user.user_id
            )

            return {
                "status": "success",
                "message": "Password set successfully."
            }

        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
        finally:
            if conn:
                conn.disconnect()

    @staticmethod
    def get_device_user_map(conn):
        """
        Returns a mapping of employee_code/UserID -> device UID
        Example: { '2': 1, '3': 2, ... }
        """
        users = conn.get_users()  
        mapping = {}
        for u in users:
            mapping[u.user_id] = u.uid  # u is typically an object, not a dict
        return mapping

    
    def update_user(self, employee_code: str, name: str = None, privilege: int = None, department: str = None):
        conn = None
        try:
            conn = self._connect()
            users = conn.get_users()

            # Find device user
            user = next((u for u in users if u.user_id == str(employee_code)), None)

            if not user:
                return {
                    "status": "error",
                    "message": f"Employee {employee_code} not found on device"
                }

            # Keep old values if not provided
            updated_name = name if name is not None else user.name
            updated_privilege = privilege if privilege is not None else user.privilege
            
            # Fetch existing employee from DB to get current department if not provided
            existing_employees = EmployeeRepository().get_all_employees()
            emp_in_db = next((e for e in existing_employees if e["employee_code"] == str(employee_code)), {})
            updated_dept = department if department is not None else emp_in_db.get("department", "employee")

            # Update on device (overwrite)
            conn.set_user(
                uid=user.uid,
                name=updated_name,
                privilege=updated_privilege,
                password=user.password if hasattr(user, "password") else "",
                user_id=user.user_id
            )
            employee=Employee(
                employee_code=str(employee_code),
                name=updated_name,
                privilege=updated_privilege,
                card=user.card,
                is_active=True,
                department=updated_dept
            )

            # Update in DB
            EmployeeRepository().update_employee(
                employee=employee
            )

            return {
                "status": "success",
                "message": f"Employee {employee_code} updated successfully"
            }


        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }

        finally:
            if conn:
                conn.disconnect()

    def delete_users_bulk(self, employee_codes: List[str]) -> Dict[str, Any]:
        conn = None
        deleted_codes: List[str] = []
        not_found_codes: List[str] = []
        failed_codes: List[Dict[str, str]] = []
        unique_codes = [str(code) for code in set(employee_codes or []) if str(code).strip()]

        if not unique_codes:
            return {
                "deleted_codes": deleted_codes,
                "not_found_codes": not_found_codes,
                "failed_codes": failed_codes,
            }

        try:
            conn = self._connect()
            users = conn.get_users()
            by_user_id = {str(u.user_id): u for u in users}

            for code in unique_codes:
                user = by_user_id.get(code)
                if not user:
                    not_found_codes.append(code)
                    continue

                try:
                    conn.delete_user(uid=user.uid)
                    deleted_codes.append(code)
                except Exception as exc:
                    failed_codes.append({"employee_code": code, "error": str(exc)})

            return {
                "deleted_codes": deleted_codes,
                "not_found_codes": not_found_codes,
                "failed_codes": failed_codes,
            }
        finally:
            if conn:
                conn.disconnect()
