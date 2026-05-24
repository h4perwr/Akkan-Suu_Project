from nt import environ
from typing import List
from datetime import datetime, timedelta
import requests
import jwt
import json
from passlib.context import CryptContext
from google import genai
from google.genai import types

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
from app import models, schemas
from app.config import settings

from groq import Groq

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Akkan-Suu API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        environ.get('FRONTEND_URL'),
    ],
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

@app.post("/api/recommendation")
def get_recommendation(
    payload: schemas.RecommendationRequest, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    region_coords = {
        "Чуйская область": (42.87, 74.59),
        "Ошская область": (40.51, 72.81),
        "Иссык-Кульская область": (42.48, 77.39),
        "Таласская область": (42.52, 72.24),
        "Нарынская область": (41.43, 76.00),
        "Джалал-Абадская область": (40.93, 73.00),
        "Баткенская область": (40.06, 70.83)
    }
    
    lat, lon = region_coords.get(payload.region, (42.87, 74.59))

    try:
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,precipitation"
        response = requests.get(weather_url, timeout=5)
        real_weather = response.json()
        current_temp = int(real_weather['current']['temperature_2m'])
        humidity = int(real_weather['current']['relative_humidity_2m'])
        rain_mm = real_weather['current'].get('precipitation', 0.0)
        rain_probability = 100 if rain_mm > 0 else 0
    except Exception:
        raise HTTPException(status_code=503, detail="Сервис погоды недоступен")
    
    weather_json_to_ai = {
        "temperature": current_temp,
        "humidity": humidity,
        "rain_probability": rain_probability,
        "rain_mm": rain_mm
    }

    SYSTEM_PROMPT = """
    You are an expert agronomist AI advisor for farmers.
    Analyze weather data and return ONLY a JSON object:
    {
      "recommendation": "REDUCE | NORMAL | INCREASE | SKIP",
      "urgency": "LOW | MEDIUM | HIGH",
      "water_amount_liters_per_m2": 10,
      "reason": "1-2 предложения НА РУССКОМ ЯЗЫКЕ",
      "forecast_summary": "краткая сводка погоды НА РУССКОМ ЯЗЫКЕ",
      "tips": ["совет 1 на русском", "совет 2 на русском"]
    }
    Rules:
    - rain_probability > 70% AND rain_mm > 5 → SKIP, LOW
    - rain_probability 40-70% → REDUCE, MEDIUM
    - temperature > 35 AND humidity < 30 → INCREASE, HIGH
    - temperature 20-35 AND humidity 30-60 → NORMAL, MEDIUM
    - humidity > 70 → REDUCE, LOW
    """

    try:

        client = Groq(api_key=settings.GROQ_API_KEY)
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(weather_json_to_ai)}
            ]
        )
        
        text = response.choices[0].message.content.strip()
        if text.startswith("```"):
            text = text.replace("```json", "").replace("```", "").strip()
            
        ai_data = json.loads(text)
        ai_reason = ai_data.get("reason", "Рекомендация успешно сформирована.")
        
    except Exception as e:
        print(f"\n🚨 ОШИБКА GROQ: {str(e)}\n")
        ai_data = {
            "recommendation": "NORMAL", "urgency": "MEDIUM", "water_amount_liters_per_m2": 5,
            "reason": "ИИ временно недоступен. Расчет по базовым параметрам.",
            "forecast_summary": "Стабильные показатели.", "tips": ["Проверьте влажность почвы вручную."]
        }
        ai_reason = ai_data["reason"]


    new_field = models.Field(
        region=payload.region, crop=payload.crop, soil=payload.soil,
        area=payload.area, irrigation=payload.irrigation,
        recommendation=ai_reason, owner_id=current_user.id
    )
    db.add(new_field)
    db.commit()
    db.refresh(new_field)
        
    return {
        "region": payload.region,
        "weather": {"temperature": current_temp, "humidity": humidity, "rain_mm": rain_mm, "source": "Open-Meteo"},
        "ai_analysis": ai_data
    }


@app.post("/api/ai/chat")
def ai_chat(
    payload: schemas.ChatRequest, 
    current_user: models.User = Depends(get_current_user)
):
    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        
        CHAT_PROMPT = """
        Ты — опытный ИИ-агроном из Кыргызстана. 
        Твоя задача: помогать фермерам, отвечая на вопросы о поливе, урожае, погоде и удобрениях.
        Пиши простым, понятным языком, без сложной терминологии. Отвечай кратко и только по делу.
        ВАЖНО: ВСЕГДА отвечай на русском языке (или на том языке, на котором к тебе обратился пользователь).
        """
        

        messages = [{"role": "system", "content": CHAT_PROMPT}]
        if payload.history:
            for msg in payload.history:
                messages.append({"role": msg.role, "content": msg.content})
                
        messages.append({"role": "user", "content": payload.message})
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages
        )
        
        reply_text = response.choices[0].message.content.strip()
        return {"reply": reply_text}
        
    except Exception as e:
        print(f"\n🚨 ОШИБКА GROQ CHAT: {str(e)}\n")
        raise HTTPException(status_code=500, detail="Ошибка ИИ чата")

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