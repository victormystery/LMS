from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session

from backend.app.api.depend import get_current_user
from backend.app.db.session import get_db
from backend.app.db.models import Borrow
from backend.app.schemas.borrow_schema import BorrowRequest, BorrowRead
from backend.app.services.borrow_books import BorrowService
from backend.app.services.notification import NotificationManager
from backend.app.crud.borrow_crud import list_user_borrows, list_all_borrows


router = APIRouter()


@router.post("/", response_model=BorrowRead)
def borrow_book(
    req: BorrowRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    service = BorrowService(db)
    try:
        borrow = service.borrow(current_user, req.book_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    NotificationManager.get_instance().push({
        "type": "borrowed",
        "user_id": current_user.id,
        "book_id": req.book_id
    })

    return borrow


@router.post("/return/{borrow_id}", response_model=BorrowRead)
def return_book(
    borrow_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    service = BorrowService(db)

    try:
        borrow = service.return_book(borrow_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    NotificationManager.get_instance().push({
        "type": "returned",
        "borrow_id": borrow.id
    })

    return borrow


@router.get("/me", response_model=list[BorrowRead])
def my_borrows(
    include_returned: bool = False,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Return the current user's borrows.
    ?include_returned=true to show history.
    """
    records = list_user_borrows(db, current_user.id, include_returned)
    return records


@router.get("/overdue")
def overdue_borrows(db: Session = Depends(get_db)):
    """
    Returns all overdue borrows with real-time calculated fees:
    - not returned
    - due_date < now
    Includes user information and current accumulated fine
    """
    from backend.app.db import models
    now = datetime.utcnow()

    # Query with user join to get username and role
    records = (
        db.query(Borrow, models.User.username, models.User.full_name, models.User.role)
        .join(models.User, models.User.id == Borrow.user_id)
        .filter(
            Borrow.returned_at.is_(None),
            Borrow.due_date < now  # type: ignore
        )
        .all()
    )

    # Calculate real-time fees for each overdue borrow
    results = []
    for borrow, username, full_name, role in records:
        time_diff = now - borrow.due_date  # type: ignore
        hours_overdue = int(time_diff.total_seconds() / 3600)
        if hours_overdue < 1 and time_diff.total_seconds() > 0:
            hours_overdue = 1
        # Initial fee of £5 + £1 for each hour overdue
        current_fee = 5 + (hours_overdue * 1)
        
        results.append({
            "id": borrow.id,
            "user_id": borrow.user_id,
            "username": username,
            "full_name": full_name,
            "role": role,
            "book_id": borrow.book_id,
            "borrowed_at": borrow.borrowed_at,
            "due_date": borrow.due_date,
            "returned_at": borrow.returned_at,
            "hours_overdue": hours_overdue,
            "current_fee": current_fee,
            "fee_applied": borrow.fee_applied,
            "payment_status": borrow.payment_status,
            "paid_at": borrow.paid_at,
        })

    return results


@router.get("/all", response_model=list[BorrowRead])
def get_all_borrows(
    start_date: Optional[str] = Query(None, description="Filter from this date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter until this date (YYYY-MM-DD)"),
    category: Optional[str] = Query(None, description="Filter by book category"),
    include_returned: bool = Query(True, description="Include returned books"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Get all borrow records with optional filtering by date range and category.
    Only accessible by librarians and admins.
    """
    # Check if user is librarian or admin
    if current_user.role not in ["librarian", "admin"]:
        raise HTTPException(status_code=403, detail="Access forbidden: librarians only")
    
    # Parse dates if provided
    start_datetime = None
    end_datetime = None
    
    if start_date:
        try:
            start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
    
    if end_date:
        try:
            end_datetime = datetime.strptime(end_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
    
    # Get filtered borrows
    borrows = list_all_borrows(
        db=db,
        start_date=start_datetime,
        end_date=end_datetime,
        category=category,
        include_returned=include_returned
    )
    
    return borrows
