from fastapi import APIRouter, Depends, HTTPException, status
from app.utils import get_db
from app.dependencies import RoleChecker, get_current_user
from app.schemas.user_platform import RoleCreate, Role
from typing import List

router = APIRouter(tags=["Roles"])

# Only admins can manage roles
admin_check = RoleChecker(["admin"])

@router.get("/", response_model=List[Role], dependencies=[Depends(admin_check)])
def get_roles():
    db = get_db()
    roles = list(db["roles"].find())
    return [{"id": str(r["_id"]), **r} for r in roles]

@router.post("/", response_model=Role, dependencies=[Depends(admin_check)])
def create_role(role_in: RoleCreate):
    db = get_db()
    # Check if role exists
    if db["roles"].find_one({"name": role_in.name}):
        raise HTTPException(status_code=400, detail="Role already exists")
    
    result = db["roles"].insert_one(role_in.dict())
    return {"id": str(result.inserted_id), **role_in.dict()}

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    # Remove hashed_password for security
    user_data = current_user.copy()
    user_data.pop("hashed_password", None)
    user_data.pop("_id", None)
    return user_data
