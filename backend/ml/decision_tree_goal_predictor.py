from __future__ import annotations

import csv
import pickle
from pathlib import Path
from typing import Dict, List

try:
    from sklearn.model_selection import train_test_split
    from sklearn.tree import DecisionTreeRegressor
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
except Exception:  # pragma: no cover
    train_test_split = None
    DecisionTreeRegressor = None
    mean_absolute_error = None
    mean_squared_error = None
    r2_score = None


# Sample training data requested for the model: [study, sleep, screen, mood] -> days to achieve goal
_SAMPLE_DATA: List[tuple[float, float, float, float, float]] = [
    (1.5, 5.5, 6.0, 2.0, 180.0),
    (2.0, 6.0, 5.2, 3.0, 150.0),
    (2.5, 6.2, 4.8, 4.0, 132.0),
    (3.0, 6.8, 4.0, 5.0, 112.0),
    (3.2, 7.0, 3.6, 6.0, 96.0),
    (3.8, 7.2, 3.0, 7.0, 82.0),
    (4.2, 7.5, 2.2, 8.0, 66.0),
    (4.8, 7.8, 1.8, 9.0, 52.0),
    (5.4, 8.0, 1.2, 9.5, 40.0),
    (6.0, 8.2, 0.8, 10.0, 30.0),
]

_MOOD_MAP = {
    "very_low": 2.0,
    "low": 3.0,
    "steady": 6.0,
    "focused": 7.0,
    "strong": 8.0,
    "great": 9.0,
}

DATASET_PATH = Path(__file__).resolve().parent.parent / "datasets" / "user_behavior.csv"
MODEL_PATH = Path(__file__).resolve().parent / "models" / "digital_twin_model.pkl"


def _encode_mood_value(mood: str | None) -> float:
    normalized = str(mood or "steady").strip().lower()
    return float(_MOOD_MAP.get(normalized, 6.0))


def _load_training_data_from_csv(dataset_path: Path = DATASET_PATH) -> List[tuple[float, float, float, float, float]]:
    if not dataset_path.exists():
        return list(_SAMPLE_DATA)

    rows: List[tuple[float, float, float, float, float]] = []
    try:
        with dataset_path.open("r", encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                try:
                    rows.append(
                        (
                            float(row["study_hours"]),
                            float(row["sleep_hours"]),
                            float(row["screen_time_hours"]),
                            _encode_mood_value(row.get("mood")),
                            float(row["days_to_goal"]),
                        )
                    )
                except (KeyError, TypeError, ValueError):
                    continue
    except OSError:
        return list(_SAMPLE_DATA)

    return rows or list(_SAMPLE_DATA)


def _build_training_matrices(
    training_rows: List[tuple[float, float, float, float, float]] | None = None,
) -> tuple[list[list[float]], list[float]]:
    rows = list(training_rows) if training_rows is not None else _load_training_data_from_csv()
    x_values = [[row[0], row[1], row[2], row[3]] for row in rows]
    y_values = [row[4] for row in rows]
    return x_values, y_values


def _train_decision_tree(
    training_rows: List[tuple[float, float, float, float, float]] | None = None,
    random_state: int = 7,
):
    if DecisionTreeRegressor is None:
        return None

    x_values, y_values = _build_training_matrices(training_rows)
    model = DecisionTreeRegressor(max_depth=4, random_state=random_state)
    model.fit(x_values, y_values)
    return model


def _load_persisted_model(model_path: Path = MODEL_PATH):
    if DecisionTreeRegressor is None or not model_path.exists():
        return None

    try:
        with model_path.open("rb") as handle:
            return pickle.load(handle)
    except (OSError, pickle.PickleError, EOFError, AttributeError, ValueError, TypeError):
        return None


def _save_persisted_model(model, model_path: Path = MODEL_PATH) -> bool:
    if model is None:
        return False

    try:
        model_path.parent.mkdir(parents=True, exist_ok=True)
        with model_path.open("wb") as handle:
            pickle.dump(model, handle)
        return True
    except OSError:
        return False


def evaluate_goal_days_model(
    training_rows: List[tuple[float, float, float, float, float]] | None = None,
    test_size: float = 0.2,
    random_state: int = 7,
) -> Dict[str, float | int | str | dict]:
    rows = list(training_rows) if training_rows is not None else _load_training_data_from_csv()
    if DecisionTreeRegressor is None or mean_absolute_error is None or mean_squared_error is None or r2_score is None or train_test_split is None:
        return {
            "available": False,
            "message": "scikit-learn is unavailable; rule-based fallback is active.",
            "dataset_size": len(rows),
            "split": {"train_size": 0, "test_size": 0, "test_ratio": test_size},
        }

    x_values, y_values = _build_training_matrices(rows)

    if len(rows) < 2:
        return {
            "available": False,
            "message": "Not enough data to evaluate the Decision Tree model.",
            "dataset_size": len(rows),
            "split": {"train_size": len(rows), "test_size": 0, "test_ratio": test_size},
        }

    x_train, x_test, y_train, y_test = train_test_split(
        x_values,
        y_values,
        test_size=test_size,
        random_state=random_state,
    )

    model = DecisionTreeRegressor(max_depth=4, random_state=random_state)
    model.fit(x_train, y_train)

    train_predictions = model.predict(x_train)
    test_predictions = model.predict(x_test)

    train_mse = float(mean_squared_error(y_train, train_predictions))
    test_mse = float(mean_squared_error(y_test, test_predictions))

    return {
        "available": True,
        "dataset_size": len(rows),
        "split": {
            "train_size": len(x_train),
            "test_size": len(x_test),
            "test_ratio": test_size,
        },
        "train_r2": round(float(r2_score(y_train, train_predictions)), 4),
        "train_mae_days": round(float(mean_absolute_error(y_train, train_predictions)), 2),
        "train_mse_days": round(train_mse, 2),
        "train_rmse_days": round(train_mse ** 0.5, 2),
        "r2_score": round(float(r2_score(y_test, test_predictions)), 4),
        "mae_days": round(float(mean_absolute_error(y_test, test_predictions)), 2),
        "mse_days": round(test_mse, 2),
        "rmse_days": round(test_mse ** 0.5, 2),
    }


class GoalDaysDecisionTreePredictor:
    def __init__(self):
        self.model = None
        self.trained = False
        self._load_or_train_model()

    def _encode_mood(self, mood: str | None) -> float:
        return _encode_mood_value(mood)

    def _rule_based_days(self, study: float, sleep: float, screen: float, mood_score: float) -> int:
        # Keep a deterministic fallback when sklearn or model training is unavailable.
        progress_index = (study * 8.5) + (sleep * 3.2) - (screen * 4.0) + (mood_score * 2.0)
        estimated_days = 180 - progress_index
        return int(max(21, min(365, round(estimated_days))))

    def _train_if_needed(self) -> bool:
        if self.trained:
            return self.model is not None
        if DecisionTreeRegressor is None:
            self.trained = True
            self.model = None
            return False

        model = _load_persisted_model()
        if model is None:
            model = _train_decision_tree()
            if model is not None:
                _save_persisted_model(model)

        self.model = model
        self.trained = True
        return self.model is not None

    def _load_or_train_model(self) -> None:
        if DecisionTreeRegressor is None:
            self.model = None
            self.trained = True
            return

        model = _load_persisted_model()
        if model is None:
            model = _train_decision_tree()
            if model is not None:
                _save_persisted_model(model)

        self.model = model
        self.trained = True

    def predict(self, profile: Dict[str, float | str]) -> Dict[str, int | str]:
        study = float(profile.get("study_hours", 0.0) or 0.0)
        sleep = float(profile.get("sleep_hours", 0.0) or 0.0)
        screen = float(profile.get("screen_time_hours", 0.0) or 0.0)
        mood_score = self._encode_mood(str(profile.get("mood", "steady")))

        if self._train_if_needed() and self.model is not None:
            predicted_days = float(self.model.predict([[study, sleep, screen, mood_score]])[0])
            return {
                "method": "decision_tree",
                "days_to_goal": int(max(21, min(365, round(predicted_days)))),
            }

        return {
            "method": "rule_based",
            "days_to_goal": self._rule_based_days(study, sleep, screen, mood_score),
        }

    def evaluate(self) -> Dict[str, float | int | str]:
        evaluation = evaluate_goal_days_model()
        if not evaluation.get("available"):
            return evaluation

        training_rows = _load_training_data_from_csv()
        x_train, y_train = _build_training_matrices(training_rows)

        errors = []
        for index in range(len(x_train)):
            x_subset = [x_train[i] for i in range(len(x_train)) if i != index]
            y_subset = [y_train[i] for i in range(len(y_train)) if i != index]
            holdout_model = DecisionTreeRegressor(max_depth=4, random_state=7)
            holdout_model.fit(x_subset, y_subset)
            prediction = float(holdout_model.predict([x_train[index]])[0])
            errors.append(abs(prediction - y_train[index]))

        loocv_mae = sum(errors) / len(errors)
        within_15 = sum(1 for error in errors if error <= 15) / len(errors) * 100
        within_30 = sum(1 for error in errors if error <= 30) / len(errors) * 100

        evaluation.update(
            {
                "sample_size": len(training_rows),
                "loocv_mae_days": round(float(loocv_mae), 2),
                "within_15_days": round(float(within_15), 2),
                "within_30_days": round(float(within_30), 2),
            }
        )
        return evaluation


goal_days_predictor = GoalDaysDecisionTreePredictor()
