from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore') # allow other env vars

    SQLITE_URL: str

    CORS_ORIGINS: List[str] = ["http://localhost:5173", 
                               "http://localhost:8080", 
                               "http://172.27.85.126:5173", 
                               "https://localhost:5173"]
    CLIENT_ID: str
    CLIENT_SECRET: str
    # JWT settings for server-issued session tokens
    JWT_SECRET: str
    JWT_ALGORITHM: str
    JWT_EXPIRES_MINUTES: int
    @property
    def SQLITE_DATABASE_URL(self) -> str:
        return f"sqlite:///{self.SQLITE_URL}"

settings = Settings()