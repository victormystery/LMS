import threading
import time
from datetime import datetime
from backend.app.db.session import SessionLocal
from backend.app.db import models
from backend.app.services.notification import NotificationManager


class OverdueChecker:
    """Background service to check for overdue books and send notifications"""
    
    _instance = None
    _running = False
    _thread = None
    _check_interval = 3600  # Check every hour (3600 seconds)
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = OverdueChecker()
        return cls._instance
    
    def start(self):
        """Start the background checker"""
        if self._running:
            return
        
        self._running = True
        self._thread = threading.Thread(target=self._check_loop, daemon=True)
        self._thread.start()
        print("[OverdueChecker] Started")
    
    def stop(self):
        """Stop the background checker"""
        self._running = False
        if self._thread:
            self._thread.join(timeout=2)
        print("[OverdueChecker] Stopped")
    
    def _check_loop(self):
        """Main loop to check for overdue books"""
        while self._running:
            try:
                self._check_and_notify()
            except Exception as e:
                print(f"[OverdueChecker] Error: {e}")
            
            # Sleep for the check interval
            time.sleep(self._check_interval)
    
    def _check_and_notify(self):
        """Check for overdue books and send notifications"""
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            notification_manager = NotificationManager.get_instance()
            
            # Get all overdue borrows (not returned and past due date)
            overdue_borrows = (
                db.query(models.Borrow, models.User, models.Book)
                .join(models.User, models.User.id == models.Borrow.user_id)
                .join(models.Book, models.Book.id == models.Borrow.book_id)
                .filter(
                    models.Borrow.returned_at.is_(None),
                    models.Borrow.due_date < now
                )
                .all()
            )
            
            print(f"[OverdueChecker] Found {len(overdue_borrows)} overdue books")
            
            for borrow, user, book in overdue_borrows:
                # Calculate current fine
                time_diff = now - borrow.due_date
                hours_overdue = int(time_diff.total_seconds() / 3600)
                if hours_overdue < 1 and time_diff.total_seconds() > 0:
                    hours_overdue = 1
                
                current_fee = 5 + (hours_overdue * 1)  # £5 initial + £1 per hour
                
                # Send notification to user
                notification_manager.push({
                    "type": "overdue",
                    "user_id": user.id,
                    "username": user.username,
                    "book_id": book.id,
                    "book_title": book.title,
                    "borrow_id": borrow.id,
                    "hours_overdue": hours_overdue,
                    "current_fee": current_fee,
                    "due_date": borrow.due_date.isoformat() if borrow.due_date else None,
                })
                
                # Send notification to all librarians
                librarians = db.query(models.User).filter(
                    models.User.role.in_(["librarian", "admin"])
                ).all()
                
                for librarian in librarians:
                    notification_manager.push({
                        "type": "overdue_librarian",
                        "user_id": librarian.id,
                        "borrower_username": user.username,
                        "borrower_full_name": user.full_name,
                        "borrower_role": user.role,
                        "book_id": book.id,
                        "book_title": book.title,
                        "borrow_id": borrow.id,
                        "hours_overdue": hours_overdue,
                        "current_fee": current_fee,
                        "due_date": borrow.due_date.isoformat() if borrow.due_date else None,
                    })
            
        finally:
            db.close()
    
    def check_now(self):
        """Manually trigger a check (useful for testing)"""
        self._check_and_notify()
