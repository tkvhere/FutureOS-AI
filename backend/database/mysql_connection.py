from __future__ import annotations

import json
import os
import uuid
from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Tuple

try:
    import mysql.connector as mysql_connector
except Exception:  # pragma: no cover - fallback when dependency is unavailable
    mysql_connector = None


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


class MySQLCollection:
    TABLE_SCHEMAS = {
        "users": [
            "_id",
            "name",
            "email",
            "password_hash",
            "is_verified",
            "streak",
            "level",
            "badges",
            "created_at",
            "verification_code_hash",
            "verification_expires_at",
            "verification_sent_at",
        ],
        "habits": [
            "_id",
            "user_id",
            "study_hours",
            "sleep_hours",
            "screen_time_hours",
            "exercise_minutes",
            "mood",
            "log_date",
            "score",
            "created_at",
        ],
    }

    def __init__(self, connection, table_name: str):
        self.connection = connection
        self.table_name = table_name

    def _convert_outbound_value(self, key: str, value: Any):
        if value is None:
            return None
        if key.endswith("_at") or key in {"created_at", "verification_expires_at", "verification_sent_at"}:
            if isinstance(value, datetime):
                if value.tzinfo is not None:
                    value = value.astimezone(timezone.utc).replace(tzinfo=None)
                return value
            if isinstance(value, str):
                try:
                    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
                    if parsed.tzinfo is not None:
                        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
                    return parsed
                except Exception:
                    return value
        if key == "log_date":
            if isinstance(value, date) and not isinstance(value, datetime):
                return value
            if isinstance(value, str):
                try:
                    return date.fromisoformat(value)
                except Exception:
                    return value
        if key == "badges" and isinstance(value, (list, dict)):
            return json.dumps(value)
        return value

    def _convert_inbound_row(self, row: dict) -> dict:
        document = dict(row)
        if self.table_name == "users":
            badges = document.get("badges")
            if isinstance(badges, str):
                try:
                    document["badges"] = json.loads(badges) if badges else []
                except Exception:
                    document["badges"] = []
        for key in ("created_at", "log_date"):
            value = document.get(key)
            if isinstance(value, (datetime, date)):
                document[key] = value.isoformat()
        return document

    def _where_clause(self, query: Optional[dict]) -> Tuple[str, List[Any]]:
        if not query:
            return "", []

        clauses = []
        params: List[Any] = []
        for key, expected in query.items():
            if isinstance(expected, dict):
                for operator, value in expected.items():
                    if operator == "$in":
                        value_list = list(value)
                        if not value_list:
                            clauses.append("1 = 0")
                        else:
                            placeholders = ", ".join(["%s"] * len(value_list))
                            clauses.append(f"`{key}` IN ({placeholders})")
                            params.extend(value_list)
                    elif operator == "$gte":
                        clauses.append(f"`{key}` >= %s")
                        params.append(value)
                    elif operator == "$lte":
                        clauses.append(f"`{key}` <= %s")
                        params.append(value)
                    elif operator == "$gt":
                        clauses.append(f"`{key}` > %s")
                        params.append(value)
                    elif operator == "$lt":
                        clauses.append(f"`{key}` < %s")
                        params.append(value)
            else:
                clauses.append(f"`{key}` = %s")
                params.append(expected)

        if not clauses:
            return "", []
        return " WHERE " + " AND ".join(clauses), params

    def _execute(self, sql: str, params: Optional[list] = None, fetch: bool = False):
        cursor = self.connection.cursor(dictionary=True)
        cursor.execute(sql, params or [])
        rows = cursor.fetchall() if fetch else None
        cursor.close()
        return rows

    def find_one(self, query: dict):
        rows = self.find(query)
        return rows[0] if rows else None

    def find(self, query: Optional[dict] = None):
        where_clause, params = self._where_clause(query)
        sql = f"SELECT * FROM `{self.table_name}`{where_clause}"
        rows = self._execute(sql, params, fetch=True) or []
        return [self._convert_inbound_row(row) for row in rows]

    def insert_one(self, document: dict):
        payload = document.copy()
        payload.setdefault("_id", str(uuid.uuid4()))

        columns = []
        placeholders = []
        values = []
        for column in self.TABLE_SCHEMAS[self.table_name]:
            if column in payload:
                columns.append(f"`{column}`")
                placeholders.append("%s")
                values.append(self._convert_outbound_value(column, payload[column]))

        sql = f"INSERT INTO `{self.table_name}` ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
        cursor = self.connection.cursor()
        cursor.execute(sql, values)
        self.connection.commit()
        cursor.close()
        return MemoryInsertResult(inserted_id=payload["_id"])

    def update_one(self, query: dict, update: dict):
        updates = update.get("$set", {})
        if not updates:
            return MemoryUpdateResult()

        set_clause = []
        values = []
        for key, value in updates.items():
            set_clause.append(f"`{key}` = %s")
            values.append(self._convert_outbound_value(key, value))

        where_clause, where_values = self._where_clause(query)
        sql = f"UPDATE `{self.table_name}` SET {', '.join(set_clause)}{where_clause} LIMIT 1"
        cursor = self.connection.cursor()
        cursor.execute(sql, values + where_values)
        self.connection.commit()
        matched = cursor.rowcount
        cursor.close()
        return MemoryUpdateResult(matched_count=matched, modified_count=matched)

    def delete_many(self, query: dict):
        where_clause, params = self._where_clause(query)
        sql = f"DELETE FROM `{self.table_name}`{where_clause}"
        cursor = self.connection.cursor()
        cursor.execute(sql, params)
        self.connection.commit()
        affected = cursor.rowcount
        cursor.close()
        return MemoryUpdateResult(matched_count=affected, modified_count=affected)

    def count_documents(self, query: dict):
        where_clause, params = self._where_clause(query)
        sql = f"SELECT COUNT(*) AS count FROM `{self.table_name}`{where_clause}"
        rows = self._execute(sql, params, fetch=True) or []
        return int(rows[0]["count"]) if rows else 0


class DatabaseConnection:
    def __init__(self):
        self.mysql_host = os.getenv("MYSQL_HOST", "127.0.0.1")
        self.mysql_port = int(os.getenv("MYSQL_PORT", "3306"))
        self.mysql_user = os.getenv("MYSQL_USER", "root")
        self.mysql_password = os.getenv("MYSQL_PASSWORD", "password")
        self.database_name = os.getenv("MYSQL_DATABASE", "FUTURE_YOU")
        self._mysql_connection = None
        self._memory_database = _MemoryDatabase()
        self.mode = "memory"
        self._connect()

    def _connect(self):
        if mysql_connector is None:
            return

        try:
            server_connection = mysql_connector.connect(
                host=self.mysql_host,
                port=self.mysql_port,
                user=self.mysql_user,
                password=self.mysql_password,
                autocommit=True,
            )
            server_cursor = server_connection.cursor()
            server_cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{self.database_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
            server_cursor.close()
            server_connection.close()

            self._mysql_connection = mysql_connector.connect(
                host=self.mysql_host,
                port=self.mysql_port,
                user=self.mysql_user,
                password=self.mysql_password,
                database=self.database_name,
                autocommit=False,
            )
            self._ensure_schema()
            self.mode = "mysql"
        except Exception:
            self._mysql_connection = None
            self.mode = "memory"

    def _ensure_schema(self):
        if self._mysql_connection is None:
            return

        cursor = self._mysql_connection.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                _id VARCHAR(64) PRIMARY KEY,
                name VARCHAR(80) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                is_verified BOOLEAN NOT NULL DEFAULT FALSE,
                streak INT NOT NULL DEFAULT 0,
                level VARCHAR(32) NOT NULL DEFAULT 'Beginner',
                badges LONGTEXT NULL,
                created_at DATETIME NULL,
                verification_code_hash VARCHAR(255) NULL,
                verification_expires_at DATETIME NULL,
                verification_sent_at DATETIME NULL
            )
            """
        )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS habits (
                _id VARCHAR(64) PRIMARY KEY,
                user_id VARCHAR(64) NOT NULL,
                study_hours DOUBLE NOT NULL DEFAULT 0,
                sleep_hours DOUBLE NOT NULL DEFAULT 0,
                screen_time_hours DOUBLE NOT NULL DEFAULT 0,
                exercise_minutes INT NOT NULL DEFAULT 0,
                mood VARCHAR(32) NULL,
                log_date DATE NOT NULL,
                score DOUBLE NOT NULL DEFAULT 0,
                created_at DATETIME NULL,
                INDEX idx_habits_user_id (user_id),
                INDEX idx_habits_log_date (log_date),
                CONSTRAINT fk_habits_user_id FOREIGN KEY (user_id) REFERENCES users(_id) ON DELETE CASCADE
            )
            """
        )
        self._ensure_user_column_exists(cursor, "is_verified", "BOOLEAN NOT NULL DEFAULT FALSE")
        self._ensure_user_column_exists(cursor, "verification_code_hash", "VARCHAR(255) NULL")
        self._ensure_user_column_exists(cursor, "verification_expires_at", "DATETIME NULL")
        self._ensure_user_column_exists(cursor, "verification_sent_at", "DATETIME NULL")
        self._mysql_connection.commit()
        cursor.close()

    def _ensure_user_column_exists(self, cursor, column_name: str, definition_sql: str):
        cursor.execute(
            """
            SELECT COUNT(*)
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'users' AND COLUMN_NAME = %s
            """,
            [self.database_name, column_name],
        )
        exists = cursor.fetchone()[0] > 0
        if not exists:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {column_name} {definition_sql}")
    def collection(self, name: str):
        if self.mode == "mysql" and self._mysql_connection is not None:
            return MySQLCollection(self._mysql_connection, name)
        return self._memory_database[name]


# Database singleton used across the app.
database = DatabaseConnection()


def to_iso(value: Any):
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    return value
