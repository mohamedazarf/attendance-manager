from pydantic import BaseModel

class Employee(BaseModel):
    employee_code: str
    name: str
    privilege: int
    group_id: str | None = None
    card: int | None = None
