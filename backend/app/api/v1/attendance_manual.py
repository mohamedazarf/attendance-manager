from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.utils import get_db

router = APIRouter(tags=["Attendance Manual"])

# ==================== MODELS ====================

class ManualAttendance(BaseModel):
    employee_id: str
    event_type: str
    device_id: Optional[str] = None
    match_score: Optional[float] = None
    notes: Optional[str] = None
    timestamp: str

# ==================== ENDPOINTS ====================

@router.post("/manual")
def record_manual_attendance(attendance: ManualAttendance):
    """
    Record manual attendance entry from desktop app
    """
    try:
        db = get_db()
        attendance_collection = db["attendances"]
        
        # Parse timestamp
        try:
            timestamp = datetime.fromisoformat(attendance.timestamp.replace('Z', '+00:00'))
        except:
            timestamp = datetime.now()
        
        # Create attendance record
        attendance_record = {
            "user_id": attendance.employee_id,
            "timestamp": timestamp,
            "status": 1 if attendance.event_type.lower() == "check_in" else 0,
            "punch": 0,  # 0 = check in/out, other values for break, overtime, etc.
            "uid": attendance.employee_id,
            "device_id": attendance.device_id or "DESKTOP_APP",
            "match_score": attendance.match_score,
            "notes": attendance.notes,
            "source": "desktop_app",
            "created_at": datetime.now().isoformat()
        }
        
        # Insert record
        result = attendance_collection.insert_one(attendance_record)
        
        return {
            "success": True,
            "message": f"Attendance recorded for {attendance.employee_id}",
            "data": {
                "id": str(result.inserted_id),
                "employee_id": attendance.employee_id,
                "timestamp": timestamp.isoformat(),
                "event_type": attendance.event_type
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
