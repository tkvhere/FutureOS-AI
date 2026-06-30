from __future__ import annotations

from pathlib import Path

from backend.database.connection import database
from backend.database.init_db import SAMPLE_DATA_PATH
from backend.scripts.export_db import export_database


if __name__ == "__main__":
    print(export_database(Path(SAMPLE_DATA_PATH.parent / "exported_data.json")))
