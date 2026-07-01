from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/reality", tags=["Reality"])

class RealityRequest(BaseModel):
    education: str
    cgpa: float
    experience: str
    study_hours: int
    skills: str

@router.post("/analyze")
def analyze_reality(data: RealityRequest):
    skills = [s.strip() for s in data.skills.split(",")]

    readiness = min(
        100,
        int((data.cgpa * 8) + (data.study_hours * 6) + (len(skills) * 5))
    )

    probability = min(100, readiness + 10)

    return {
        "education": data.education,
        "readiness": readiness,
        "success_probability": probability,
        "strengths": skills,
        "weaknesses": [
            "Projects",
            "Communication",
            "Interview Preparation",
        ],
        "recommendation": "Keep improving your projects and consistency.",
    }
