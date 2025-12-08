from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from backend.app.api.depend import get_current_user
from backend.app.db.session import get_db
from backend.app.services.payment import PaymentService
from backend.app.schemas.borrow_schema import BorrowRead, BorrowWithUserRead


router = APIRouter()


class PaymentRequest(BaseModel):
    borrow_id: int


class PaymentSummary(BaseModel):
    total_unpaid: int
    total_paid: int
    count_unpaid: int
    count_paid: int


class PaymentHistoryItem(BaseModel):
    id: int
    user_id: int
    book_id: int
    borrowed_at: datetime
    due_date: datetime
    returned_at: Optional[datetime]
    fee_applied: float
    payment_status: str
    paid_at: Optional[datetime]
    username: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    book_title: Optional[str] = None


@router.post("/pay/{borrow_id}")
def pay_late_fee(
    borrow_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Process payment for a late fee."""
    service = PaymentService(db)
    
    try:
        borrow = service.process_payment(borrow_id, current_user.id)
        return {
            "message": "Payment successful",
            "borrow_id": borrow_id,
            "fee_paid": borrow.fee_applied,
            "payment_status": borrow.payment_status
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/unpaid", response_model=List[BorrowRead])
def get_unpaid_fees(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get all unpaid late fees for the current user."""
    service = PaymentService(db)
    unpaid = service.get_unpaid_fees(current_user.id)
    return unpaid


@router.get("/summary", response_model=PaymentSummary)
def get_payment_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get summary of all fees for the current user."""
    service = PaymentService(db)
    unpaid_borrows = service.get_unpaid_fees(current_user.id)
    paid_borrows = service.get_paid_fees(current_user.id)
    total_unpaid = service.get_total_unpaid_amount(current_user.id)
    total_paid = service.get_total_paid_amount(current_user.id)
    
    return {
        "total_unpaid": total_unpaid,
        "total_paid": total_paid,
        "count_unpaid": len(unpaid_borrows),
        "count_paid": len(paid_borrows)
    }


@router.get("/all-summary", response_model=PaymentSummary)
def get_all_payment_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get summary of all fees across all users (librarian only)."""
    if current_user.role not in ["librarian", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view all payment summaries."
        )
    
    from backend.app.db import models
    from datetime import datetime
    
    # Get unpaid fees from returned books
    unpaid_returned = (
        db.query(models.Borrow)
        .join(models.User, models.Borrow.user_id == models.User.id)
        .filter(
            models.Borrow.fee_applied > 0,  # type: ignore
            models.Borrow.payment_status == "unpaid",
            models.Borrow.returned_at.isnot(None),
            models.User.role.in_(["student", "faculty"])
        )
        .all()
    )
    
    # Get currently overdue books (not returned yet)
    now = datetime.utcnow()
    currently_overdue = (
        db.query(models.Borrow)
        .join(models.User, models.Borrow.user_id == models.User.id)
        .filter(
            models.Borrow.returned_at.is_(None),
            models.Borrow.due_date < now,  # type: ignore
            models.User.role.in_(["student", "faculty"])
        )
        .all()
    )
    
    # Calculate fees for currently overdue books
    service = PaymentService(db)
    for borrow in currently_overdue:
        current_fee = service.calculate_current_fee(borrow)
        borrow.fee_applied = int(current_fee)  # type: ignore
    
    # Combine unpaid - include all overdue books regardless of fee amount
    all_unpaid = unpaid_returned + currently_overdue
    
    # Get paid fees
    paid = (
        db.query(models.Borrow)
        .join(models.User, models.Borrow.user_id == models.User.id)
        .filter(
            models.Borrow.fee_applied > 0,  # type: ignore
            models.Borrow.payment_status == "paid",
            models.User.role.in_(["student", "faculty"])
        )
        .all()
    )
    
    total_unpaid = sum(float(borrow.fee_applied) for borrow in all_unpaid)  # type: ignore
    total_paid = sum(float(borrow.fee_applied) for borrow in paid)  # type: ignore
    
    return {
        "total_unpaid": total_unpaid,
        "total_paid": total_paid,
        "count_unpaid": len(all_unpaid),
        "count_paid": len(paid)
    }


@router.get("/all-unpaid", response_model=List[BorrowWithUserRead])
def get_all_unpaid_fees(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get all unpaid fees across all users (librarian only)."""
    if current_user.role not in ["librarian", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view all unpaid fees."
        )
    
    # Get all unpaid fees with user information from returned books
    from backend.app.db import models
    from datetime import datetime
    
    unpaid_returned = (
        db.query(models.Borrow, models.User)
        .join(models.User, models.Borrow.user_id == models.User.id)
        .filter(
            models.Borrow.fee_applied > 0,  # type: ignore
            models.Borrow.payment_status == "unpaid",
            models.Borrow.returned_at.isnot(None),
            models.User.role.in_(["student", "faculty"])  # Only students and faculty
        )
        .all()
    )
    
    # Get currently overdue books (not returned yet)
    now = datetime.utcnow()
    currently_overdue = (
        db.query(models.Borrow, models.User)
        .join(models.User, models.Borrow.user_id == models.User.id)
        .filter(
            models.Borrow.returned_at.is_(None),
            models.Borrow.due_date < now,  # type: ignore
            models.User.role.in_(["student", "faculty"])
        )
        .all()
    )
    
    # Calculate fees for currently overdue books
    service = PaymentService(db)
    for borrow, user in currently_overdue:
        current_fee = service.calculate_current_fee(borrow)
        borrow.fee_applied = int(current_fee)  # type: ignore
    
    # Combine both lists - include all overdue books
    all_unpaid = unpaid_returned + currently_overdue
    
    # Format response with user information
    result = []
    for borrow, user in all_unpaid:
        result.append({
            "id": borrow.id,
            "user_id": borrow.user_id,
            "book_id": borrow.book_id,
            "borrowed_at": borrow.borrowed_at,
            "due_date": borrow.due_date,
            "returned_at": borrow.returned_at,
            "fee_applied": borrow.fee_applied,
            "payment_status": borrow.payment_status,
            "paid_at": borrow.paid_at,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role
        })
    
    return result


@router.get("/history", response_model=List[PaymentHistoryItem])
def get_payment_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    status_filter: Optional[str] = Query(None, description="Filter by payment status: 'paid', 'unpaid', or None for all")
):
    """Get payment history for the current user."""
    from backend.app.db import models
    
    query = (
        db.query(models.Borrow, models.Book)
        .outerjoin(models.Book, models.Borrow.book_id == models.Book.id)
        .filter(
            models.Borrow.user_id == current_user.id,
            models.Borrow.fee_applied > 0  # type: ignore
        )
    )
    
    if status_filter:
        query = query.filter(models.Borrow.payment_status == status_filter)
    
    query = query.order_by(models.Borrow.borrowed_at.desc())  # type: ignore
    results = query.all()
    
    history = []
    for borrow, book in results:
        history.append({
            "id": borrow.id,
            "user_id": borrow.user_id,
            "book_id": borrow.book_id,
            "borrowed_at": borrow.borrowed_at,
            "due_date": borrow.due_date,
            "returned_at": borrow.returned_at,
            "fee_applied": borrow.fee_applied,
            "payment_status": borrow.payment_status,
            "paid_at": borrow.paid_at,
            "book_title": book.title if book else None
        })
    
    return history


@router.get("/all-history", response_model=List[PaymentHistoryItem])
def get_all_payment_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    status_filter: Optional[str] = Query(None, description="Filter by payment status: 'paid', 'unpaid', or None for all"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of records to return")
):
    """Get payment history for all users (librarian only)."""
    if current_user.role not in ["librarian", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view all payment history."
        )
    
    from backend.app.db import models
    
    query = (
        db.query(models.Borrow, models.User, models.Book)
        .join(models.User, models.Borrow.user_id == models.User.id)
        .outerjoin(models.Book, models.Borrow.book_id == models.Book.id)
        .filter(
            models.Borrow.fee_applied > 0,  # type: ignore
            models.User.role.in_(["student", "faculty"])
        )
    )
    
    if status_filter:
        query = query.filter(models.Borrow.payment_status == status_filter)
    
    query = query.order_by(models.Borrow.borrowed_at.desc()).limit(limit)  # type: ignore
    results = query.all()
    
    history = []
    for borrow, user, book in results:
        history.append({
            "id": borrow.id,
            "user_id": borrow.user_id,
            "book_id": borrow.book_id,
            "borrowed_at": borrow.borrowed_at,
            "due_date": borrow.due_date,
            "returned_at": borrow.returned_at,
            "fee_applied": borrow.fee_applied,
            "payment_status": borrow.payment_status,
            "paid_at": borrow.paid_at,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "book_title": book.title if book else None
        })
    
    return history
