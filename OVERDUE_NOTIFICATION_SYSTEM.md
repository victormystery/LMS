# Overdue Notification System

## Overview
The Library Management System now includes an automated overdue notification system that:
- Checks for overdue books every hour
- Calculates real-time fines: **£5 initial + £1 per hour**
- Notifies both borrowers and librarians
- Displays current fines in real-time

## Backend Implementation

### 1. OverdueChecker Service (`backend/app/services/overdue_checker.py`)
- **Singleton pattern** - Single instance runs in background
- **Automatic startup** - Starts when the FastAPI app starts
- **Hourly checks** - Runs every 3600 seconds (1 hour)
- **Functionality**:
  - Queries all overdue borrows (not returned, due_date < now)
  - Calculates hours overdue and current fee for each book
  - Sends "overdue" notifications to borrowers
  - Sends "overdue_librarian" notifications to all librarians
  - Includes: book_title, hours_overdue, current_fee in notifications

### 2. Updated /overdue Endpoint (`backend/app/api/routes/borrow.py`)
Returns enhanced data for each overdue book:
```json
{
  "id": 1,
  "user_id": 123,
  "username": "john_doe",
  "full_name": "John Doe",
  "role": "student",
  "book_id": 456,
  "book_title": "Introduction to Python",
  "borrowed_at": "2025-01-01T10:00:00",
  "due_date": "2025-01-08T10:00:00",
  "hours_overdue": 48,
  "current_fee": 53.0,
  "fee_applied": 0,
  "payment_status": "unpaid"
}
```

### 3. NotificationManager Updates (`backend/app/services/notification.py`)
- Handles "overdue" notifications for borrowers
- Handles "overdue_librarian" notifications for library staff
- Displays formatted console messages with fine information

### 4. App Lifecycle Integration (`backend/main.py`)
- `on_startup`: Starts OverdueChecker background service
- `on_shutdown`: Stops OverdueChecker gracefully

## Frontend Implementation

### 1. NotificationsBell Component
- Shows overdue notifications with **red warning indicator** (⚠)
- Displays hours overdue and current fine
- Special formatting for overdue_librarian notifications
- Red left border for overdue items

### 2. LibrarianDashboard - OverdueTable
Enhanced table showing:
- **Book title** (instead of just ID)
- **Borrower** (full name + username)
- **Role badge** (student/faculty)
- **Due date**
- **Hours overdue** (in red)
- **Current fine** (real-time, in red)
- **Payment status** badge

### 3. UserDashboard (My Books)
- **Alert banner** at top showing total overdue books and current total fines
- Each overdue book card shows:
  - Red destructive border
  - "Overdue — Xh" badge
  - **Current Fine: £X.XX** (updates in real-time)
- Fee calculation uses same formula: £5 + £1 per hour

## Fee Calculation

### Formula
```
current_fee = 5 + (hours_overdue * 1)
```

### Example
- Book due: 2025-01-01 10:00:00
- Current time: 2025-01-03 14:00:00
- Hours overdue: 52 hours
- **Current fine: £5 + (52 × £1) = £57**

### Where It's Calculated
1. **Backend**:
   - `overdue_checker.py` - For notifications
   - `/overdue` endpoint - For librarian view
   - `borrow_books.py` - When book is returned

2. **Frontend**:
   - `UserDashboard.tsx` - Real-time display for users
   - `OverdueTable.tsx` - Uses backend-calculated fees

## Notification Flow

### Every Hour (Automated):
1. OverdueChecker wakes up
2. Queries all overdue borrows
3. For each overdue book:
   - Calculates hours_overdue and current_fee
   - Sends notification to borrower: `{type: "overdue", user_id, book_title, hours_overdue, current_fee}`
   - Sends notification to ALL librarians: `{type: "overdue_librarian", borrower info, book_title, hours_overdue, current_fee}`

### On User Login:
- Fetches all unread notifications
- Overdue notifications appear in NotificationsBell with red warning

### Real-time Updates:
- Users see live fee accumulation in UserDashboard
- Librarians see live fees in OverdueTable
- Both update without page refresh

## Testing the System

### Start Backend:
```bash
cd c:\Users\HP\Videos\Library-management-system
.\start_backend.bat
```

### Start Frontend:
```bash
cd LMS_Frontend
npm run dev
```

### Create Test Overdue Book:
1. Borrow a book as a student/faculty
2. Manually update the database to set `due_date` to past date
3. Wait up to 1 hour for next check (or restart backend to trigger immediately)
4. Check notifications bell and UserDashboard

### Monitor Notifications:
- Check console output for: `[Notification] OVERDUE -> ...`
- Check browser notifications bell
- Check UserDashboard for red alert banner

## Key Features

✅ **Automated hourly checks** - No manual intervention needed
✅ **Real-time fee calculation** - Always shows current amount owed
✅ **Dual notifications** - Both users and librarians are informed
✅ **Visual warnings** - Red borders, badges, and alerts
✅ **Comprehensive data** - Shows borrower info, hours overdue, current fine
✅ **Scalable** - Handles multiple overdue books efficiently
✅ **Graceful shutdown** - Properly stops background thread

## Files Modified

### Backend:
- `backend/main.py` - Added OverdueChecker startup/shutdown
- `backend/app/services/overdue_checker.py` - NEW FILE
- `backend/app/services/notification.py` - Updated worker to handle overdue notifications
- `backend/app/api/routes/borrow.py` - Enhanced /overdue endpoint

### Frontend:
- `LMS_Frontend/src/components/NotificationsBell.tsx` - Overdue notification formatting
- `LMS_Frontend/src/components/librarian/OverdueTable.tsx` - Real-time fee display
- `LMS_Frontend/src/pages/UserDashboard.tsx` - Real-time fee calculation and display

## Notes

- The system runs continuously in the background
- Notifications accumulate until marked as read
- Fines are calculated in real-time but only applied when book is returned
- Librarians receive ALL overdue notifications, not just for their borrows
- Users only see notifications for their own overdue books
