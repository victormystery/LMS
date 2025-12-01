from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.app.api.depend import get_current_user
from backend.app.db.session import get_db
from backend.app.schemas.user_schema import UserResponse, UserCreate
from backend.app.crud import user_crud as crud_user

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def read_all_users(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    
    if current_user.role not in ["librarian", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view all users.",
        )

    users = crud_user.get_all_users(db)
    return [
        {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
        }
        for user in users
    ]


@router.get("/{user_id}", response_model=UserResponse)
def read_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
   
    user = crud_user.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role not in ["librarian", "admin"] and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this user.",
        )

    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
    }


@router.post("/", response_model=UserResponse)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
   
    if current_user.role not in ["librarian", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create users.",
        )

    user = crud_user.create_user(
        db,
        username=user_in.username,
        password=user_in.password,
        full_name=user_in.full_name,
        role=user_in.role,
    )
    return user
