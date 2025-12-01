from sqlalchemy.orm import Session
from backend.app.db import models

def create_reservation(db: Session, user_id: int, book_id: int):
    reservation = models.Reservation(user_id=user_id, book_id=book_id)
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return reservation

def list_reservations_for_book(db: Session, book_id: int):
    return db.query(models.Reservation).filter(models.Reservation.book_id == book_id, models.Reservation.notified == 0).all()

def mark_reservation_notified(db: Session, reservation_id: int):
    res = db.query(models.Reservation).filter(models.Reservation.id == reservation_id).first()
    if res:
        res.notified = 1
        db.commit()
        db.refresh(res)
    return res

def get_reservation(db: Session, reservation_id: int):
    return db.query(models.Reservation).filter(models.Reservation.id == reservation_id).first()

def list_reservations_for_user(db: Session, user_id: int):
    return db.query(models.Reservation).filter(models.Reservation.user_id == user_id).all()

def get_reservation_by_user_and_book(db: Session, user_id: int, book_id: int, notified: int = 0):
    return db.query(models.Reservation).filter(models.Reservation.user_id == user_id, models.Reservation.book_id == book_id, models.Reservation.notified == notified).first()

def cancel_reservation(db: Session, reservation_id: int):
    res = db.query(models.Reservation).filter(models.Reservation.id == reservation_id).first()
    if res:
        db.delete(res)
        db.commit()
        return True
    return False
