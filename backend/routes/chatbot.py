from fastapi import APIRouter, Depends, Header

from backend.models.schemas import ChatRequest
from backend.services.auth_service import authenticate_bearer
from backend.services.chatbot_service import generate_coach_reply

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


def _current_user(authorization: str = Header(default="")):
    token = authorization.replace("Bearer ", "")
    return authenticate_bearer(token)


@router.post("")
def chat(payload: ChatRequest, user=Depends(_current_user)):
    return generate_coach_reply(user, payload.message)
