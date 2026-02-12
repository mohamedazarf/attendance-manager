from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.utils import get_db

router = APIRouter(tags=["Users"])

# ==================== MODELS ====================

class User(BaseModel):
    id: Optional[str] = None
    employee_id: str
    full_name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    user_id: Optional[int] = None
    biometric_enrolled: Optional[bool] = False

class AttendanceLog(BaseModel):
    employee_id: str
    event_type: str
    device_id: Optional[str] = None
    match_score: Optional[float] = None
    notes: Optional[str] = None
    timestamp: str

# ==================== ENDPOINTS ====================

@router.get("/")
def get_users():
    """
    Get all users from the database
    """
    try:
        db = get_db()
        employees_collection = db["employees"]
        
        employees = list(employees_collection.find({}))
        
        # Format response
        users = []
        for emp in employees:
            users.append({
                "id": str(emp.get("_id", "")),
                "employee_id": str(emp.get("employee_code", emp.get("user_id", ""))),
                "full_name": emp.get("name", "Unknown"),
                "first_name": emp.get("name", "").split()[0] if emp.get("name") else "",
                "last_name": " ".join(emp.get("name", "").split()[1:]) if emp.get("name") and len(emp.get("name", "").split()) > 1 else "",
                "email": emp.get("email"),
                "department": emp.get("department"),
                "user_id": emp.get("user_id"),
                "biometric_enrolled": emp.get("biometric_enrolled", False)
            })
        
        return {"users": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}")
def get_user_by_id(user_id: str):
    """
    Get a specific user by ID
    """
    try:
        db = get_db()
        employees_collection = db["employees"]
        
        # Try to find by user_id (integer) or employee_code (string)
        employee = employees_collection.find_one({
            "$or": [
                {"user_id": int(user_id) if user_id.isdigit() else -1},
                {"employee_code": user_id}
            ]
        })
        
        if employee:
            user = {
                "id": str(employee.get("_id", "")),
                "employee_id": str(employee.get("employee_code", employee.get("user_id", ""))),
                "full_name": employee.get("name", "Unknown"),
                "first_name": employee.get("name", "").split()[0] if employee.get("name") else "",
                "last_name": " ".join(employee.get("name", "").split()[1:]) if employee.get("name") and len(employee.get("name", "").split()) > 1 else "",
                "email": employee.get("email"),
                "department": employee.get("department"),
                "user_id": employee.get("user_id"),
                "biometric_enrolled": employee.get("biometric_enrolled", False)
            }
            return {"user": user}
        else:
            raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/public/{employee_id}")
def get_user_by_employee_id(employee_id: str):
    """
    Public endpoint to get user by employee ID (no auth required)
    """
    try:
        db = get_db()
        employees_collection = db["employees"]
        
        employee = employees_collection.find_one({"employee_code": employee_id})
        
        if employee:
            return {
                "id": str(employee.get("_id", "")),
                "employee_id": str(employee.get("employee_code", employee.get("user_id", ""))),
                "full_name": employee.get("name", "Unknown"),
                "first_name": employee.get("name", "").split()[0] if employee.get("name") else "",
                "last_name": " ".join(employee.get("name", "").split()[1:]) if employee.get("name") and len(employee.get("name", "").split()) > 1 else "",
                "email": employee.get("email"),
                "department": employee.get("department"),
                "user_id": employee.get("user_id"),
                "biometric_enrolled": employee.get("biometric_enrolled", False)
            }
        else:
            raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/biometric/{biometric_id}")
def get_user_by_biometric_id(biometric_id: int):
    """
    Get user by biometric ID (device user ID)
    """
    try:
        db = get_db()
        employees_collection = db["employees"]
        
        employee = employees_collection.find_one({"user_id": biometric_id})
        
        if employee:
            user = {
                "id": str(employee.get("_id", "")),
                "employee_id": str(employee.get("employee_code", employee.get("user_id", ""))),
                "full_name": employee.get("name", "Unknown"),
                "first_name": employee.get("name", "").split()[0] if employee.get("name") else "",
                "last_name": " ".join(employee.get("name", "").split()[1:]) if employee.get("name") and len(employee.get("name", "").split()) > 1 else "",
                "email": employee.get("email"),
                "department": employee.get("department"),
                "user_id": employee.get("user_id"),
                "biometric_enrolled": employee.get("biometric_enrolled", False)
            }
            return {"user": user}
        else:
            raise HTTPException(status_code=404, detail=f"User with biometric ID {biometric_id} not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{user_id}")
def update_user(user_id: str, user: User):
    """
    Update user information
    """
    try:
        db = get_db()
        employees_collection = db["employees"]
        
        update_data = {
            "name": user.full_name,
            "email": user.email,
            "department": user.department,
            "biometric_enrolled": user.biometric_enrolled
        }
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        result = employees_collection.update_one(
            {
                "$or": [
                    {"user_id": int(user_id) if user_id.isdigit() else -1},
                    {"employee_code": user_id}
                ]
            },
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return {"success": True, "message": f"User {user_id} updated"}
        else:
            raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
