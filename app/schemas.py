from pydantic import BaseModel
from datetime import datetime


class RecommendationRequest(BaseModel):
    region: str


class WeatherDetail(BaseModel):
    temperature: int
    condition: str
    humidity: int

class AIRecommendation(BaseModel):
    should_water: bool
    reason: str

class RecommendationResponse(BaseModel):
    weather: WeatherDetail
    recommendation: AIRecommendation

    class Config:
        from_attributes = True

class HistoryLogOut(BaseModel):
    id: int
    region: str
    temperature: int
    humidity: int
    condition: str
    should_water: bool
    recommendation_text: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str

class FieldCreate(BaseModel):
    name: str
    region: str

class FieldOut(BaseModel):
    id: int
    name: str
    region: str
    owner_id: int

    class Config:
        from_attributes = True