from fastapi import APIRouter, Depends, Header

from backend.models.schemas import HabitCreate
from backend.services.auth_service import authenticate_bearer, build_public_user
from backend.services.habit_service import add_habit_log, get_latest_profile, get_user_history
from backend.services.scoring_service import calculate_streak, determine_level, award_badges

router = APIRouter(prefix="/habits", tags=["habits"])


def _current_user(authorization: str = Header(default="")):
    token = authorization.replace("Bearer ", "")
    return authenticate_bearer(token)


@router.post("/add")
def add_habit(payload: HabitCreate, user=Depends(_current_user)):
    entry = add_habit_log(user, payload)
    history = get_user_history(user["_id"])
    return {"entry": entry, "summary": history["summary"], "user": build_public_user(user)}


@router.get("/history")
def history(user=Depends(_current_user)):
    return get_user_history(user["_id"])
