from sqlalchemy.orm import Session
from backend.app.db import models
from backend.app.core.security import get_password_hash, verify_password

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, username: str, password: str, full_name: str = None, role: str = "student"):
    hashed = get_password_hash(password)
    user = models.User(username=username, full_name=full_name, hashed_password=hashed, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def get_all_users(db: Session):
    """Get all users from the database."""
    return db.query(models.User).all()

