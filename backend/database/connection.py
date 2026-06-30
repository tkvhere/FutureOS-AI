from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional

try:
    from pymongo import MongoClient
except Exception:  # pragma: no cover - import fallback for lightweight setups
    MongoClient = None


@dataclass
class MemoryInsertResult:
    inserted_id: str


@dataclass
class MemoryUpdateResult:
    matched_count: int = 0
    modified_count: int = 0


class MemoryCursor:
    def __init__(self, documents: List[dict]):
        self._documents = documents

    def sort(self, key: str, direction: int):
        reverse = direction < 0
        self._documents.sort(key=lambda item: item.get(key), reverse=reverse)
        return self

    def limit(self, count: int):
        self._documents = self._documents[:count]
        return self

    def __iter__(self):
        return iter(self._documents)


class MemoryCollection:
    def __init__(self):
        self.records: List[dict] = []

    def _matches(self, document: dict, query: dict) -> bool:
        for key, expected in query.items():
            actual = document.get(key)
            if isinstance(expected, dict):
                for operator, value in expected.items():
                    if operator == "$gte" and not (actual >= value):
                        return False
                    if operator == "$lte" and not (actual <= value):
                        return False
                    if operator == "$gt" and not (actual > value):
                        return False
                    if operator == "$lt" and not (actual < value):
                        return False
                    if operator == "$in" and actual not in value:
                        return False
            elif actual != expected:
                return False
        return True

    def find_one(self, query: dict):
        for document in self.records:
            if self._matches(document, query):
                return document.copy()
        return None

    def insert_one(self, document: dict):
        item = document.copy()
        item.setdefault("_id", f"mem_{len(self.records) + 1}")
        self.records.append(item)
        return MemoryInsertResult(inserted_id=item["_id"])

    def find(self, query: Optional[dict] = None):
        query = query or {}
        documents = [item.copy() for item in self.records if self._matches(item, query)]
        return MemoryCursor(documents)

    def update_one(self, query: dict, update: dict):
        for document in self.records:
            if self._matches(document, query):
                if "$set" in update:
                    document.update(update["$set"])
                return MemoryUpdateResult(matched_count=1, modified_count=1)
        return MemoryUpdateResult()

    def delete_many(self, query: dict):
        before = len(self.records)
        self.records = [item for item in self.records if not self._matches(item, query)]
        return MemoryUpdateResult(matched_count=before - len(self.records), modified_count=before - len(self.records))

    def count_documents(self, query: dict):
        return sum(1 for item in self.records if self._matches(item, query))


class _MemoryDatabase:
    def __init__(self):
        self.collections: Dict[str, MemoryCollection] = {}

    def __getitem__(self, name: str):
        if name not in self.collections:
            self.collections[name] = MemoryCollection()
        return self.collections[name]


class DatabaseConnection:
    def __init__(self):
        self.mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        self.database_name = os.getenv("MONGO_DB_NAME", "life_outcome_simulator")
        self._mongo_client = None
        self._memory_database = _MemoryDatabase()
        self.mode = "memory"
        self._connect()

    def _connect(self):
        if MongoClient is None:
            return
        try:
            self._mongo_client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=800)
            self._mongo_client.admin.command("ping")
            self.mode = "mongo"
        except Exception:
            self._mongo_client = None
            self.mode = "memory"

    def collection(self, name: str):
        if self.mode == "mongo" and self._mongo_client is not None:
            return self._mongo_client[self.database_name][name]
        return self._memory_database[name]


database = DatabaseConnection()


def to_iso(value: Any):
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    return value
