from fastapi import APIRouter
from pydantic import BaseModel

from backend.services.dream_service import analyze_dream


router = APIRouter(tags=["dream"])


class DreamRequest(BaseModel):
    dream: str


@router.post("/dream/analyze")
def analyze_dream_route(data: DreamRequest):
    return analyze_dream(data.dream)