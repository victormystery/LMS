from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class BookCreate(BaseModel):
    title: str
    author: str
    isbn: str
    total_copies: int = 1
    description: Optional[str] = None
    category: Optional[str] = None
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    book_format: Optional[str] = None
    shelf: Optional[str] = None
    subcategory: Optional[str] = None
    cover_url: Optional[str] = None

    @field_validator("isbn")
    @classmethod
    def normalize_and_validate_isbn(cls, v: str) -> str:
        if not v:
            return v

        # Normalize: remove spaces and dashes
        cleaned = v.replace(" ", "").replace("-", "").strip()

        if not cleaned.isdigit():
            raise ValueError("ISBN must contain only digits (after removing dashes/spaces)")

        return cleaned

    @field_validator("publication_year")
    @classmethod
    def publication_year_valid(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        current_year = datetime.utcnow().year
        if v <= 0 or v > current_year:
            raise ValueError(f"publication_year must be between 1 and {current_year}")
        return v


class BookRead(BaseModel):
    id: int
    title: str
    author: str
    isbn: str
    total_copies: int
    available_copies: int
    description: Optional[str]
    category: Optional[str]
    publisher: Optional[str]
    publication_year: Optional[int]
    book_format: Optional[str]
    shelf: Optional[str]
    subcategory: Optional[str]
    cover_url: Optional[str]

    class Config:
        from_attributes = True


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    isbn: Optional[str] = None
    total_copies: Optional[int] = None
    description: Optional[str] = None
    category: Optional[str] = None
    publisher: Optional[str] = None
    publication_year: Optional[int] = None
    book_format: Optional[str] = None
    shelf: Optional[str] = None
    subcategory: Optional[str] = None
    cover_url: Optional[str] = None

    @field_validator("total_copies")
    @classmethod
    def total_copies_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError("total_copies must be non-negative")
        return v

    @field_validator("publication_year")
    @classmethod
    def publication_year_valid(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        current_year = datetime.utcnow().year
        if v <= 0 or v > current_year:
            raise ValueError(f"publication_year must be between 1 and {current_year}")
        return v
