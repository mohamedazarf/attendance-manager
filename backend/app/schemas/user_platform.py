from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: List[str] = []

class RoleCreate(RoleBase):
    pass

class Role(RoleBase):
    id: str

class UserPlatformBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: str = "simple_user"
    is_active: bool = True

class UserPlatformCreate(UserPlatformBase):
    password: str

class UserPlatformUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class UserPlatformInDB(UserPlatformBase):
    id: str
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserPlatform(UserPlatformBase):
    id: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
