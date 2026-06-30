from typing import Dict

from backend.knowledge.career_knowledge import CAREER_KNOWLEDGE
from backend.services.embedding_service import create_embedding
from backend.services.career_embedding_store import career_embeddings
from backend.services.similarity_service import find_best_match


def analyze_dream(dream: str) -> Dict:
    dream_lower = dream.lower()

    # ---------- Fast Keyword/Alias Match ----------
    for career, details in CAREER_KNOWLEDGE.items():

        if career in dream_lower:
            return {
                "goal": dream,
                "category": details["category"],
                "difficulty": details["difficulty"],
                "estimated_duration": details["estimated_duration"],
                "required_skills": details["required_skills"],
                "confidence": 0.95,
            }

        for alias in details.get("aliases", []):
            if alias in dream_lower:
                return {
                    "goal": dream,
                    "category": details["category"],
                    "difficulty": details["difficulty"],
                    "estimated_duration": details["estimated_duration"],
                    "required_skills": details["required_skills"],
                    "confidence": 0.90,
                }

    # ---------- Semantic AI Match ----------
    user_embedding = create_embedding(dream)

    best_career, similarity = find_best_match(
        user_embedding,
        career_embeddings,
    )

    details = CAREER_KNOWLEDGE[best_career]

    return {
        "goal": dream,
        "category": details["category"],
        "difficulty": details["difficulty"],
        "estimated_duration": details["estimated_duration"],
        "required_skills": details["required_skills"],
        "confidence": round(similarity, 2),
    }