from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    GEMINI_API_KEY: str  

    class Config:
        env_file = ".env"

settings = Settings()