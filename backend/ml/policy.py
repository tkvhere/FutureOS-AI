from __future__ import annotations

from typing import Dict, List, Tuple

ACTIONS = ["study", "sleep", "scroll", "exercise"]

REWARD_MAP = {
    "study": 10,
    "sleep": 5,
    "scroll": -7,
    "exercise": 6,
}


def _transition(state: dict, action: str) -> dict:
    knowledge = state["knowledge"]
    energy = state["energy"]
    discipline = state["discipline"]
    stress = state["stress"]

    if action == "study":
        knowledge += 0.12 * (1 + discipline)
        energy -= 0.07
        stress += 0.03
        discipline += 0.04
    elif action == "sleep":
        energy += 0.15
        stress -= 0.08
        discipline += 0.02
    elif action == "scroll":
        energy -= 0.1
        stress += 0.1
        discipline -= 0.06
    elif action == "exercise":
        energy += 0.08
        stress -= 0.06
        discipline += 0.05

    return {
        "knowledge": round(max(0, min(10, knowledge)), 2),
        "energy": round(max(0, min(10, energy)), 2),
        "discipline": round(max(0, min(10, discipline)), 2),
        "stress": round(max(0, min(10, stress)), 2),
    }


def _state_value(state: dict) -> float:
    return (state["knowledge"] * 2.5) + (state["energy"] * 1.5) + (state["discipline"] * 2) - (state["stress"] * 1.8)


def value_iteration(initial_state: dict, iterations: int = 10) -> Tuple[dict, Dict[str, float]]:
    policy = {}
    value_table = {action: 0.0 for action in ACTIONS}
    state = initial_state.copy()

    for _ in range(iterations):
        action_scores = {}
        for action in ACTIONS:
            next_state = _transition(state, action)
            action_scores[action] = REWARD_MAP[action] + 0.86 * _state_value(next_state)
            value_table[action] = round(action_scores[action], 2)
        best_action = max(action_scores, key=action_scores.get)
        policy = {
            "best_action": best_action,
            "top_actions": sorted(action_scores.items(), key=lambda item: item[1], reverse=True),
            "next_state": _transition(state, best_action),
        }
        state = policy["next_state"]

    return policy, value_table


def recommend_actions(profile: dict) -> List[str]:
    recommendations = []
    if profile.get("screen_time_hours", 0) > 3:
        recommendations.append("Cut screen time by 30 minutes and replace it with one deep-work block.")
    if profile.get("study_hours", 0) < 3:
        recommendations.append("Increase study by at least 45 minutes today.")
    if profile.get("sleep_hours", 0) < 7:
        recommendations.append("Prioritize sleep tonight to protect tomorrow's focus.")
    if profile.get("exercise_minutes", 0) < 20:
        recommendations.append("Add a short workout or walk to stabilize energy.")
    if not recommendations:
        recommendations.append("Your balance looks solid. Keep the pattern and compound the streak.")
    return recommendations
