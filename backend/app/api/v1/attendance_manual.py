from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.utils import get_db

router = APIRouter(tags=["Attendance Manual"])

# ==================== MODELS ====================

class ManualAttendance(BaseModel):
    employee_id: str
    event_type: str  # "check_in" or "check_out"
    notes: Optional[str] = None
    timestamp: str  # ISO format

class AbsenceJustification(BaseModel):
    employee_id: str
    date: str  # YYYY-MM-DD
    reason: str
    notes: Optional[str] = None

# ==================== ENDPOINTS ====================

@router.post("/manual")
def record_manual_attendance(attendance: ManualAttendance):
    """
    Record manual attendance entry.
    Stored in 'attendance_logs' to be visible in the dashboard.
    """
    try:
        db = get_db()
        logs_collection = db["attendance_logs"]
        
        # Parse timestamp
        try:
            timestamp = datetime.fromisoformat(attendance.timestamp.replace('Z', '+00:00'))
        except:
            timestamp = datetime.now()
        
        # Create record compatible with DailyAttendanceDashboardService
        # Note: status 1 = check in, 0 = check out typically in ZK devices
        log_record = {
            "user_id": int(attendance.employee_id),
            "timestamp": timestamp,
            "status": 1 if attendance.event_type.lower() == "check_in" else 0,
            "punch": 0,
            "source": "manual",
            "notes": attendance.notes,
            "created_at": datetime.now()
        }
        
        # Insert into the main logs collection
        result = logs_collection.insert_one(log_record)
        
        return {
            "success": True,
            "message": f"Manual {attendance.event_type} recorded for {attendance.employee_id}",
            "id": str(result.inserted_id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/confirm-absence")
def confirm_absence(justification: AbsenceJustification):
    """
    Store a justification for an employee's absence.
    """
    try:
        db = get_db()
        justifications_collection = db["attendance_justifications"]
        
        record = {
            "employee_id": int(justification.employee_id),
            "date": justification.date,
            "reason": justification.reason,
            "notes": justification.notes,
            "created_at": datetime.now()
        }
        
        # Use update_one with upsert: one justification per employee per day
        justifications_collection.update_one(
            {"employee_id": int(justification.employee_id), "date": justification.date},
            {"$set": record},
            upsert=True
        )
        
        return {
            "success": True,
            "message": f"Absence confirmed for employee {justification.employee_id} on {justification.date}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
