from pydantic import BaseModel
from typing import Optional

class BookCreate(BaseModel):
    title: str
    author: str
    isbn: str
    total_copies: int = 1
    description: Optional[str] = None

class BookRead(BaseModel):
    id: int
    title: str
    author: str
    isbn: str
    total_copies: int
    available_copies: int
    description: Optional[str]

    class Config:
        orm_mode = True

class BookUpdate(BaseModel):
    title: Optional[str]
    author: Optional[str]
    total_copies: Optional[int]
    description: Optional[str]
