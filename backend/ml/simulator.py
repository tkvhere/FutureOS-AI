from __future__ import annotations

from typing import Dict

from backend.ml.forecasting import bundle_forecasts
from backend.ml.decision_tree_goal_predictor import goal_days_predictor
from backend.ml.lstm_forecasting import forecaster


GOAL_SIMULATION_CONFIG = {
    "focus": {
        "target_study": 4.5,
        "target_sleep": 7.8,
        "target_screen": 1.2,
        "target_exercise": 35,
        "knowledge_boost": 1.0,
        "discipline_boost": 1.0,
    },
    "exam": {
        "target_study": 5.8,
        "target_sleep": 7.4,
        "target_screen": 1.1,
        "target_exercise": 30,
        "knowledge_boost": 1.18,
        "discipline_boost": 1.12,
    },
    "ips": {
        "target_study": 5.8,
        "target_sleep": 7.4,
        "target_screen": 1.1,
        "target_exercise": 30,
        "knowledge_boost": 1.18,
        "discipline_boost": 1.12,
    },
    "job": {
        "target_study": 4.4,
        "target_sleep": 7.2,
        "target_screen": 1.5,
        "target_exercise": 32,
        "knowledge_boost": 1.08,
        "discipline_boost": 1.1,
    },
}


def _resolve_goal(goal: str | None) -> str:
    normalized = str(goal or "").strip().lower()
    return normalized if normalized in GOAL_SIMULATION_CONFIG else "focus"


def _simulate_horizon(start: dict, days: int, ideal: bool = False) -> dict:
    study = start["study_hours"]
    sleep = start["sleep_hours"]
    screen = start["screen_time_hours"]
    exercise = start["exercise_minutes"]
    goal = _resolve_goal(start.get("goal"))
    goal_config = GOAL_SIMULATION_CONFIG[goal]
    goal_plan = start.get("goal_plan") or {}
    target_plan_study = float(goal_plan.get("target_study_hours", goal_config["target_study"]))

    knowledge = start.get("knowledge", 40.0)
    productivity = start.get("productivity", 45.0)
    energy = start.get("energy", 50.0)
    discipline = start.get("discipline", 40.0)
    stress = start.get("stress", 35.0)

    knowledge_series = []
    productivity_series = []
    study_series = []
    sleep_series = []
    screen_series = []
    exercise_series = []

    for day in range(days):
        target_study = target_plan_study if ideal else study
        target_sleep = goal_config["target_sleep"] if ideal else sleep
        target_screen = goal_config["target_screen"] if ideal else screen
        target_exercise = goal_config["target_exercise"] if ideal else exercise

        knowledge += ((target_study * 1.6) + (target_exercise * 0.05) - (target_screen * 0.45)) * goal_config["knowledge_boost"]
        energy += (target_sleep * 1.05) + (target_exercise * 0.03) - (target_screen * 0.15)
        discipline += ((target_study * 0.42) + (target_exercise * 0.02) - (target_screen * 0.18)) * goal_config["discipline_boost"]
        stress += (target_screen * 0.28) - (target_sleep * 0.12) - (target_exercise * 0.08)
        productivity = (discipline * 1.05) + (energy * 0.9) - (stress * 0.35)

        knowledge = max(0, min(100, knowledge))
        productivity = max(0, min(100, productivity))
        energy = max(0, min(100, energy))
        discipline = max(0, min(100, discipline))
        stress = max(0, min(100, stress))

        knowledge_series.append(round(knowledge, 2))
        productivity_series.append(round(productivity, 2))
        study_series.append(round(target_study + (0.15 if ideal else 0), 2))
        sleep_series.append(round(target_sleep + (0.05 if ideal else 0), 2))
        screen_series.append(round(max(0, target_screen - (0.08 if ideal else 0)), 2))
        exercise_series.append(round(target_exercise + (2 if ideal else 0), 2))

    return {
        "goal": goal,
        "goal_plan": goal_plan,
        "knowledge": round(knowledge, 2),
        "productivity": round(productivity, 2),
        "energy": round(energy, 2),
        "discipline": round(discipline, 2),
        "stress": round(stress, 2),
        "series": {
            "knowledge": knowledge_series,
            "productivity": productivity_series,
            "study_hours": study_series,
            "sleep_hours": sleep_series,
            "screen_time_hours": screen_series,
            "exercise_minutes": exercise_series,
        },
    }


def simulate_future(current_profile: dict, habit_entries: list[dict] | None = None) -> Dict[str, dict]:
    horizons = {"30_days": 30, "90_days": 90, "6_months": 180}
    projections = {}
    scores = {}
    graph_points = {}
    habit_entries = habit_entries or []

    for label, days in horizons.items():
        outcome = _simulate_horizon(current_profile, days, ideal=False)
        projections[label] = {
            "knowledge_score": outcome["knowledge"],
            "productivity_score": outcome["productivity"],
            "energy": outcome["energy"],
            "discipline": outcome["discipline"],
            "stress": outcome["stress"],
        }
        scores[label] = {
            "knowledge": outcome["knowledge"],
            "productivity": outcome["productivity"],
        }
        graph_points[label] = outcome["series"]

    current_trend = bundle_forecasts(
        {
            "study_hours": [current_profile["study_hours"]],
            "sleep_hours": [current_profile["sleep_hours"]],
            "screen_time_hours": [current_profile["screen_time_hours"]],
            "exercise_minutes": [current_profile["exercise_minutes"]],
        },
        30,
    )

    lstm_forecast = forecaster.predict(habit_entries, 30)
    goal_days_prediction = goal_days_predictor.predict(current_profile)

    return {
        "current": current_profile,
        "projections": projections,
        "scores": scores,
        "graph_points": {**graph_points, "current_trend": current_trend, "lstm_forecast": lstm_forecast},
        "forecast_method": "lstm" if forecaster.trained else "trend",
        "goal_days_prediction": goal_days_prediction,
    }


def compare_current_vs_ideal(current_profile: dict) -> dict:
    current = _simulate_horizon(current_profile, 90, ideal=False)
    ideal = _simulate_horizon(current_profile, 90, ideal=True)

    def improvement(a: float, b: float) -> float:
        if a == 0:
            return 0.0
        return round(((b - a) / abs(a)) * 100, 2)

    return {
        "current_life": {
            "knowledge": current["knowledge"],
            "productivity": current["productivity"],
            "energy": current["energy"],
            "discipline": current["discipline"],
            "stress": current["stress"],
            "series": current["series"],
        },
        "ideal_life": {
            "knowledge": ideal["knowledge"],
            "productivity": ideal["productivity"],
            "energy": ideal["energy"],
            "discipline": ideal["discipline"],
            "stress": ideal["stress"],
            "series": ideal["series"],
        },
        "improvement_percent": {
            "knowledge": improvement(current["knowledge"], ideal["knowledge"]),
            "productivity": improvement(current["productivity"], ideal["productivity"]),
            "energy": improvement(current["energy"], ideal["energy"]),
            "discipline": improvement(current["discipline"], ideal["discipline"]),
            "stress_reduction": round(((current["stress"] - ideal["stress"]) / abs(current["stress"])) * 100, 2) if current["stress"] else 0.0,
        },
        "graph_points": {
            "current": current["series"],
            "ideal": ideal["series"],
        },
    }
