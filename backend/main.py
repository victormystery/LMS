from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.background import BackgroundTasks
from fastapi.staticfiles import StaticFiles
import os

from backend.app.core.config import settings
from backend.app.db.session import engine, SessionLocal
from backend.app.db import base  # import to ensure models are registered
from backend.app.api.routes import auth as routes_auth
from backend.app.api.routes import user as routes_users
from backend.app.api.routes import books as routes_books
from backend.app.api.routes import borrow as routes_borrow
from backend.app.api.routes import reservations as routes_reservations
from backend.app.api.routes import notifications as routes_notifications
from backend.app.services.notification import NotificationManager

app = FastAPI(title=settings.PROJECT_NAME)

# CORS (dev friendly)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    # create tables for quick demo (use alembic in prod)
    base.Base.metadata.create_all(bind=engine)
    # start notification manager background worker
    NotificationManager.get_instance().start_worker()

@app.on_event("shutdown")
def on_shutdown():
    NotificationManager.get_instance().stop_worker()

# include routers
app.include_router(routes_auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(routes_users.router, prefix="/api/users", tags=["users"])
app.include_router(routes_books.router, prefix="/api/books", tags=["books"])
app.include_router(routes_borrow.router, prefix="/api/borrows", tags=["borrows"])
app.include_router(routes_reservations.router, prefix="/api/reservations", tags=["reservations"])
app.include_router(routes_notifications.router, prefix="/api/notifications", tags=["notifications"])

# serve static files (covers/uploads)
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/healthz")
def health():
    return {"status": "ok"}
