from fastapi import APIRouter
from app.services.zk_service import ZKService
from app.services.SyncService import SyncService
from app.schemas.employee import Employee, CreateEnrollRequest
from typing import Optional

router = APIRouter()
zk_service = ZKService()
sync_service = SyncService()

@router.get("/users")
def get_device_users():
    users = zk_service.list_users()
    return [
        {
            "uid": u.uid,
            "user_id": u.user_id,
            "name": u.name,
            "privilege": u.privilege,
            "card": u.card
        }
        for u in users
    ]


@router.post("/users")
def create_user(uid: int, name: str):
    return zk_service.create_user(uid, name)


@router.delete("/users/{uid}")
def delete_user(uid: int):
    return zk_service.delete_user(uid)

@router.get("/sync")
def sync_data():
    return sync_service.sync_all()

@router.post("/sync")
def sync_data():
    return sync_service.sync_all()

@router.post("/sync/employees")
def sync_employees():
    return sync_service.sync_employees()

@router.post("/sync/attendances")
def sync_attendances():
    return sync_service.sync_attendances()


@router.post("/users/create")
def create_user_request(request: CreateEnrollRequest):
    return zk_service.create_user(
        uid=request.uid,
        name=request.name,
        privilege=request.privilege,
        password=request.password or "",
        user_id=str(request.uid),
        department=request.department
    )

@router.get("/users/{uid}/fingerprint-status")
def fingerprint_status(uid: int):
    return zk_service.check_fingerprints(uid)

@router.post("/users/{uid}/enroll")
def enroll_user(uid: int):
    return zk_service.enroll_fingerprint(uid)

@router.post("/users/{uid}/set-password")
def set_password(uid: int, password: str):
    return zk_service.set_user_password(uid, password)

@router.put("/users/{uid}")
def update_user(uid: int, name: Optional[str] = None, privilege: Optional[int] = None, department: Optional[str] = None):
    # 1️⃣ Update sur le device et en DB (via update_user)
    update_result = zk_service.update_user(str(uid), name, privilege, department)

    # 2️⃣ Vérifie si l’update a réussi
    if update_result.get("status") != "success":
        return update_result  # retourne l’erreur directement

    # 3️⃣ Resynchronisation DB ↔ Device
    sync_result = sync_service.sync_employees()

    # 4️⃣ Retour combiné pour le front
    return {
        "update": update_result,
        "sync": sync_result
    }
