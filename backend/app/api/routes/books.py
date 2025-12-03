from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.db.session import get_db
from backend.app.schemas.book_schema import BookCreate, BookRead, BookUpdate
from backend.app.crud import books_crud as crud_book
from backend.app.api.depend import get_current_user, require_librarian
from backend.app.services.catalogue import LibraryCatalogue
import os
from uuid import uuid4
from fastapi.responses import JSONResponse
import imghdr
from PIL import Image
from io import BytesIO

router = APIRouter()

# ------------------------- ADD BOOK -------------------------

@router.post("/", response_model=BookRead)
def add_book(book_in: BookCreate, db: Session = Depends(get_db), _=Depends(require_librarian)):
    catalogue = LibraryCatalogue.get_instance(db)
    b = catalogue.add_book(book_in)
    return b


# ------------------------- LIST BOOKS -------------------------

@router.get("/", response_model=List[BookRead])
def list_books(
    q: Optional[str] = None,
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    book_format: Optional[str] = None,
    publication_year: Optional[int] = None,
    shelf: Optional[str] = None,
    db: Session = Depends(get_db),
):
    if any([q, category, subcategory, book_format, publication_year, shelf]):
        return crud_book.search_books_with_filters(
            db,
            q=q,
            category=category,
            subcategory=subcategory,
            book_format=book_format,
            publication_year=publication_year,
            shelf=shelf
        )
    return crud_book.list_books(db)


# ------------------------- GET UNIQUE CATEGORIES -------------------------

@router.get("/categories")
def get_book_categories(db: Session = Depends(get_db)):
    rows = db.query(crud_book.models.Book.category).distinct().all()
    return [r[0] for r in rows if r[0]]


# ------------------------- UPLOAD COVER / GENERATE THUMBNAIL -------------------------

MAX_IMAGE_SIZE_MB = 3
ALLOWED_EXT = {"jpg", "jpeg", "png"}

@router.post("/{book_id}/cover")
async def upload_cover(
    book_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(require_librarian),
):

    # Validate extension
    ext = file.filename.split(".")[-1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, detail="Only JPG and PNG images allowed")

    # Validate size
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_IMAGE_SIZE_MB:
        raise HTTPException(400, detail="Image must be under 3 MB")

    # Validate image content
    kind = imghdr.what(None, h=content)
    if kind not in ["jpeg", "png"]:
        raise HTTPException(400, detail="Invalid image file")

    # Reset pointer for saving
    await file.seek(0)

    # ------------------ Save Original Image ------------------
    covers_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "static", "covers")
    )
    os.makedirs(covers_dir, exist_ok=True)

    filename = f"{uuid4().hex}.{ext}"
    save_path = os.path.join(covers_dir, filename)

    with open(save_path, "wb") as f:
        f.write(content)

    cover_url = f"/static/covers/{filename}"

    # ------------------ Generate Thumbnail ------------------
    thumb_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "static", "thumbnails")
    )
    os.makedirs(thumb_dir, exist_ok=True)

    image = Image.open(BytesIO(content))
    image.thumbnail((300, 300))

    thumb_name = f"{uuid4().hex}.jpg"
    thumb_path = os.path.join(thumb_dir, thumb_name)
    image.save(thumb_path, "JPEG")

    thumb_url = f"/static/thumbnails/{thumb_name}"

    # Save cover_url or thumbnail in DB
    book = crud_book.get_book(db, book_id)
    if not book:
        return JSONResponse(status_code=404, content={"detail": "book not found"})

    book.cover_url = thumb_url
    db.commit()
    db.refresh(book)

    return {"cover_url": thumb_url}


# ------------------------- GET BOOK -------------------------

@router.get("/{book_id}", response_model=BookRead)
def get_book(book_id: int, db: Session = Depends(get_db)):
    b = crud_book.get_book(db, book_id)
    if not b:
        raise HTTPException(status_code=404, detail="book not found")
    return b


# ------------------------- UPDATE BOOK -------------------------

@router.put("/{book_id}", response_model=BookRead)
def update_book(book_id: int, patch: BookUpdate, db: Session = Depends(get_db), _=Depends(require_librarian)):
    book = crud_book.get_book(db, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="book not found")
    return crud_book.update_book(db, book, patch)


# ------------------------- DELETE BOOK -------------------------

@router.delete("/{isbn}")
def delete_book(isbn: str, db: Session = Depends(get_db), _=Depends(require_librarian)):
    ok = crud_book.delete_book(db, isbn)
    if not ok:
        raise HTTPException(status_code=404, detail="book not found")
    return {"detail": "deleted"}
