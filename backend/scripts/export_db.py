from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from backend.database.connection import database


ROOT = Path(__file__).resolve().parents[1]
EXPORT_PATH = ROOT / "database" / "exported_data.json"


def _serialize_document(document: dict) -> dict:
    serialized = {}
    for key, value in document.items():
        if isinstance(value, datetime):
            serialized[key] = value.isoformat()
        else:
            serialized[key] = value
    return serialized


def export_database(destination: Path = EXPORT_PATH):
    users = [_serialize_document(item) for item in database.collection("users").find({})]
    habits = [_serialize_document(item) for item in database.collection("habits").find({})]

    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("w", encoding="utf-8") as handle:
        json.dump({"users": users, "habits": habits}, handle, indent=2)

    return {"destination": str(destination), "users": len(users), "habits": len(habits)}


if __name__ == "__main__":
    print(json.dumps(export_database(), indent=2))
