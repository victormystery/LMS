from pydantic import BaseModel, ConfigDict
from typing import Optional

class BookCreate(BaseModel):
    title: str
    author: str
    isbn: str
    total_copies: int = 1
    description: Optional[str] = None

class BookRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    title: str
    author: str
    isbn: str
    total_copies: int
    available_copies: int
    description: Optional[str]

class BookUpdate(BaseModel):
    title: Optional[str]
    author: Optional[str]
    total_copies: Optional[int]
    description: Optional[str]
