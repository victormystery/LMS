from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    username: str
    full_name: Optional[str]
    password: str
    role: Optional[str] = "student"


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: Optional[str]
    role: str
    is_active: bool

    class Config:
        orm_mode = True


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenUserResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

    class Config:
        orm_mode = True


class TokenData(BaseModel):
    username: Optional[str] = None
