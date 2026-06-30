from backend.knowledge.career_knowledge import CAREER_KNOWLEDGE
from backend.services.embedding_service import create_embedding

career_embeddings = {}

for career, details in CAREER_KNOWLEDGE.items():

    text = f"""
    Career: {career}

    Category: {details['category']}

    Description:
    {details['description']}

    Skills:
    {' '.join(details['required_skills'])}
    """

    career_embeddings[career] = create_embedding(text)