from pydantic import BaseModel, AnyHttpUrl
from typing import List

class Settings(BaseModel):
    PROJECT_NAME: str = "Library Management System"
    # allow typical frontend dev hosts (Vite default 5173, CRA 3000)
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]

    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./library.db"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # one week
    JWT_SECRET: str = "CHANGE_ME_TO_SECURE_RANDOM"  # replace in prod
    JWT_ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"

settings = Settings()
