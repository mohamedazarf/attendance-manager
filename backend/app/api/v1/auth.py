from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.utils import get_db
from app.security import verify_password, get_password_hash, create_access_token
from app.schemas.user_platform import UserPlatformCreate, Token, UserPlatform
from datetime import datetime
from bson import ObjectId
from app.core.config import SECRET_KEY, ALGORITHM

router = APIRouter(tags=["Authentication"])

@router.post("/register", response_model=UserPlatform)
def register(user_in: UserPlatformCreate):
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
    try:
        user_dict["hashed_password"] = get_password_hash(password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    user_dict["created_at"] = datetime.utcnow()
    
    result = users_collection.insert_one(user_dict)
    
    return {
        "id": str(result.inserted_id),
        **user_dict
    }

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_db()
    users_collection = db["platform_users"]
    
    user = users_collection.find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user["username"], "role": user.get("role", "simple_user")}
    )

    return {"access_token": access_token, "token_type": "bearer"}


