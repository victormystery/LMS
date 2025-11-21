# app/api/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.crud import user_crud
from backend.app.core.security import create_access_token, verify_password
from backend.app.schemas.user_schema import TokenUserResponse, UserLogin, UserCreate, UserResponse

router = APIRouter()

# Use HTTPBearer → NO username/password popup
bearer_scheme = HTTPBearer()


@router.post("/login", response_model=TokenUserResponse)
def login_for_access_token(
    payload: UserLogin,
    db: Session = Depends(get_db)
):
    user = user_crud.get_user_by_username(db, payload.username)

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        subject=user.username,
        role=user.role
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }





@router.post("/register", response_model=UserResponse)
def register_user(
    payload: UserCreate,
    db: Session = Depends(get_db)
):
    if user_crud.get_user_by_username(db, payload.username):
        raise HTTPException(status_code=409, detail="Username already taken")

    user = user_crud.create_user(
        db=db,
        username=payload.username,
        password=payload.password,
        full_name=payload.full_name,
        role=payload.role
    )
    return UserResponse.model_validate(user)