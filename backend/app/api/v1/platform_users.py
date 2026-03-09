from fastapi import APIRouter, Depends, HTTPException, status
from app.utils import get_db
from app.security import get_password_hash
from app.schemas.user_platform import UserPlatformCreate, UserPlatformUpdate, UserPlatform
from app.dependencies import RoleChecker, get_current_user
from datetime import datetime
from bson import ObjectId
from typing import List

router = APIRouter(tags=["Platform Users"])

# Only admins can manage platform users
admin_only = RoleChecker(["admin"])

@router.get("/", response_model=List[UserPlatform], dependencies=[Depends(admin_only)])
def list_platform_users():
    db = get_db()
    users_collection = db["platform_users"]
    
    users = list(users_collection.find())
    
    # Convert _id to string for the response model
    for user in users:
        user["id"] = str(user["_id"])
    
    return users

@router.post("/", response_model=UserPlatform, dependencies=[Depends(admin_only)])
def create_platform_user(user_in: UserPlatformCreate):
    db = get_db()
    users_collection = db["platform_users"]
    
    # Check if user already exists
    if users_collection.find_one({"username": user_in.username}):
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system."
        )
    
    user_dict = user_in.dict()
    password = user_dict.pop("password")
    user_dict["hashed_password"] = get_password_hash(password)
    user_dict["created_at"] = datetime.utcnow()
    
    result = users_collection.insert_one(user_dict)
    
    return {
        "id": str(result.inserted_id),
        **user_dict
    }

@router.put("/{user_id}", response_model=UserPlatform, dependencies=[Depends(admin_only)])
def update_platform_user(user_id: str, user_in: UserPlatformUpdate):
    db = get_db()
    users_collection = db["platform_users"]
    
    # Check if user exists
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_in.dict(exclude_unset=True)
    
    if "password" in update_data:
        password = update_data.pop("password")
        update_data["hashed_password"] = get_password_hash(password)
    
    if update_data:
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
    
    updated_user = users_collection.find_one({"_id": ObjectId(user_id)})
    updated_user["id"] = str(updated_user["_id"])
    
    return updated_user

@router.delete("/{user_id}", dependencies=[Depends(admin_only)])
def delete_platform_user(user_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    users_collection = db["platform_users"]
    
    # Check if user exists
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent user from deleting themselves
    if str(user["_id"]) == str(current_user["id"]):
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own account."
        )
    
    users_collection.delete_one({"_id": ObjectId(user_id)})
    
    return {"message": "User deleted successfully"}
