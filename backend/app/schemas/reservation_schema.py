from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ReservationItem(BaseModel):
    id: int
    user_id: int
    username: Optional[str]
    full_name: Optional[str]
    book_id: int
    created_at: datetime
    notified: int

    class Config:
        orm_mode = True


class PagedReservations(BaseModel):
    items: List[ReservationItem]
    page: int
    page_size: int
    total: int

    class Config:
        orm_mode = True
