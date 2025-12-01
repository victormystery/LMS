from backend.app.crud import reservation_crud
from backend.app.services.notification import NotificationManager
from backend.app.crud import user_crud
from backend.app.crud import books_crud


class ReservationService:
    def __init__(self, db):
        self.db = db

    def reserve_book(self, user, book_id: int):
        # Check if already reserved by this user for the same book and not yet notified
        existing = reservation_crud.get_reservation_by_user_and_book(self.db, user.id, book_id, notified=0)
        if existing:
            raise ValueError("Already reserved")
        # Only allow reservation when no copies are currently available
        from backend.app.db import models
        book = self.db.query(models.Book).filter(models.Book.id == book_id).first()
        if not book:
            raise ValueError("Book not found")
        if getattr(book, "available_copies", 0) > 0:
            raise ValueError("Book is currently available; reservation not allowed")

        reservation = reservation_crud.create_reservation(self.db, user.id, book_id)
        return reservation

    def notify_available(self, book_id: int):
        reservations = reservation_crud.list_reservations_for_book(self.db, book_id)
        # fetch book title for context
        book = books_crud.get_book(self.db, book_id)
        book_title = getattr(book, "title", None)
        for res in reservations:
            user = user_crud.get_user(self.db, res.user_id)
            username = getattr(user, "username", None)
            full_name = getattr(user, "full_name", None)
            NotificationManager.get_instance().push({
                "type": "book_available",
                "user_id": res.user_id,
                "username": username,
                "full_name": full_name,
                "book_id": book_id,
                "book_title": book_title,
            })
            reservation_crud.mark_reservation_notified(self.db, res.id)
