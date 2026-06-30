from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


def find_best_match(user_embedding, career_embeddings):
    """
    Compare user embedding with all career embeddings
    and return the most similar career.
    """

    best_career = None
    best_score = -1

    for career, embedding in career_embeddings.items():

        score = cosine_similarity(
            np.array(user_embedding).reshape(1, -1),
            np.array(embedding).reshape(1, -1),
        )[0][0]

        if score > best_score:
            best_score = score
            best_career = career

    return best_career, float(best_score)