from pydantic import BaseModel
from typing import Optional, Dict
from datetime import date, time

class IncludeSundayPayload(BaseModel):
    include_sunday: bool

class SpecialDayPayload(BaseModel):
    date: date
    type: str # 'holiday' or 'remote_day'
    label: Optional[str] = ""

class RamadanDepartmentHours(BaseModel):
    start_time: time
    end_time: time
    pause_minutes: Optional[int] = 0

class NormalDepartmentHours(BaseModel):
    start_time: time
    end_time: time
    pause_minutes: Optional[int] = 75

class RamadanConfigPayload(BaseModel):
    start_date: Optional[date]
    end_date: Optional[date]
    departments: Dict[str, RamadanDepartmentHours]

class NormalConfigPayload(BaseModel):
    start_date: Optional[date]
    end_date: Optional[date]
    departments: Dict[str, NormalDepartmentHours]
