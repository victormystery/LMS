from pydantic import BaseModel, field_validator
from typing import Optional
import re

class UserCreate(BaseModel):
    username: str
    full_name: Optional[str]
    password: str
    role: Optional[str] = "student"

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not v:
            raise ValueError('Username is required')
        if not re.match(r'^[a-zA-Z][a-zA-Z0-9_-]*$', v):
            raise ValueError('Username must start with a letter and contain only letters, numbers, underscores, and hyphens')
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        return v

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not v.strip():
            raise ValueError('Full name cannot be empty')
        if not re.match(r"^[a-zA-Z][a-zA-Z\s'-]*$", v):
            raise ValueError('Full name must contain only letters, spaces, hyphens, and apostrophes')
        if len(v.strip()) < 2:
            raise ValueError('Full name must be at least 2 characters long')
        return v.strip()


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: Optional[str]
    role: str
    is_active: bool

    class Config:
        from_attributes = True


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
        from_attributes = True


class TokenData(BaseModel):
    username: Optional[str] = None
