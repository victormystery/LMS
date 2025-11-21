from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.db import models

def create_book(db: Session, book_in) -> models.Book:
    b = models.Book(
        title=book_in.title,
        author=book_in.author,
        isbn=book_in.isbn,
        total_copies=book_in.total_copies,
        available_copies=book_in.total_copies,
        description=book_in.description,
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return b

def get_book(db: Session, book_id: int) -> Optional[models.Book]:
    return db.query(models.Book).filter(models.Book.id == book_id).first()

def get_book_by_isbn(db: Session, isbn: str) -> Optional[models.Book]:
    return db.query(models.Book).filter(models.Book.isbn == isbn).first()

def list_books(db: Session, skip: int = 0, limit: int = 100) -> List[models.Book]:
    return db.query(models.Book).offset(skip).limit(limit).all()

def search_books(db: Session, q: str):
    q_like = f"%{q}%"
    return db.query(models.Book).filter((models.Book.title.like(q_like)) | (models.Book.author.like(q_like)) | (models.Book.isbn.like(q_like))).all()

def update_book(db: Session, book: models.Book, patch) -> models.Book:
    for field, value in patch.dict(exclude_unset=True).items():
        setattr(book, field, value)
    # adjust available copies if total_copies changed
    if "total_copies" in patch.dict(exclude_unset=True):
        # naive adjust: ensure available <= total
        if book.available_copies > book.total_copies:
            book.available_copies = book.total_copies
    db.add(book)
    db.commit()
    db.refresh(book)
    return book

def delete_book(db: Session, isbn: str) -> bool:
    book = get_book_by_isbn(db, isbn)
    if not book:
        return False
    db.delete(book)
    db.commit()
    return True
