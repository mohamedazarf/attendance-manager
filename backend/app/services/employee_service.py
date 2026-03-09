from app.repositories.employeeRepo import EmployeeRepository
from app.schemas.employee import Employee
from app.services.zk_service import ZKService
from app.services.SyncService import SyncService
from zk import ZK

class EmployeeService:

    def __init__(self, repo: EmployeeRepository):
        self.repo = repo
        self.zk = ZKService()
        self.sync_service = SyncService()

    def sync_employees(self):
        """
        Sync employees from device to DB by delegating to SyncService.
        """
        return self.sync_service.sync_employees()


    def get_all(self):
        employees = self.repo.get_all_employees()
        device_users = self.zk.list_users()  # list of User objects
        fingerprint_counts = self.zk.get_all_fingerprint_counts() # {uid: count} map

        # Create a map of user_id (string) to uid (int) from device
        id_to_uid_map = {str(u.user_id): u.uid for u in device_users}

        for emp in employees:
            employee_code = emp.get('employee_code')
            uid = id_to_uid_map.get(employee_code)
            
            if uid is not None:
                emp['fingerprint_count'] = fingerprint_counts.get(uid, 0)
            else:
                emp['fingerprint_count'] = 0

        return employees

    def get_next_employee_code(self) -> str:
        """
        Finds the smallest available positive integer not used as:
        1. employee_code in the DB
        2. UID on the device
        3. UserID on the device
        """
        # 1. Get existing codes from DB
        existing_db_codes = self.repo.get_existing_codes()
        
        # 2. Get all users from device to check UIDs and UserIDs
        device_users = self.zk.list_users()
        
        # Collect all "taken" numeric values
        taken_values = set()
        
        # From DB
        for code in existing_db_codes:
            try:
                taken_values.add(int(code))
            except ValueError:
                continue
                
        # From Device
        for user in device_users:
            # Check UID
            taken_values.add(user.uid)
            # Check UserID (which is a string on device but represents our employee_code)
            try:
                taken_values.add(int(user.user_id))
            except ValueError:
                continue
        
        # Find the smallest gap starting from 1
        next_code = 1
        while next_code in taken_values:
            next_code += 1
                
        return str(next_code)

