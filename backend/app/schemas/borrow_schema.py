from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class BorrowRequest(BaseModel):
    book_id: int

class BorrowRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    book_id: int
    borrowed_at: datetime
    due_date: datetime
    returned_at: Optional[datetime]
    fee_applied: int
