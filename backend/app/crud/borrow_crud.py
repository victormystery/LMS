from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from backend.app.db import models

BORROW_DAYS_DEFAULT = 14

def create_borrow(db: Session, user_id: int, book_id: int) -> models.Borrow:
    due = datetime.utcnow() + timedelta(days=BORROW_DAYS_DEFAULT)
    borrow = models.Borrow(user_id=user_id, book_id=book_id, due_date=due)
    db.add(borrow)
    db.commit()
    db.refresh(borrow)
    return borrow

def get_borrow(db: Session, borrow_id: int):
    return db.query(models.Borrow).filter(models.Borrow.id == borrow_id).first()

def list_user_borrows(db: Session, user_id: int):
    return db.query(models.Borrow).filter(models.Borrow.user_id == user_id).all()

def set_returned(db: Session, borrow: models.Borrow):
    borrow.returned_at = datetime.utcnow()
    db.add(borrow)
    db.commit()
    db.refresh(borrow)
    return borrow
