from app.schemas.employee import Employee
from app.utils import get_db
from pymongo.errors import DuplicateKeyError


db = get_db()

class EmployeeRepository:

    def __init__(self):
        self.collection = db["employees"]

        # Create unique index on employee_code
        self.collection.create_index("employee_code", unique=True)

    def insert_employee(self, employee: Employee):
        try:
            self.collection.insert_one(employee.dict())
        except DuplicateKeyError:
            # ignore duplicates
            return None

    def insert_many(self, employees: list[Employee]):
        try:
            self.collection.insert_many([e.dict() for e in employees], ordered=False)
        except DuplicateKeyError:
            # duplicates will be ignored
            return None

    def get_all_employees(self):
        return list(self.collection.find({}, {"_id": 0}))

    def find_by_name(self, name: str):
        return list(self.collection.find({"name": name}, {"_id": 0}))

    def count(self):
        return self.collection.count_documents({})
