from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime


class ReservationItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    username: Optional[str]
    full_name: Optional[str]
    book_id: int
    created_at: datetime
    notified: int


class PagedReservations(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    items: List[ReservationItem]
    page: int
    page_size: int
    total: int
