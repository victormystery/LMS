from sqlalchemy.orm import Session
from datetime import datetime
from backend.app.db import models
from backend.app.crud import borrow_crud


class PaymentService:
    """Service for handling late fee payments."""
    
    def __init__(self, db: Session):
        self.db = db
        self.initial_fee = 5  # £5 initial fee
        self.fee_per_hour = 1  # £1 per hour overdue
    
    def calculate_fee(self, borrow: models.Borrow) -> float:
        """Calculate late fee for a borrow record: £5 initial + £1 per hour."""
        if borrow.returned_at is None or borrow.due_date is None:
            return 0.0
        
        returned_at = borrow.returned_at if isinstance(borrow.returned_at, datetime) else borrow.returned_at
        due_date = borrow.due_date if isinstance(borrow.due_date, datetime) else borrow.due_date
        
        # Calculate hours overdue
        time_diff = returned_at - due_date
        hours_overdue = int(time_diff.total_seconds() / 3600)
        
        # Only charge if actually overdue
        if hours_overdue <= 0:
            return 0.0
        
        return self.initial_fee + (hours_overdue * self.fee_per_hour)
    
    def process_payment(self, borrow_id: int, user_id: int) -> models.Borrow:
        """Mark a late fee as paid."""
        borrow = borrow_crud.get_borrow(self.db, borrow_id)
        
        if not borrow:
            raise ValueError("Borrow record not found")
        
        if int(borrow.user_id) != user_id:  # type: ignore
            raise ValueError("You cannot pay for another user's fee")
        
        if str(borrow.payment_status) == "paid":
            raise ValueError("Fee already paid")
        
        if int(borrow.fee_applied) <= 0:  # type: ignore
            raise ValueError("No fee to pay")
        
        borrow.payment_status = "paid"  # type: ignore
        borrow.paid_at = datetime.utcnow()  # type: ignore
        
        self.db.add(borrow)
        self.db.commit()
        self.db.refresh(borrow)
        
        return borrow
    
    def calculate_current_fee(self, borrow: models.Borrow) -> float:
        """Calculate current late fee for an overdue book (even if not returned yet)."""
        if borrow.due_date is None:
            return 0.0
        
        due_date = borrow.due_date if isinstance(borrow.due_date, datetime) else borrow.due_date
        
        # Use returned_at if available, otherwise use current time
        current_time = borrow.returned_at if borrow.returned_at else datetime.utcnow()
        if not isinstance(current_time, datetime):
            current_time = datetime.utcnow()
        
        # Calculate hours overdue
        time_diff = current_time - due_date
        hours_overdue = int(time_diff.total_seconds() / 3600)
        
        # Charge if overdue by at least 1 hour
        if hours_overdue < 1:
            return 0.0
        
        return float(self.initial_fee + (hours_overdue * self.fee_per_hour))
    
    def get_unpaid_fees(self, user_id: int) -> list[models.Borrow]:
        """Get all unpaid fees for a user, including currently overdue unreturned books."""
        # Get books with unpaid fees that have been returned
        returned_unpaid = (
            self.db.query(models.Borrow)
            .filter(
                models.Borrow.user_id == user_id,
                models.Borrow.fee_applied > 0,  # type: ignore
                models.Borrow.payment_status == "unpaid",
                models.Borrow.returned_at.isnot(None)
            )
            .all()
        )
        
        # Get currently overdue books (not returned yet, past due date)
        now = datetime.utcnow()
        currently_overdue = (
            self.db.query(models.Borrow)
            .filter(
                models.Borrow.user_id == user_id,
                models.Borrow.returned_at.is_(None),
                models.Borrow.due_date < now  # type: ignore
            )
            .all()
        )
        
        # Calculate fees for currently overdue books - show ALL of them
        for borrow in currently_overdue:
            current_fee = self.calculate_current_fee(borrow)
            # Set fee_applied to show the current fee
            borrow.fee_applied = int(current_fee)  # type: ignore
        
        # Combine both lists - include all overdue books
        all_unpaid = returned_unpaid + currently_overdue
        return all_unpaid
    
    def get_paid_fees(self, user_id: int) -> list[models.Borrow]:
        """Get all paid fees for a user."""
        return (
            self.db.query(models.Borrow)
            .filter(
                models.Borrow.user_id == user_id,
                models.Borrow.fee_applied > 0,  # type: ignore
                models.Borrow.payment_status == "paid"
            )
            .order_by(models.Borrow.paid_at.desc())  # type: ignore
            .all()
        )
    
    def get_all_fees(self, user_id: int) -> list[models.Borrow]:
        """Get all fees (paid and unpaid) for a user."""
        return (
            self.db.query(models.Borrow)
            .filter(
                models.Borrow.user_id == user_id,
                models.Borrow.fee_applied > 0  # type: ignore
            )
            .order_by(models.Borrow.borrowed_at.desc())  # type: ignore
            .all()
        )
    
    def get_total_unpaid_amount(self, user_id: int) -> int:
        """Calculate total unpaid fees for a user."""
        unpaid_borrows = self.get_unpaid_fees(user_id)
        return sum(int(borrow.fee_applied) for borrow in unpaid_borrows)  # type: ignore
    
    def get_total_paid_amount(self, user_id: int) -> float:
        """Calculate total paid fees for a user from payment history."""
        paid_borrows = self.get_paid_fees(user_id)
        return sum(float(borrow.fee_applied) for borrow in paid_borrows)  # type: ignore
