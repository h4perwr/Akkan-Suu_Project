from typing import List
from datetime import datetime, timedelta
import requests
from backend.app import models
import jwt
from passlib.context import CryptContext

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from backend.app.database import engine, Base, get_db
from backend.app import schemas
from backend.app.config import settings


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Akkan-Suu API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить ваши данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/api/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Этот email уже зарегистрирован")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Неверный email или пароль")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/recommendation", response_model=schemas.RecommendationResponse)
def get_recommendation(
    payload: schemas.RecommendationRequest, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Словарь координат регионов Кыргызстана
    region_coords = {
        "Чуйский район": (42.87, 74.59),
        "Ошская область": (40.51, 72.81),
        "Иссык-Кульская область": (42.48, 77.39),
        "Таласская область": (42.52, 72.24),
        "Нарынская область": (41.43, 76.00),
        "Джалал-Абадская область": (40.93, 73.00),
        "Баткенская область": (40.06, 70.83)
    }
    
    lat, lon = region_coords.get(payload.region, (42.87, 74.59))

    # Запрос к Open-Meteo
    try:
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m"
        response = requests.get(weather_url, timeout=5)
        real_weather = response.json()
        
        current_temp = int(real_weather['current']['temperature_2m'])
        humidity = int(real_weather['current']['relative_humidity_2m'])
    except Exception:
        raise HTTPException(status_code=503, detail="Сервис погоды временно недоступен")
    
    if current_temp > 25 and humidity < 50:
        should_water = True
        reason = f"В регионе {payload.region} жарко (+{current_temp}°C) и сухо (влажность {humidity}%). Рекомендуется полив."
    else:
        should_water = False
        reason = f"В регионе {payload.region} условия оптимальны (+{current_temp}°C, влажность {humidity}%). Полив не требуется."

    return {
      "weather": {"temperature": current_temp, "condition": "Данные Open-Meteo", "humidity": humidity},
      "recommendation": {"should_water": should_water, "reason": reason}
    }

@app.get("/api/fields")
def get_user_fields(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    
    return db.query(models.Field).filter(models.Field.owner_id == current_user.id).all()

@app.get("/api/fields", response_model=List[schemas.FieldOut])
def get_user_fields(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Field).filter(models.Field.owner_id == current_user.id).all()

@app.post("/api/fields", response_model=schemas.FieldOut)
def create_field(field: schemas.FieldCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_field = models.Field(
        name=field.name, 
        region=field.region, 
        owner_id=current_user.id
    )
    db.add(new_field)
    db.commit()
    db.refresh(new_field)
    return new_field