def generate_goal_plan(goal, study, sleep, screen):
    normalized_goal = str(goal or "").strip().lower()

    # Keep the input signature as requested for future extension.
    _ = (study, sleep, screen)

    if normalized_goal == "ips":
        return {
            "tasks": ["NCERT", "MCQs", "Newspaper", "Revision"],
            "target_study_hours": 6,
        }

    if normalized_goal == "job":
        return {
            "tasks": ["DSA", "Projects", "Interview prep"],
            "target_study_hours": 4,
        }

    return {
        "tasks": [],
        "target_study_hours": 0,
    }
