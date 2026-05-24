from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from datetime import datetime, timezone

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    fields = relationship("Field", back_populates="owner")

class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, index=True)
    region = Column(String, nullable=False)
    crop = Column(String, nullable=False)
    soil = Column(String, nullable=False)
    area = Column(Float, nullable=False)
    irrigation = Column(String, nullable=False)
    recommendation = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="fields")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    user_email = Column(String, nullable=True)
    method = Column(String)
    path = Column(String)
    status_code = Column(Integer)
    ip = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))