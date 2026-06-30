from __future__ import annotations

import json
import sys
from pathlib import Path

from backend.database.connection import database
from backend.database.init_db import initialize_database


ROOT = Path(__file__).resolve().parents[1]
SAMPLE_DATA_PATH = ROOT / "database" / "sample_data.json"


def seed_database(source_path: Path = SAMPLE_DATA_PATH):
    if not source_path.exists():
        raise FileNotFoundError(f"Seed file not found: {source_path}")

    with source_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    users = database.collection("users")
    habits = database.collection("habits")

    users.delete_many({})
    habits.delete_many({})

    initialize_database()

    return {
        "users": users.count_documents({}),
        "habits": habits.count_documents({}),
        "source": str(source_path),
    }


if __name__ == "__main__":
    result = seed_database()
    print(json.dumps(result, indent=2))
