from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from backend.app.db import models

BORROW_HOURS_DEFAULT = 1


def create_borrow(db: Session, user_id: int, book_id: int) -> models.Borrow:
    """Create a new borrow record with a default due date of 5 hours."""
    due = datetime.utcnow() + timedelta(hours=BORROW_HOURS_DEFAULT)
    borrow = models.Borrow(user_id=user_id, book_id=book_id, due_date=due)
    db.add(borrow)
    db.commit()
    db.refresh(borrow)
    return borrow


def get_borrow(db: Session, borrow_id: int) -> models.Borrow | None:
    """Retrieve a borrow record by ID."""
    return db.query(models.Borrow).filter(models.Borrow.id == borrow_id).first()


def list_user_borrows(db: Session, user_id: int, include_returned: bool = False) -> list[models.Borrow]:
    """List borrow records for a given user.

    By default this returns only active borrows (not yet returned). Set
    `include_returned=True` to include returned records as well.
    """
    q = db.query(models.Borrow).filter(models.Borrow.user_id == user_id)
    if not include_returned:
        q = q.filter(models.Borrow.returned_at.is_(None))
    return q.all()


def set_returned(db: Session, borrow: models.Borrow) -> models.Borrow:
    """
    Mark a borrow record as returned.

    The borrow object must already be fetched (cannot pass just an ID).
    """
    borrow.returned_at = datetime.utcnow()  # type: ignore
    db.add(borrow)
    db.commit()
    db.refresh(borrow)
    return borrow


def return_borrow_by_id(db: Session, borrow_id: int, user_id: int) -> models.Borrow:
    """
    Convenience method to fetch a borrow by ID, check user, and mark it returned.
    Raises ValueError if borrow not found or user mismatch.
    """
    borrow = get_borrow(db, borrow_id)
    if not borrow:
        raise ValueError("Borrow record not found")

    if borrow.user_id != user_id:  # type: ignore
        raise ValueError("You cannot return a book you did not borrow")

    return set_returned(db, borrow)


def list_all_borrows(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    category: Optional[str] = None,
    include_returned: bool = True
) -> list[models.Borrow]:
    """
    List all borrow records with optional filtering by date range and book category.
    
    Args:
        db: Database session
        start_date: Filter borrows from this date onwards
        end_date: Filter borrows up to this date
        category: Filter by book category
        include_returned: Whether to include returned books
    
    Returns:
        List of borrow records matching the filters
    """
    query = db.query(models.Borrow)
    
    # Apply date filters
    if start_date:
        query = query.filter(models.Borrow.borrowed_at >= start_date)
    if end_date:
        # Include the entire end_date day by adding 1 day
        end_of_day = end_date + timedelta(days=1)
        query = query.filter(models.Borrow.borrowed_at < end_of_day)
    
    # Filter by category if provided
    if category:
        query = query.join(models.Book).filter(models.Book.category == category)
    
    # Filter returned status
    if not include_returned:
        query = query.filter(models.Borrow.returned_at.is_(None))
    
    return query.order_by(models.Borrow.borrowed_at.desc()).all()
