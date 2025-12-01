from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.api.depend import get_current_user
from backend.app.db.session import get_db
from backend.app.crud import reservation_crud
from backend.app.db import models
from backend.app.schemas.user_schema import UserResponse
from backend.app.schemas.reservation_schema import PagedReservations

router = APIRouter(tags=["reservations"])


@router.post("/", status_code=201)
def create_reservation(payload: dict, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Create a reservation for the authenticated user. Request body: {"book_id": <int>}"""
    book_id = payload.get("book_id")
    if not book_id:
        raise HTTPException(status_code=400, detail="book_id is required")
    # Check book exists and availability
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    # Only allow reservation when no copies available
    if getattr(book, "available_copies", 0) > 0:
        raise HTTPException(status_code=400, detail="Book is available — reservation not allowed")
    try:
        reservation = reservation_crud.create_reservation(db, current_user.id, book_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {
        "id": reservation.id,
        "user_id": reservation.user_id,
        "book_id": reservation.book_id,
        "created_at": reservation.created_at,
        "notified": getattr(reservation, "notified", 0),
    }


@router.get("/", response_model=PagedReservations)
def list_reservations(
    book_id: Optional[int] = Query(None, alias="book_id"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List pending reservations (notified == 0). Returns paged results and includes reserver username.

    Query params:
    - book_id: optional filter by book
    - page / page_size: pagination
    """
    from backend.app.db import models

    offset = (page - 1) * page_size

    # base query selecting reservation and user fields via join
    q = db.query(models.Reservation, models.User.username, models.User.full_name).join(models.User, models.User.id == models.Reservation.user_id)
    # only pending
    q = q.filter(models.Reservation.notified == 0)
    if book_id is not None:
        q = q.filter(models.Reservation.book_id == book_id)

    # total count for pagination
    total = q.count()

    # order oldest-first
    q = q.order_by(models.Reservation.created_at.asc())
    items = q.offset(offset).limit(page_size).all()

    # items is list of tuples (Reservation, username, full_name)
    results = []
    for r, username, full_name in items:
        results.append({
            "id": r.id,
            "user_id": r.user_id,
            "username": username,
            "full_name": full_name,
            "book_id": r.book_id,
            "created_at": r.created_at,
            "notified": getattr(r, "notified", 0),
        })

    return {"items": results, "page": page, "page_size": page_size, "total": total}


@router.get("/{reservation_id}")
def get_reservation(reservation_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    r = reservation_crud.get_reservation(db, reservation_id)
    if not r:
        raise HTTPException(status_code=404, detail="Reservation not found")
    if current_user.role not in ["librarian", "admin"] and current_user.id != r.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    return {
        "id": r.id,
        "user_id": r.user_id,
        "book_id": r.book_id,
        "created_at": r.created_at,
        "notified": getattr(r, "notified", 0),
    }


@router.delete("/{reservation_id}")
def cancel_reservation(reservation_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    r = reservation_crud.get_reservation(db, reservation_id)
    if not r:
        raise HTTPException(status_code=404, detail="Reservation not found")
    if current_user.role not in ["librarian", "admin"] and current_user.id != r.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    ok = reservation_crud.cancel_reservation(db, reservation_id)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to cancel reservation")
    return {"status": "cancelled"}
