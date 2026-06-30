from fastapi import APIRouter, Depends, Header

from backend.services.auth_service import authenticate_bearer
from backend.services.habit_service import get_latest_profile, get_user_history
from backend.ml.simulator import compare_current_vs_ideal, simulate_future
from backend.ml.policy import recommend_actions, value_iteration
from backend.ml.lstm_forecasting import forecaster
from backend.ml.decision_tree_goal_predictor import goal_days_predictor

router = APIRouter(tags=["simulation"])


def _current_user(authorization: str = Header(default="")):
    token = authorization.replace("Bearer ", "")
    return authenticate_bearer(token)


@router.get("/simulate")
def simulate(user=Depends(_current_user)):
    history = get_user_history(user["_id"])
    profile = get_latest_profile(user["_id"])
    simulation = simulate_future(profile, history.get("entries", []))
    policy, values = value_iteration(
        {
            "knowledge": profile["knowledge"] / 10,
            "energy": profile["energy"] / 10,
            "discipline": profile["discipline"] / 10,
            "stress": profile["stress"] / 10,
        }
    )
    simulation["mdp"] = {"policy": policy, "values": values, "recommendation": recommend_actions(profile)}
    return simulation


@router.get("/forecast")
def forecast(user=Depends(_current_user)):
    history = get_user_history(user["_id"])
    entries = history.get("entries", [])
    profile = get_latest_profile(user["_id"])
    return {
        "method": "lstm" if forecaster.train(entries) else "trend",
        "forecast": forecaster.predict(entries, 30),
        "goal_days_prediction": goal_days_predictor.predict(profile),
        "goal_model_quality": goal_days_predictor.evaluate(),
        "history_points": len(entries),
    }


@router.get("/mdp/optimal")
def mdp_optimal(user=Depends(_current_user)):
    profile = get_latest_profile(user["_id"])
    policy, values = value_iteration(
        {
            "knowledge": profile["knowledge"] / 10,
            "energy": profile["energy"] / 10,
            "discipline": profile["discipline"] / 10,
            "stress": profile["stress"] / 10,
        }
    )
    return {
        "state": {
            "knowledge": round(profile["knowledge"], 2),
            "energy": round(profile["energy"], 2),
            "discipline": round(profile["discipline"], 2),
            "stress": round(profile["stress"], 2),
        },
        "policy": policy,
        "recommendation": recommend_actions(profile),
        "value_table": values,
    }


@router.get("/compare")
def compare(user=Depends(_current_user)):
    profile = get_latest_profile(user["_id"])
    return compare_current_vs_ideal(profile)
