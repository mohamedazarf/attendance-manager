from pydantic import BaseModel
from datetime import datetime

class AttendanceLog(BaseModel):
    user_id: int
    timestamp: datetime
