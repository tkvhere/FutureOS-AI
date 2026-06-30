from __future__ import annotations

from datetime import date, datetime, timezone
from typing import List
from uuid import uuid4

from fastapi import HTTPException, status

from backend.database.connection import database, to_iso
from backend.models.schemas import HabitCreate
from backend.services.goal_service import generate_goal_plan
from backend.services.scoring_service import award_badges, calculate_daily_score, calculate_streak, determine_level


def add_habit_log(user: dict, habit: HabitCreate) -> dict:
    habits = database.collection("habits")
    log_date = habit.log_date.isoformat() if habit.log_date else date.today().isoformat()
    goal = str(habit.goal or "focus").strip().lower()
    goal_plan = generate_goal_plan(goal, habit.study_hours, habit.sleep_hours, habit.screen_time_hours)
    score = calculate_daily_score(
        habit.study_hours,
        habit.sleep_hours,
        habit.screen_time_hours,
        habit.exercise_minutes,
        goal=goal,
    )

    payload = {
        "_id": str(uuid4()),
        "user_id": user["_id"],
        "study_hours": habit.study_hours,
        "sleep_hours": habit.sleep_hours,
        "screen_time_hours": habit.screen_time_hours,
        "exercise_minutes": habit.exercise_minutes,
        "goal": goal,
        "goal_plan": goal_plan,
        "mood": habit.mood,
        "log_date": log_date,
        "score": score,
        "created_at": to_iso(datetime.now(timezone.utc)),
    }
    habits.insert_one(payload)
    return payload


def get_user_history(user_id: str) -> dict:
    entries = list(database.collection("habits").find({"user_id": user_id}))
    entries.sort(key=lambda item: item.get("log_date", ""), reverse=True)

    if not entries:
        return {"entries": [], "summary": {"average_score": 0, "streak": 0, "level": "Beginner", "badges": []}}

    total_score = round(sum(entry.get("score", 0) for entry in entries), 2)
    average_score = round(total_score / len(entries), 2)
    streak = calculate_streak(entries)
    badges = award_badges(entries)
    level = determine_level(total_score)

    return {
        "entries": entries,
        "summary": {
            "average_score": average_score,
            "streak": streak,
            "level": level,
            "badges": badges,
            "total_score": total_score,
        },
    }


def get_latest_profile(user_id: str) -> dict:
    entries = list(database.collection("habits").find({"user_id": user_id}))
    entries.sort(key=lambda item: item.get("log_date", ""), reverse=True)
    latest = entries[0] if entries else None
    if not latest:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Add at least one habit log to simulate outcomes")
    return {
        "study_hours": latest.get("study_hours", 0),
        "sleep_hours": latest.get("sleep_hours", 0),
        "screen_time_hours": latest.get("screen_time_hours", 0),
        "exercise_minutes": latest.get("exercise_minutes", 0),
        "goal": latest.get("goal", "focus"),
        "goal_plan": latest.get("goal_plan", generate_goal_plan(latest.get("goal", "focus"), latest.get("study_hours", 0), latest.get("sleep_hours", 0), latest.get("screen_time_hours", 0))),
        "knowledge": 42 + latest.get("study_hours", 0) * 4,
        "productivity": 45 + latest.get("study_hours", 0) * 3 - latest.get("screen_time_hours", 0) * 2,
        "energy": 50 + latest.get("sleep_hours", 0) * 2,
        "discipline": 40 + latest.get("study_hours", 0) * 2,
        "stress": 35 + latest.get("screen_time_hours", 0) * 3 - latest.get("exercise_minutes", 0) * 0.2,
        "score": latest.get("score", 0),
    }
