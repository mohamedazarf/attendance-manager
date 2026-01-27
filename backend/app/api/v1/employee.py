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

from fastapi import APIRouter
from app.repositories.employeeRepo import EmployeeRepository
from zk import ZK
from app.schemas.employee import Employee
from app.services.employee_service import EmployeeService
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