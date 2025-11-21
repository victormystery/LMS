from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.db.session import get_db
from backend.app.schemas.book_schema import BookCreate, BookRead, BookUpdate
from backend.app.crud import books_crud as crud_book
from backend.app.api.depend import get_current_user, require_librarian
from backend.app.services.catalogue import LibraryCatalogue

router = APIRouter()

@router.post("/", response_model=BookRead)
def add_book(book_in: BookCreate, db: Session = Depends(get_db), _=Depends(require_librarian)):
    catalogue = LibraryCatalogue.get_instance(db)
    b = catalogue.add_book(book_in)
    return b

@router.get("/", response_model=List[BookRead])
def list_books(q: Optional[str] = None, db: Session = Depends(get_db)):
    if q:
        return crud_book.search_books(db, q)
    return crud_book.list_books(db)

@router.get("/{book_id}", response_model=BookRead)
def get_book(book_id: int, db: Session = Depends(get_db)):
    b = crud_book.get_book(db, book_id)
    if not b:
        raise HTTPException(status_code=404, detail="book not found")
    return b

@router.put("/{book_id}", response_model=BookRead)
def update_book(book_id: int, patch: BookUpdate, db: Session = Depends(get_db), _=Depends(require_librarian)):
    book = crud_book.get_book(db, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="book not found")
    return crud_book.update_book(db, book, patch)

@router.delete("/{isbn}")
def delete_book(isbn: str, db: Session = Depends(get_db), _=Depends(require_librarian)):
    ok = crud_book.delete_book(db, isbn)
    if not ok:
        raise HTTPException(status_code=404, detail="book not found")
    return {"detail": "deleted"}
