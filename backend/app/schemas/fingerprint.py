from pydantic import BaseModel
from typing import Optional

class PendingUser(BaseModel):
    biometric_id: int
    employee_id: str
    full_name: str
    email: Optional[str] = None
    department: Optional[str] = None
    requested_at: str

class FingerprintStatusUpdate(BaseModel):
    employee_id: str
    device_user_id: str

class EnrollmentConfirm(BaseModel):
    biometric_id: int
