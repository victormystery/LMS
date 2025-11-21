# app/core/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Annotated

from backend.app.db.session import get_db
from backend.app.crud import user_crud
from backend.app.core.security import decode_access_token

# Use HTTPBearer → shows only "Bearer <token>" in Swagger UI
bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: Annotated[Session, Depends(get_db)]
):
    """
    Extract and validate JWT, return DB user.
    """
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e

    user = user_crud.get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Sync role from token (in case DB is outdated)
    user.role = role
    return user


# Role-based dependency
def require_librarian(
    current_user: Annotated[any, Depends(get_current_user)]
):
    """
    Only allow users with role == 'librarian'
    """
    if getattr(current_user, "role", None) != "librarian":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Librarian access required"
        )
    return current_user


# Optional: other roles
require_admin = lambda user=Depends(get_current_user): (
    user if user.role == "admin" else (_ for _ in ()).throw(
        HTTPException(status_code=403, detail="Admin access required")
    )
)