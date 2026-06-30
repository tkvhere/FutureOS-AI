from __future__ import annotations

import json
import sys
from pathlib import Path

from backend.database.connection import database


def import_database(source_path: Path):
    if not source_path.exists():
        raise FileNotFoundError(f"Import file not found: {source_path}")

    with source_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    users = database.collection("users")
    habits = database.collection("habits")

    users.delete_many({})
    habits.delete_many({})

    for user in payload.get("users", []):
        users.insert_one(user)

    for habit in payload.get("habits", []):
        habits.insert_one(habit)

    return {"users": users.count_documents({}), "habits": habits.count_documents({}), "source": str(source_path)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python -m backend.scripts.import_db <path-to-json>")
    print(json.dumps(import_database(Path(sys.argv[1])), indent=2))
