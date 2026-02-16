from fastapi import APIRouter
from app.services.zk_service import ZKService
from app.services.SyncService import SyncService

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


@router.post("/sync")
def sync_data():
    return sync_service.sync_all()
