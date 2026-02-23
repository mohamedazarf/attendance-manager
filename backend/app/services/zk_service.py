from zk import ZK
from app.repositories.employeeRepo import EmployeeRepository
from app.schemas.employee import Employee
class ZKService:
    def __init__(self, ip="192.168.100.5", port=4370):
        self.ip = ip
        self.port = port

    def _connect(self):
        zk = ZK(self.ip, port=self.port, timeout=5)
        return zk.connect()

    def list_users(self):
        conn = self._connect()
        users = conn.get_users()
        conn.disconnect()
        return users

    def create_user(self, uid, name, user_id=None, privilege=0, password=''):
        if user_id is None:
            user_id = str(uid)

        conn = self._connect()
        conn.set_user(uid=uid, name=name, privilege=privilege,
                      password=password, user_id=user_id)
        conn.disconnect()
        return {"message": "User created"}


    
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

    def enroll_fingerprint(self, uid):
        try:
            conn = self._connect()
            print("Enrolling fingerprint on device...")
            conn.enroll_user(uid=uid)
            print("Enrollment started. Please scan fingerprint on device.")
            conn.disconnect()
            return {
                "status": "enrollment_started",
                "message": "Enrollment started. Please scan fingerprint on device."
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def get_attendances(self):
        conn = self._connect()
        attendances = conn.get_attendance()
        conn.disconnect()
        return attendances


    def create_user(self, uid, name, privilege=0, password: str = "", user_id: str = None):
        conn = self._connect()

        if user_id is None:
            user_id = str(uid)

        try:
            print("Creating user on device...")

            conn.set_user(
                uid=uid,
                name=name,
                privilege=privilege,
                password=password or "",
                user_id=user_id
            )

            print("User created successfully.")

            employee = Employee(
                employee_code=str(uid),
                name=name,
                privilege=privilege,
                card=None,
                is_active=True
            )

            EmployeeRepository().insert_employee(employee)

            return {
                "status": "success",
                "message": f"User {name} created successfully."
            }

        except Exception as e:
            print("ERROR creating user:", str(e))
            raise e

        finally:
            conn.disconnect()

    def enroll_fingerprint(self, uid: int):
        conn = self._connect()
        try:
            print("Triggering enrollment mode...")
            conn.enroll_user(uid=uid)
            return {
                "status": "enroll_started",
                "message": f"Please enroll fingerprint for user {uid} on device."
            }
        except Exception as e:
            print("ERROR during enrollment:", str(e))
            raise e
        finally:
            conn.disconnect()

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

    
    def update_user(self, employee_code: str, name: str = None, privilege: int = None):
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
                is_active=user.is_active
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
