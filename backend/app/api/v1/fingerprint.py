from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.utils import get_db

router = APIRouter(tags=["Fingerprint"])

# ==================== MODELS ====================

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

# ==================== ENDPOINTS ====================

@router.get("/pending")
def get_pending_enrollments():
    """
    Get list of users pending fingerprint enrollment
    Returns users who don't have biometric_enrolled = True
    """
    try:
        db = get_db()
        employees_collection = db["employees"]
        
        # Find employees without fingerprint enrollment
        pending = list(employees_collection.find({
            "$or": [
                {"biometric_enrolled": {"$ne": True}},
                {"biometric_enrolled": {"$exists": False}}
            ]
        }))
        
        # Format response
        pending_users = []
        for emp in pending:
            pending_users.append({
                "biometric_id": emp.get("user_id", 0),
                "employee_id": str(emp.get("employee_code", emp.get("user_id", ""))),
                "full_name": emp.get("name", "Unknown"),
                "email": emp.get("email"),
                "department": emp.get("department"),
                "requested_at": datetime.now().isoformat()
            })
        
        return {
            "success": True,
            "data": pending_users,
            "count": len(pending_users)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": [],
            "count": 0
        }

@router.post("/confirm")
def confirm_enrollment(data: EnrollmentConfirm):
    """
    Confirm successful fingerprint enrollment
    Updates employee record to mark biometric as enrolled
    """
    try:
        db = get_db()
        employees_collection = db["employees"]
        
        # Update employee record
        result = employees_collection.update_one(
            {"user_id": data.biometric_id},
            {
                "$set": {
                    "biometric_enrolled": True,
                    "biometric_enrolled_at": datetime.now().isoformat()
                }
            }
        )
        
        if result.modified_count > 0:
            return {
                "success": True,
                "message": f"Enrollment confirmed for biometric ID {data.biometric_id}"
            }
        else:
            return {
                "success": False,
                "error": f"No employee found with biometric ID {data.biometric_id}"
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@router.post("/update-status/{employee_id}")
def update_fingerprint_status(employee_id: str, data: FingerprintStatusUpdate):
    """
    Update fingerprint enrollment status for an employee
    """
    try:
        db = get_db()
        employees_collection = db["employees"]
        
        # Update employee record
        result = employees_collection.update_one(
            {"employee_code": employee_id},
            {
                "$set": {
                    "device_user_id": data.device_user_id,
                    "biometric_enrolled": True,
                    "biometric_enrolled_at": datetime.now().isoformat()
                }
            }
        )
        
        if result.modified_count > 0:
            return {
                "success": True,
                "message": f"Fingerprint status updated for {employee_id}"
            }
        else:
            return {
                "success": False,
                "error": f"No employee found with ID {employee_id}"
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@router.get("/check/{employee_id}")
def check_fingerprint_status(employee_id: str):
    """
    Check fingerprint enrollment status for an employee
    """
    try:
        db = get_db()
        employees_collection = db["employees"]
        
        # Find employee
        employee = employees_collection.find_one({"employee_code": employee_id})
        
        if employee:
            return {
                "success": True,
                "data": {
                    "employee_id": employee.get("employee_code"),
                    "full_name": employee.get("name"),
                    "biometric_enrolled": employee.get("biometric_enrolled", False),
                    "device_user_id": employee.get("device_user_id"),
                    "user_id": employee.get("user_id")
                }
            }
        else:
            return {
                "success": False,
                "error": f"Employee {employee_id} not found"
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
