from __future__ import annotations

import os
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from typing import Optional
from uuid import uuid4

from fastapi import HTTPException, status
from jose import jwt
from passlib.context import CryptContext

from backend.database.connection import database, to_iso
from backend.models.schemas import UserPublic
from backend.services.scoring_service import award_badges, calculate_streak, determine_level

SECRET_KEY = os.getenv("JWT_SECRET", "life-outcome-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))
VERIFICATION_CODE_EXPIRE_MINUTES = int(os.getenv("VERIFICATION_CODE_EXPIRE_MINUTES", "30"))
SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER or "").strip()
password_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return password_context.hash(password)


def normalize_gmail_email(email: str) -> str:
    normalized = email.strip().lower()
    if not normalized.endswith("@gmail.com"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only Gmail addresses are allowed")
    return normalized


def generate_verification_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return password_context.verify(password, hashed_password)
    except Exception:
        return password == hashed_password


def create_access_token(payload: dict) -> str:
    token_payload = payload.copy()
    token_payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(token_payload, SECRET_KEY, algorithm=ALGORITHM)


def get_user_by_email(email: str) -> Optional[dict]:
    return database.collection("users").find_one({"email": normalize_gmail_email(email)})


def build_public_user(user_doc: dict) -> UserPublic:
    habits = list(database.collection("habits").find({"user_id": user_doc["_id"]}))
    total_score = sum(item.get("score", 0) for item in habits)
    badges = award_badges(habits)
    level = determine_level(total_score)
    streak = max(user_doc.get("streak", 0), calculate_streak(habits))
    return UserPublic(
        id=str(user_doc["_id"]),
        name=user_doc["name"],
        email=user_doc["email"],
        level=level,
        streak=streak,
        badges=badges or user_doc.get("badges", []),
    )


def _verification_code_payload(code: str) -> dict:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=VERIFICATION_CODE_EXPIRE_MINUTES)
    return {
        "verification_code_hash": hash_password(code),
        "verification_expires_at": to_iso(expires_at),
        "verification_sent_at": to_iso(datetime.now(timezone.utc)),
    }


def _send_verification_email(name: str, email: str, code: str) -> bool:
    if not (SMTP_HOST and SMTP_USER and SMTP_PASSWORD):
        return False

    message = EmailMessage()
    message["Subject"] = "Verify your Future You Gmail"
    message["From"] = SMTP_FROM or SMTP_USER
    message["To"] = email
    message.set_content(
        f"Hello {name},\n\nYour verification code is: {code}\n\n"
        f"This code expires in {VERIFICATION_CODE_EXPIRE_MINUTES} minutes."
    )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.ehlo()
        smtp.login(SMTP_USER, SMTP_PASSWORD)
        smtp.send_message(message)
    return True


def issue_verification_code(user_doc: dict) -> tuple[str, bool]:
    code = generate_verification_code()
    payload = _verification_code_payload(code)
    database.collection("users").update_one({"_id": user_doc["_id"]}, {"$set": payload})
    delivered = _send_verification_email(user_doc["name"], user_doc["email"], code)
    return code, delivered


def signup_user(name: str, email: str, password: str) -> tuple[dict, str, bool]:
    email = normalize_gmail_email(email)
    users = database.collection("users")
    existing = users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user_doc = {
        "_id": str(uuid4()),
        "name": name,
        "email": email,
        "password_hash": hash_password(password),
        "is_verified": False,
        "streak": 0,
        "level": "Beginner",
        "badges": [],
        "created_at": to_iso(datetime.now(timezone.utc)),
        "verification_code_hash": None,
        "verification_expires_at": None,
        "verification_sent_at": None,
    }
    users.insert_one(user_doc)
    code, delivered = issue_verification_code(user_doc)
    return user_doc, code, delivered


def resend_verification_code(email: str) -> tuple[dict, str, bool]:
    email = normalize_gmail_email(email)
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.get("is_verified"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already verified")
    return user, *issue_verification_code(user)


def verify_email_code(email: str, code: str) -> dict:
    email = normalize_gmail_email(email)
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.get("is_verified"):
        return user

    expires_at = user.get("verification_expires_at")
    if expires_at:
        if isinstance(expires_at, datetime):
            expires_dt = expires_at
        else:
            try:
                expires_dt = datetime.fromisoformat(str(expires_at).replace("Z", "+00:00"))
            except ValueError:
                expires_dt = None
        if expires_dt and expires_dt.tzinfo is None:
            expires_dt = expires_dt.replace(tzinfo=timezone.utc)
        if expires_dt and expires_dt < datetime.now(timezone.utc):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code expired")

    stored_code_hash = user.get("verification_code_hash")
    if not stored_code_hash or not verify_password(code.strip(), stored_code_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")

    database.collection("users").update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "is_verified": True,
                "verification_code_hash": None,
                "verification_expires_at": None,
                "verification_sent_at": None,
            },
        },
    )
    verified_user = get_user_by_id(user["_id"])
    if not verified_user:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Verification failed")
    return verified_user


def login_user(email: str, password: str) -> dict:
    email = normalize_gmail_email(email)
    user = database.collection("users").find_one({"email": email})
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.get("is_verified"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified. Check your Gmail inbox for the code.")
    return user


def get_user_by_id(user_id: str) -> Optional[dict]:
    return database.collection("users").find_one({"_id": user_id})


def authenticate_bearer(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Missing subject")
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token") from exc

    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
