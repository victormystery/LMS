from backend.app.db import models
from backend.app.crud import borrow_crud as crud_borrow, books_crud as crud_book
from backend.app.db.session import SessionLocal
from sqlalchemy.orm import Session
from datetime import datetime

class BorrowService:
    def __init__(self, db: Session):
        self.db = db

    def borrow(self, user, book_id: int):
        book = crud_book.get_book(self.db, book_id)
        if not book:
            raise ValueError("book not found")
        if book.available_copies <= 0:
            raise ValueError("no copies available")
        # check user's active borrows
        active = self.db.query(models.Borrow).filter(models.Borrow.user_id == user.id, models.Borrow.returned_at == None).count()
        if hasattr(user, "max_borrow_limit") and active >= user.max_borrow_limit():
            raise ValueError("borrow limit reached")
        # decrement
        book.available_copies -= 1
        self.db.add(book)
        self.db.commit()
        borrow = crud_borrow.create_borrow(self.db, user.id, book_id)
        return borrow

    def return_book(self, borrow_id: int, user_id: int):
    # Use the same session as the service
        borrow = crud_borrow.get_borrow(self.db, borrow_id)
        if not borrow:
            raise ValueError("Borrow record not found")

        if borrow.user_id != user_id:
            raise ValueError("You cannot return another user's borrow")

        if borrow.returned_at:
            raise ValueError("Already returned")

        # CORRECT: pass both db and borrow object
        borrow = crud_borrow.set_returned(self.db, borrow)

        # Update book copies
        book = self.db.query(models.Book).filter(models.Book.id == borrow.book_id).first()
        if book and book.available_copies < book.total_copies:
            book.available_copies += 1
            self.db.commit()
            # Notify reservation queue that a copy became available
            try:
                from backend.app.services.reservation import ReservationService
                svc = ReservationService(self.db)
                svc.notify_available(book.id)
            except Exception:
                # don't let notification errors block return
                pass

        # Calculate late fee
        fee = 0
        if borrow.returned_at and borrow.due_date and borrow.returned_at > borrow.due_date:
            days = (borrow.returned_at - borrow.due_date).days
            fee = days * 1
            borrow.fee_applied = fee
            self.db.commit()

        return borrow



# Decorator example
class FeeDecorator:
    def __init__(self, service: BorrowService, fee_per_day: int = 1):
        self.service = service
        self.fee_per_day = fee_per_day

    def borrow(self, user, book_id: int):
        return self.service.borrow(user, book_id)

    def return_book(self, borrow_id: int):
        borrow = self.service.return_book(borrow_id)
        # fee already calculated inside service; this decorator could add reservation fees etc.
        return borrow
