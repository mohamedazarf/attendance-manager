from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional


class AttendanceCheckPoint(BaseModel):
    """Single check-in or check-out event"""
    timestamp: datetime
    event_type: str  # "in" or "out"
    event_order: int  # 1st, 2nd, 3rd event of the day, etc.


class ProcessedAttendance(BaseModel):
    """Processed attendance record for a user on a given day"""
    user_id: int
    date: date
    
    # Time records
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    events: List[AttendanceCheckPoint] = []
    
    # Calculated fields
    total_hours_worked: float = 0.0  # Sum of all (out - in) periods minus pause
    pause_hours: float = 0.0  # Actual pause time taken
    expected_hours: float = 0.0  # Expected working hours
    
    # Status and anomalies
    has_anomaly: bool = False
    anomalies: List[str] = []  # List of anomaly types
    status: str = "normal"  # "normal", "anomaly", "absence"
    
    # Details
    is_complete_day: bool = False  # Has both check-in and check-out
    is_late: bool = False  # Arrived after start_time + tolerance
    late_minutes: int = 0  # How many minutes late
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
        }


class DailyAttendanceSummary(BaseModel):
    """Summary of attendance for a user on a specific day"""
    user_id: int
    employee_code: Optional[str] = None
    employee_name: Optional[str] = None
    date: date
    
    # Time tracking
    first_event: Optional[datetime] = None
    last_event: Optional[datetime] = None
    
    # Hours calculation
    total_hours_worked: float = 0.0
    expected_hours: float = 0.0
    hours_difference: float = 0.0  # positive = overwork, negative = underwork
    
    # Anomalies
    anomalies: List[str] = []
    status: str  # "normal", "anomaly", "absence"
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
        }
