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
        category=getattr(book_in, "category", None),
        publisher=getattr(book_in, "publisher", None),
        publication_year=getattr(book_in, "publication_year", None),
        book_format=getattr(book_in, "book_format", None),
        shelf=getattr(book_in, "shelf", None),
        subcategory=getattr(book_in, "subcategory", None),
        cover_url=getattr(book_in, "cover_url", None),
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
    return db.query(models.Book).filter(
        (models.Book.title.like(q_like)) |
        (models.Book.author.like(q_like)) |
        (models.Book.isbn.like(q_like)) |
        (models.Book.category.like(q_like)) |
        (models.Book.subcategory.like(q_like))
    ).all()


def search_books_with_filters(db: Session, q: Optional[str] = None, category: Optional[str] = None,
                              subcategory: Optional[str] = None, book_format: Optional[str] = None,
                              publication_year: Optional[int] = None, shelf: Optional[str] = None):
    qry = db.query(models.Book)
    if q:
        q_like = f"%{q}%"
        qry = qry.filter(
            (models.Book.title.like(q_like)) |
            (models.Book.author.like(q_like)) |
            (models.Book.isbn.like(q_like))
        )
    if category:
        qry = qry.filter(models.Book.category == category)
    if subcategory:
        qry = qry.filter(models.Book.subcategory == subcategory)
    if book_format:
        qry = qry.filter(models.Book.book_format == book_format)
    if publication_year:
        qry = qry.filter(models.Book.publication_year == publication_year)
    if shelf:
        qry = qry.filter(models.Book.shelf == shelf)
    return qry.all()


def update_book(db: Session, book: models.Book, patch) -> models.Book:
    for field, value in patch.dict(exclude_unset=True).items():
        setattr(book, field, value)

    # Keep available copies aligned with total copies
    if "total_copies" in patch.dict(exclude_unset=True):
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
