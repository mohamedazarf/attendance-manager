from app.repositories.employeeRepo import EmployeeRepository
from app.schemas.employee import Employee
from app.services.zk_service import ZKService
from zk import ZK

class EmployeeService:

    def __init__(self, repo: EmployeeRepository):
        self.repo = repo
        self.zk = ZKService()

    def fetch_from_zk(self):
        zk = ZK("192.168.100.5", port=4370, timeout=5)
        conn = zk.connect()

        users = conn.get_users()
        conn.disconnect()

        employees = []
        for user in users:
            employees.append(Employee(
                employee_code=str(user.user_id),
                name=user.name,
                privilege=user.privilege,
                group_id=user.group_id,
                card=user.card
            ))
        return employees

    def sync_employees(self):
        # If collection is empty, fetch from ZK
        if self.repo.count() == 0:
            employees = self.fetch_from_zk()
            self.repo.insert_many(employees)

    # def get_all(self):
    #     return self.repo.get_all_employees()


    # def get_all(self):
    #     employees = self.repo.get_all_employees()
    #     device_users = self.zk.list_users()  # liste d'objets User

    #     # Crée un mapping user_id -> device info
    #     device_users_map = {str(u.user_id): u for u in device_users}  # converti en str pour correspondre à employee_code

    #     for emp in employees:
    #         # Ici on se base sur user_id (string) pour correspondre à employee_code
    #         device_user = device_users_map.get(emp['employee_code'])
    #         emp['fingerprint_count'] = getattr(device_user, 'fingerprint_count', 0) if device_user else 0

    #     return employees
    
    # def get_all(self):
    #     employees = self.repo.get_all_employees()
    #     device_users = self.zk.list_users()   # objets User
    #     templates = self.zk.list_templates()  # récupère toutes les empreintes

    #     for emp in employees:
    #         # trouve le user sur le device correspondant à employee_code
    #         device_user = next((u for u in device_users if str(u.user_id) == emp['employee_code']), None)
    #         if device_user:
    #             # compte les templates pour cet UID
    #             emp['fingerprint_count'] = len([t for t in templates if t.uid == device_user.uid])
    #         else:
    #             emp['fingerprint_count'] = 0

    #     return employees

    def get_all(self):
        employees = self.repo.get_all_employees()
        device_users = self.zk.list_users()  # objets User

        for emp in employees:
            # trouve le device user correspondant à employee_code (user_id)
            device_user = next((u for u in device_users if str(u.user_id) == emp['employee_code']), None)
            if device_user:
                # utilise check_fingerprints pour obtenir le nombre exact
                result = self.zk.check_fingerprints(device_user.uid)
                emp['fingerprint_count'] = result.get('fingerprint_count', 0)
            else:
                emp['fingerprint_count'] = 0

        return employees

