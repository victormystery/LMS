from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class BorrowRequest(BaseModel):
    book_id: int

class BorrowRead(BaseModel):
    id: int
    user_id: int
    book_id: int
    borrowed_at: datetime
    due_date: datetime
    returned_at: Optional[datetime]
    fee_applied: int
    payment_status: str
    paid_at: Optional[datetime]

    class Config:
        from_attributes = True


class BorrowWithUserRead(BaseModel):
    id: int
    user_id: int
    book_id: int
    borrowed_at: datetime
    due_date: datetime
    returned_at: Optional[datetime]
    fee_applied: int
    payment_status: str
    paid_at: Optional[datetime]
    username: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None

    class Config:
        from_attributes = True
