from app.repositories.employeeRepo import EmployeeRepository
from app.schemas.employee import Employee
from zk import ZK

class EmployeeService:

    def __init__(self, repo: EmployeeRepository):
        self.repo = repo

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

    def get_all(self):
        return self.repo.get_all_employees()

