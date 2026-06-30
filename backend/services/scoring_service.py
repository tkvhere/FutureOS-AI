from __future__ import annotations

from datetime import datetime, timedelta
from typing import List


LEVELS = [
    (0, "Beginner"),
    (120, "Focused"),
    (260, "Elite"),
]

BADGES = {
    "Consistency Core": 3,
    "Sleep Architect": 7,
    "Deep Work Streak": 5,
    "Momentum Starter": 1,
}

GOAL_SCORE_WEIGHTS = {
    "focus": {
        "study": 10.0,
        "sleep": 5.0,
        "screen": 7.0,
        "exercise": 0.12,
    },
    "exam": {
        "study": 11.5,
        "sleep": 4.8,
        "screen": 7.8,
        "exercise": 0.1,
    },
    "ips": {
        "study": 11.5,
        "sleep": 4.8,
        "screen": 7.8,
        "exercise": 0.1,
    },
    "job": {
        "study": 10.6,
        "sleep": 4.9,
        "screen": 7.1,
        "exercise": 0.14,
    },
}


def _resolve_goal(goal: str | None) -> str:
    normalized = str(goal or "").strip().lower()
    if normalized in GOAL_SCORE_WEIGHTS:
        return normalized
    return "focus"


def calculate_daily_score(
    study_hours: float,
    sleep_hours: float,
    screen_time_hours: float,
    exercise_minutes: int = 0,
    goal: str | None = None,
) -> float:
    weights = GOAL_SCORE_WEIGHTS[_resolve_goal(goal)]
    return round(
        (study_hours * weights["study"])
        + (sleep_hours * weights["sleep"])
        - (screen_time_hours * weights["screen"])
        + (exercise_minutes * weights["exercise"]),
        2,
    )


def determine_level(total_score: float) -> str:
    selected = LEVELS[0][1]
    for threshold, label in LEVELS:
        if total_score >= threshold:
            selected = label
    return selected


def calculate_streak(entries: List[dict]) -> int:
    if not entries:
        return 0

    def parse_date(value):
        if isinstance(value, str):
            return datetime.fromisoformat(value).date()
        return value

    ordered = sorted(
        [item for item in entries if item.get("log_date")],
        key=lambda item: parse_date(item.get("log_date")),
        reverse=True,
    )
    if not ordered:
        return 0

    streak = 1
    previous_date = parse_date(ordered[0].get("log_date"))
    for entry in ordered[1:]:
        current_date = parse_date(entry.get("log_date"))
        if previous_date - current_date == timedelta(days=1):
            streak += 1
            previous_date = current_date
        else:
            break
    return streak


def award_badges(entries: List[dict]) -> List[str]:
    badges = []
    if len(entries) >= 1:
        badges.append("Momentum Starter")
    if len(entries) >= 3:
        badges.append("Consistency Core")
    if len(entries) >= 5:
        badges.append("Deep Work Streak")
    if any(entry.get("sleep_hours", 0) >= 7 for entry in entries):
        badges.append("Sleep Architect")
    return badges
