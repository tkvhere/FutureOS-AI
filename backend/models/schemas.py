from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def gmail_only(cls, value: EmailStr):
        normalized = str(value).strip().lower()
        if not normalized.endswith("@gmail.com"):
            raise ValueError("Only Gmail addresses are allowed")
        return normalized


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def gmail_only(cls, value: EmailStr):
        normalized = str(value).strip().lower()
        if not normalized.endswith("@gmail.com"):
            raise ValueError("Only Gmail addresses are allowed")
        return normalized


class VerificationRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=12)

    @field_validator("email", mode="before")
    @classmethod
    def gmail_only(cls, value: EmailStr):
        normalized = str(value).strip().lower()
        if not normalized.endswith("@gmail.com"):
            raise ValueError("Only Gmail addresses are allowed")
        return normalized


class ResendVerificationRequest(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def gmail_only(cls, value: EmailStr):
        normalized = str(value).strip().lower()
        if not normalized.endswith("@gmail.com"):
            raise ValueError("Only Gmail addresses are allowed")
        return normalized


class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr
    level: str
    streak: int
    badges: List[str] = []


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class SignupResponse(BaseModel):
    verification_required: bool = True
    email: EmailStr
    message: str
    dev_verification_code: Optional[str] = None


class HabitCreate(BaseModel):
    study_hours: float = Field(ge=0, le=24)
    sleep_hours: float = Field(ge=0, le=24)
    screen_time_hours: float = Field(ge=0, le=24)
    exercise_minutes: int = Field(ge=0, le=600)
    goal: Optional[str] = "focus"
    mood: Optional[str] = "steady"
    log_date: Optional[date] = None


class HabitResponse(HabitCreate):
    id: str
    user_id: str
    score: float
    created_at: datetime


class HabitHistoryResponse(BaseModel):
    entries: List[HabitResponse]
    summary: dict


class SimulationResponse(BaseModel):
    current: dict
    projections: dict
    scores: dict
    graph_points: dict


class ComparisonResponse(BaseModel):
    current_life: dict
    ideal_life: dict
    improvement_percent: dict
    graph_points: dict


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)


class ChatResponse(BaseModel):
    reply: str
    signals: dict


class OptimalDecisionResponse(BaseModel):
    state: dict
    policy: dict
    recommendation: list
    value_table: dict


class DailyScoreResponse(BaseModel):
    score: float
    streak: int
    level: str
    badges: List[str]
