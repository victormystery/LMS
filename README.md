# Library Management System

## Software Requirements Specification (SRS)

### 1. Introduction

This document specifies the requirements for the Library Management System (LMS), a web-based application for managing library resources, user accounts, book borrowing, reservations, and notifications.

#### 1.1 Purpose

The LMS enables librarians and users to efficiently manage books, borrowing, reservations, and receive real-time notifications about book availability.

#### 1.2 Scope

- User authentication and role management (student, librarian)
- Book catalog management (CRUD)
- Borrow and return books
- Reservation queue for unavailable books
- Real-time notifications (SSE/WebSocket)
- Responsive frontend UI (React)

### 2. Functional Requirements

#### 2.1 User Management

- Register, login, and logout
- Role-based access (student, librarian)
- Session management with JWT and cookies

#### 2.2 Book Management

- Add, edit, delete books (librarian only)
- View book catalog and details
- Search and filter books

#### 2.3 Borrowing and Returning

- Borrow available books
- Return borrowed books
- Track borrow history per user
- Calculate and apply overdue fee ($1 per day after due date)

#### 2.4 Reservations

- Reserve books when no copies are available
- View reservation queue (with usernames, pagination)
- Cancel reservation

#### 2.5 Notifications

- Real-time notifications when reserved books become available
- Notification inbox with unread count and mark-as-read
- Toast notifications for immediate alerts

#### 2.6 Security

- JWT-based authentication
- Secure cookie handling for SSE/WebSocket
- Role-based API access

### 3. Non-Functional Requirements

#### 3.1 Performance

- Real-time notification delivery (SSE/WebSocket)
- Efficient pagination for large queues

#### 3.2 Usability

- Responsive UI for desktop and mobile
- Accessible navigation and forms

#### 3.3 Reliability

- In-memory notification manager (demo)
- Extensible for persistent/DB-backed notifications

#### 3.4 Scalability

- Backend designed for extension to Redis/pub-sub for multi-instance deployments

#### 3.5 Maintainability

- Modular codebase (FastAPI backend, React frontend)
- Clear separation of concerns

### 4. System Architecture

- Backend: FastAPI, SQLAlchemy, JWT, SSE/WebSocket
- Frontend: React, TypeScript, Vite, Sonner (toast), Tailwind CSS
- Database: SQLite (demo), extensible to PostgreSQL/MySQL

### 5. External Interfaces

- RESTful API endpoints for all core operations
- SSE/WebSocket endpoints for notifications
- Responsive web UI

### 6. Constraints

- Demo uses in-memory notification manager; production should use persistent storage
- Cookie-based authentication for SSE/WebSocket may require HTTPS and proper CORS settings
- Overdue fee is $1 per day, calculated at return time and shown in borrow history

### 7. Future Enhancements

- WebSocket-based notifications for two-way communication
- Persistent notification storage (DB/Redis)
- Advanced search and filtering
- Admin dashboard and analytics

---

## Setup & Usage

1. **Backend**: FastAPI app (`backend/`)
   - Start: `python -m uvicorn backend.main:app --reload`
2. **Frontend**: React app (`LMS_Frontend/`)
   - Start: `npm run dev`
3. **Notifications**: Real-time via SSE (default) or WebSocket (optional)

---

## License

MIT
