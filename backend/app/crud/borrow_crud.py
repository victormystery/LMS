from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from backend.app.db import models

BORROW_DAYS_DEFAULT = 2


def create_borrow(db: Session, user_id: int, book_id: int) -> models.Borrow:
    """Create a new borrow record with a default due date."""
    due = datetime.utcnow() + timedelta(days=BORROW_DAYS_DEFAULT)
    borrow = models.Borrow(user_id=user_id, book_id=book_id, due_date=due)
    db.add(borrow)
    db.commit()
    db.refresh(borrow)
    return borrow


def get_borrow(db: Session, borrow_id: int) -> models.Borrow | None:
    """Retrieve a borrow record by ID."""
    return db.query(models.Borrow).filter(models.Borrow.id == borrow_id).first()


def list_user_borrows(db: Session, user_id: int) -> list[models.Borrow]:
    """List all borrow records for a given user."""
    return db.query(models.Borrow).filter(models.Borrow.user_id == user_id).all()


def set_returned(db: Session, borrow: models.Borrow) -> models.Borrow:
    """
    Mark a borrow record as returned.

    The borrow object must already be fetched (cannot pass just an ID).
    """
    borrow.returned_at = datetime.utcnow()
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

    if borrow.user_id != user_id:
        raise ValueError("You cannot return a book you did not borrow")

    return set_returned(db, borrow)
