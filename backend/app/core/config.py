from pydantic import BaseModel, AnyHttpUrl
from typing import List

class Settings(BaseModel):
    PROJECT_NAME: str = "Library Management System"
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = ["http://localhost:3000"]

    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./library.db"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # one week
    JWT_SECRET: str = "CHANGE_ME_TO_SECURE_RANDOM"  # replace in prod
    JWT_ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"

settings = Settings()
