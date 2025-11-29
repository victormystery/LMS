from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.api.depend import get_current_user
from backend.app.db.session import get_db
from backend.app.schemas.borrow_schema import BorrowRequest, BorrowRead
from backend.app.services.borrow_books import BorrowService
from backend.app.services.notification import NotificationManager
from backend.app.crud.borrow_crud import list_user_borrows

router = APIRouter()

@router.post("/", response_model=BorrowRead)
def borrow_book(req: BorrowRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    service = BorrowService(db)
    try:
        borrow = service.borrow(current_user, req.book_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    NotificationManager.get_instance().push({"type": "borrowed", "user_id": current_user.id, "book_id": req.book_id})
    return borrow

@router.post("/return/{borrow_id}", response_model=BorrowRead)
def return_book(
    borrow_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    service = BorrowService(db)

    try:
        # This must return a Borrow object, not an ID
        borrow = service.return_book(borrow_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Now borrow is a full model instance
    NotificationManager.get_instance().push({
        "type": "returned",
        "borrow_id": borrow.id
    })

    return borrow



@router.get("/me", response_model=list)
def my_borrows(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    records = list_user_borrows(db, current_user.id)
    return records
