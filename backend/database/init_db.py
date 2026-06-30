import json
from datetime import datetime, timezone
from pathlib import Path

from .connection import database, to_iso


BASE_DIR = Path(__file__).resolve().parent
SAMPLE_DATA_PATH = BASE_DIR / "sample_data.json"


def initialize_database():
    users = database.collection("users")
    habits = database.collection("habits")

    if getattr(users, "count_documents", None) and users.count_documents({}) > 0:
        return

    if not SAMPLE_DATA_PATH.exists():
        return

    with SAMPLE_DATA_PATH.open("r", encoding="utf-8") as file_handle:
        payload = json.load(file_handle)

    for user in payload.get("users", []):
        users.insert_one(
            {
                "name": user["name"],
                "email": user["email"],
                "password_hash": user["password"],
                "is_verified": True,
                "streak": 3,
                "level": "Focused",
                "badges": ["Momentum Starter"],
                "created_at": to_iso(datetime.now(timezone.utc)),
                "verification_code_hash": None,
                "verification_expires_at": None,
                "verification_sent_at": None,
            }
        )

    for habit_group in payload.get("habits", []):
        user = users.find_one({"email": habit_group["email"]})
        if not user:
            continue
        for entry in habit_group.get("entries", []):
            habits.insert_one(
                {
                    "user_id": user["_id"],
                    "study_hours": entry["study_hours"],
                    "sleep_hours": entry["sleep_hours"],
                    "screen_time_hours": entry["screen_time_hours"],
                    "exercise_minutes": entry["exercise_minutes"],
                    "mood": entry.get("mood", "steady"),
                    "log_date": entry["log_date"],
                    "score": round(entry["study_hours"] * 10 + entry["sleep_hours"] * 5 - entry["screen_time_hours"] * 7 + entry["exercise_minutes"] * 0.12, 2),
                    "created_at": to_iso(datetime.now(timezone.utc)),
                }
            )
