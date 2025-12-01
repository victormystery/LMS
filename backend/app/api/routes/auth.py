# app/api/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.crud import user_crud
from backend.app.core.security import create_access_token, verify_password
from backend.app.core.security import decode_access_token
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



@router.post("/set-cookie")
def set_cookie_endpoint(payload: dict, response: Response):
    """Set the access token as a cookie for EventSource usage.

    This endpoint is intended for demo/dev only. The client should POST {"token": "..."}
    with credentials included so the browser stores the cookie for the backend origin.
    """
    token = payload.get("token") if isinstance(payload, dict) else None
    if not token:
        raise HTTPException(status_code=400, detail="Missing token")
    try:
        # validate token
        payload = decode_access_token(token)
        if not payload.get("sub"):
            raise Exception("invalid")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    # set a cookie for SSE authentication. Use HttpOnly for better security.
    # Note: cross-site cookie delivery may require SameSite=None and Secure=True in production.
    response.set_cookie(key="access_token", value=token, path='/', httponly=True, samesite="lax")
    return {"ok": True}





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
    return UserResponse.from_orm(user)
    