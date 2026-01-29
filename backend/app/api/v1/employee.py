# from fastapi import APIRouter, Depends, Query
# from app.core.database import get_db
# from app.repositories.employee_repo import EmployeeRepository

# router = APIRouter(prefix="/employees", tags=["Employees"])


# @router.get("/")
# def get_employees(
#     is_active: bool | None = Query(None, description="Filtrer par statut"),
# ):
#     """
#     Retourne la liste des employés
#     (lecture seule, aucune insertion)
#     """
#     repo = EmployeeRepository(get_db())

#     if is_active is not None:
#         employees = repo.find_by_status(is_active)
#     else:
#         employees = repo.find_all()

#     return employees



# from fastapi import APIRouter, HTTPException
# from zk import ZK

# router = APIRouter(tags=["Employees"])


# @router.get("/")
# def get_employees():
#     try:
#         zk = ZK("192.168.100.5", port=4370, timeout=5)
#         conn = zk.connect()

#         users = conn.get_users()

#         conn.disconnect()

      
      
            
#         return [
#             {
#                 "uid": user.uid,
#                 "employee_code": user.user_id,
#                 "name": user.name,
#                 "privilege": user.privilege,
#                 "group_id": user.group_id,
#                 "card": user.card,
#             }
#             for user in users
#         ]
            


#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"ZKTeco error: {str(e)}"
#         )

from fastapi import APIRouter, HTTPException
from app.repositories.employeeRepo import EmployeeRepository
from zk import ZK
from app.schemas.employee import Employee
from app.services.employee_service import EmployeeService
from app.sdk.mock import ZKMock
from app.utils import get_db

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