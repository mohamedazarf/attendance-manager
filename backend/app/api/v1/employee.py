from fastapi import APIRouter, HTTPException
from app.repositories.employeeRepo import EmployeeRepository
from app.services.attendanceHistoryService import AttendanceHistoryService
from zk import ZK
from app.schemas.employee import Employee
from app.services.employee_service import EmployeeService
from app.sdk.mock import ZKMock
from app.utils import get_db
from datetime import date
router = APIRouter(tags=["Employees"])


@router.get("/")
def get_employees():
    try:
        repo = EmployeeRepository()
        service = EmployeeService(repo)
        service.sync_employees()
        return service.get_all()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching employees: {str(e)}"
        )   


@router.get("/next-code")
def get_next_employee_code():
    try:
        repo = EmployeeRepository()
        service = EmployeeService(repo)
        return {"next_code": service.get_next_employee_code()}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating next employee code: {str(e)}"
        )


@router.get("/ingest-mock")
@router.post("/ingest-mock")
def ingest_employees_mock():
    """
    Endpoint for testing with mocked employee data.
    Inserts mock employees into 'employees_mock' collection.
    """
    db = get_db()
    employees_collection = db["employees_mock"]
    
    # Get mock employees
    zk_mock = ZKMock('192.168.100.5', port=4370, timeout=5)
    conn = zk_mock.connect()
    employees = conn.get_employees()
    conn.disconnect()
    
    # Insert into employees_mock collection
    if employees:
        result = employees_collection.insert_many(employees)
        return {
            "status": "success",
            "inserted": len(result.inserted_ids),
            "collection": "employees_mock"
        }
    else:
        return {"status": "error", "message": "No employees to insert"}



@router.get("/{employee_id}/history")
def get_employee_history(
    employee_id: int,
    date_from: date,
    date_to: date
):
    service = AttendanceHistoryService()
    return service.get_employee_history(employee_id, date_from, date_to)
