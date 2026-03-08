from app.schemas.employee import Employee
from app import utils
from pymongo.errors import DuplicateKeyError, BulkWriteError

class EmployeeRepository:

    def __init__(self):
        db = utils.get_db()
        self.collection = db["employees"]

        # Create unique index on employee_code
        self.collection.create_index("employee_code", unique=True)

    def insert_employee(self, employee: Employee):
        try:
            self.collection.insert_one(employee.model_dump())
        except DuplicateKeyError:
            # ignore duplicates
            return None

    def insert_many(self, employees: list[Employee]):
        try:
            self.collection.insert_many([e.model_dump() for e in employees], ordered=False)
        except (DuplicateKeyError, BulkWriteError):
            # duplicates will be ignored
            return None

    def get_all_employees(self):
        return list(self.collection.find({}, {"_id": 0}))

    def find_by_name(self, name: str):
        return list(self.collection.find({"name": name}, {"_id": 0}))

    def update_employee(self, employee: Employee):
        """
        Update existing employee info (name, privilege, card, is_active)
        """
        self.collection.update_one(
            {"employee_code": employee.employee_code},
            {"$set": employee.model_dump()}
        )

    def mark_inactive(self, employee_code: str):
        """
        Mark an employee as inactive (not on device)
        """
        self.collection.update_one(
            {"employee_code": employee_code},
            {"$set": {"is_active": False}}
        )

    def update_remote_config(self, employee_code: str, start_date: str | None, end_date: str | None):
        """
        Update the remote work dates for an employee.
        """
        self.collection.update_one(
            {"employee_code": employee_code},
            {"$set": {
                "remote_start_date": start_date,
                "remote_end_date": end_date
            }}
        )

    def count(self):
        return self.collection.count_documents({})

    def get_existing_codes(self) -> list[str]:
        """
        Fetch all existing employee codes from the database.
        """
        return [doc["employee_code"] for doc in self.collection.find({}, {"employee_code": 1, "_id": 0})]
