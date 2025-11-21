from typing import List, Any
from backend.app.db import models
from backend.app.db.session import SessionLocal
from sqlalchemy.orm import Session

# Singleton Catalogue
class LibraryCatalogue:
    _instance = None

    def __init__(self, db: Session):
        self.db = db
        self._observers = []

    @classmethod
    def get_instance(cls, db: Session = None):
        if cls._instance is None:
            if db is None:
                # lazily create a DB session
                db = SessionLocal()
            cls._instance = LibraryCatalogue(db)
        return cls._instance

    def register(self, observer):
        if observer not in self._observers:
            self._observers.append(observer)

    def unregister(self, observer):
        if observer in self._observers:
            self._observers.remove(observer)

    def notify(self, event_type: str, payload: dict):
        for obs in list(self._observers):
            try:
                obs.update(event_type, payload)
            except Exception:
                pass

    # catalog operations
    def search(self, q: str):
        return self.db.query(models.Book).filter((models.Book.title.like(f"%{q}%")) | (models.Book.author.like(f"%{q}%"))).all()

    def get_book(self, book_id: int):
        return self.db.query(models.Book).filter(models.Book.id == book_id).first()

    def add_book(self, book_in):
        existing = self.db.query(models.Book).filter(models.Book.isbn == book_in.isbn).first()
        if existing:
            existing.total_copies += book_in.total_copies
            existing.available_copies += book_in.total_copies
            self.db.add(existing)
            self.db.commit()
            self.notify("book_updated", {"isbn": existing.isbn})
            return existing
        b = models.Book(title=book_in.title, author=book_in.author, isbn=book_in.isbn, total_copies=book_in.total_copies, available_copies=book_in.total_copies, description=book_in.description)
        self.db.add(b)
        self.db.commit()
        self.db.refresh(b)
        self.notify("book_added", {"isbn": b.isbn})
        return b

    def remove_by_isbn(self, isbn: str) -> bool:
        book = self.db.query(models.Book).filter(models.Book.isbn == isbn).first()
        if not book:
            return False
        self.db.delete(book)
        self.db.commit()
        self.notify("book_removed", {"isbn": isbn})
        return True
