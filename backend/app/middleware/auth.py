"""
Authentication and authorization middleware.

This module provides role-based access control decorators for protecting routes.
"""

from fastapi import Depends, HTTPException, status
from typing import Annotated, List
from backend.app.api.depend import get_current_user
from backend.app.db.models import User


def require_role(allowed_roles: List[str]):
    """
    Decorator factory for role-based access control.
    
    Args:
        allowed_roles: List of roles that are allowed to access the endpoint
        
    Returns:
        A dependency function that checks if the current user has the required role
        
    Example:
        @router.get("/admin-only")
        def admin_endpoint(user=Depends(require_role(["admin"]))):
            return {"message": "Admin access granted"}
    """
    def role_checker(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker


# Convenience functions for common role checks
def require_student(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Require student role or higher (student, faculty, librarian, admin)."""
    if current_user.role not in ["student", "faculty", "librarian", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required"
        )
    return current_user


def require_faculty(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Require faculty role or higher (faculty, librarian, admin)."""
    if current_user.role not in ["faculty", "librarian", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faculty access required"
        )
    return current_user


def require_librarian(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Require librarian role or higher (librarian, admin)."""
    if current_user.role not in ["librarian", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Librarian access required"
        )
    return current_user


def require_admin(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Require admin role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
