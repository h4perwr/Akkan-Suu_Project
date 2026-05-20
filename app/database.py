from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings

# Создаем движок подключения
engine = create_engine(settings.DATABASE_URL)

# Создаем фабрику сессий. Каждая сессия — это отдельная транзакция
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс, от которого будут исследоваться все наши таблицы
Base = declarative_base()

# Специальная функция-зависимость (Dependency Injection) для FastAPI.
# Она открывает сессию базы данных для каждого запроса и закрывает её после ответа.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        