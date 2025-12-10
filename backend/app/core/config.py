from pydantic import BaseModel, AnyHttpUrl
from typing import List
import os

class Settings(BaseModel):
    PROJECT_NAME: str = "Library Management System"
    # CORS origins for local dev, Docker, and EC2 deployment
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        # Local development
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        # Docker Compose
        "http://lms-frontend:3000",
        "http://localhost:80",
        "http://127.0.0.1:80",
        # EC2 instances
        "http://44.213.68.35:3000",
        "http://44.213.68.35:8000",
        "http://44.213.68.35:80",
        "http://44.213.68.35:443",
        "http://18.234.63.91:3000",
        "http://18.234.63.91:8000",
        "http://18.234.63.91:80",
        "http://18.234.63.91:443",
        # Production domain (if using custom domain)
        "https://yourdomain.com",
        "https://api.yourdomain.com",
    ]

    SQLALCHEMY_DATABASE_URI: str = os.getenv("DATABASE_URL", "sqlite:///./library.db")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # one week
    JWT_SECRET: str = os.getenv("JWT_SECRET", "CHANGE_ME_TO_SECURE_RANDOM")  # replace in prod
    JWT_ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"

settings = Settings()
