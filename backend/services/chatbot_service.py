from __future__ import annotations

import os
import re

import httpx
from fastapi import HTTPException

from backend.services.habit_service import get_user_history, get_latest_profile


def _extract_context(message: str) -> dict:
    match = re.search(r"\[goal=(?P<goal>[^;\]]+);\s*study=(?P<study>[^;\]]+);\s*sleep=(?P<sleep>[^;\]]+);\s*screen=(?P<screen>[^;\]]+);\s*exercise=(?P<exercise>[^\]]+)\]", message)
    if not match:
        return {}

    def _to_float(value: str, fallback: float = 0.0):
        try:
            return float(value)
        except Exception:
            return fallback

    return {
        "goal": match.group("goal").strip().lower(),
        "study": _to_float(match.group("study")),
        "sleep": _to_float(match.group("sleep")),
        "screen": _to_float(match.group("screen")),
        "exercise": _to_float(match.group("exercise")),
    }


def _burnout_risk(study: float, sleep: float, screen: float, exercise: float) -> int:
    risk = (screen * 14) + (study * 4.5) - (sleep * 8) - (exercise * 0.18)
    return max(0, min(100, round(risk)))


def _strip_context_envelope(message: str) -> str:
    if message.startswith("[") and "]" in message:
        return message.split("]", 1)[1].strip()
    return message


def _build_fallback_reply(history: dict, signals: dict, goal: str, message_lower: str) -> str:
    reply_parts = []
    burnout_risk = signals["burnout_risk"]

    if burnout_risk > 55:
        reply_parts.append("Burnout risk detected. Increase sleep, cut night screen time, and protect one recovery block today.")
    if signals["screen_time_hours"] > 3 or "screen" in message_lower:
        reply_parts.append("Screen time load is suppressing your deep focus bandwidth. Replace one scroll window with a 25-minute sprint.")
    if signals["study_hours"] < 3 or "study" in message_lower:
        reply_parts.append("Study intensity is below growth threshold. Stack one high-quality deep work block now.")
    if signals["sleep_hours"] < 7 or "sleep" in message_lower:
        reply_parts.append("Sleep debt is building. Restoring sleep will immediately improve focus and productivity stability.")
    if signals["exercise_minutes"] < 20 or "energy" in message_lower:
        reply_parts.append("Movement signal is weak. Add a short walk to reduce cognitive fatigue and stabilize mood.")

    if goal == "exam":
        reply_parts.append("Goal mode: Crack exam. Prioritize memory-heavy study blocks and protect sleep before revision sessions.")
    elif goal == "job":
        reply_parts.append("Goal mode: Get job. Allocate one focused block to portfolio/output work and one block to interview drills.")
    elif goal == "focus":
        reply_parts.append("Goal mode: Improve focus. Reduce context switching and run two distraction-free sessions today.")

    if not reply_parts:
        reply_parts.append("Trajectory is stable. Keep your streak and improve one lever by 5% to compound gains this week.")

    if history["summary"]["level"] == "Elite":
        reply_parts.append("Elite protocol: protect the system, not just output. Recovery discipline is performance discipline.")

    return " ".join(reply_parts)


def _generate_openai_reply(user_message: str, signals: dict, history: dict) -> str | None:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"
    timeout = float(os.getenv("OPENAI_TIMEOUT_SECONDS", "20"))

    system_prompt = (
        "You are Life Outcome AI Coach, powered by ChatGPT. "
        "Answer the user's question directly, clearly, and practically. "
        "Use the provided behavior signals as context, but still answer any user question helpfully. "
        "When relevant, include specific actionable steps. Keep the tone supportive and concise."
    )

    context_prompt = (
        f"User signals: {signals}. "
        f"History summary: {history.get('summary', {})}. "
        f"User question: {user_message}"
    )

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": context_prompt},
        ],
        "temperature": 0.4,
        "max_tokens": 420,
    }

    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
        response.raise_for_status()
        data = response.json()
        return data.get("choices", [{}])[0].get("message", {}).get("content", "").strip() or None
    except Exception:
        return None


def generate_coach_reply(user: dict, message: str) -> dict:
    history = get_user_history(user["_id"])
    try:
        latest = get_latest_profile(user["_id"])
    except HTTPException:
        latest = {
            "study_hours": 3.0,
            "sleep_hours": 7.0,
            "screen_time_hours": 3.0,
            "exercise_minutes": 20,
            "knowledge": 50,
            "productivity": 50,
            "energy": 50,
            "discipline": 50,
            "stress": 40,
            "score": 0,
        }
    context = _extract_context(message)
    clean_message = _strip_context_envelope(message)

    study_hours = context.get("study", latest["study_hours"])
    sleep_hours = context.get("sleep", latest["sleep_hours"])
    screen_time_hours = context.get("screen", latest["screen_time_hours"])
    exercise_minutes = context.get("exercise", latest["exercise_minutes"])
    goal = context.get("goal", "focus")

    message_lower = clean_message.lower()
    burnout_risk = _burnout_risk(study_hours, sleep_hours, screen_time_hours, exercise_minutes)

    signals = {
        "study_hours": study_hours,
        "sleep_hours": sleep_hours,
        "screen_time_hours": screen_time_hours,
        "exercise_minutes": exercise_minutes,
        "streak": history["summary"]["streak"],
        "level": history["summary"]["level"],
        "burnout_risk": burnout_risk,
        "goal_mode": goal,
    }

    reply = _generate_openai_reply(clean_message, signals, history)
    if not reply:
        reply = _build_fallback_reply(history, signals, goal, message_lower)

    return {"reply": reply, "signals": signals}
