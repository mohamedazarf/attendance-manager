from pydantic import BaseModel

class Employee(BaseModel):
    employee_code: str
    name: str
    privilege: int
    group_id: str | None = None
    card: int | None = None
    password: str | None = None
    fingerprint_count: int = 0
    is_active: bool = True
    department: str | None = "employee"
    remote_start_date: str | None = None
    remote_end_date: str | None = None

class CreateEnrollRequest(BaseModel):
    uid: int
    name: str
    privilege: int = 0
    password: str | None = None
    department: str | None = "employee"
