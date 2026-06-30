from __future__ import annotations

from typing import Dict, List, Optional

import numpy as np

try:
    import torch
    import torch.nn as nn
except Exception:  # pragma: no cover
    torch = None
    nn = None

from backend.ml.forecasting import project_series


if nn is not None:
    class _HabitLSTM(nn.Module):
        def __init__(self, input_size: int = 4, hidden_size: int = 32, output_size: int = 4):
            super().__init__()
            self.lstm = nn.LSTM(input_size, hidden_size, batch_first=True)
            self.dropout = nn.Dropout(0.1)
            self.head = nn.Linear(hidden_size, output_size)

        def forward(self, x):
            output, _ = self.lstm(x)
            last_step = output[:, -1, :]
            return self.head(self.dropout(last_step))
else:
    class _HabitLSTM:  # pragma: no cover - only used as a type placeholder when torch is missing
        pass


class HabitLSTMForecaster:
    def __init__(self):
        self.model: Optional[_HabitLSTM] = None
        self.feature_min: Optional[np.ndarray] = None
        self.feature_max: Optional[np.ndarray] = None
        self.trained = False
        self.window_size = 4

    def _to_matrix(self, habit_entries: List[dict]) -> np.ndarray:
        ordered = sorted(habit_entries, key=lambda item: item.get("log_date", ""))
        rows = []
        for entry in ordered:
            rows.append(
                [
                    float(entry.get("study_hours", 0.0)),
                    float(entry.get("sleep_hours", 0.0)),
                    float(entry.get("screen_time_hours", 0.0)),
                    float(entry.get("exercise_minutes", 0.0)) / 60.0,
                ]
            )
        return np.asarray(rows, dtype=float) if rows else np.empty((0, 4), dtype=float)

    def _fit_scaler(self, matrix: np.ndarray) -> np.ndarray:
        self.feature_min = matrix.min(axis=0)
        self.feature_max = matrix.max(axis=0)
        spread = np.where((self.feature_max - self.feature_min) == 0, 1.0, self.feature_max - self.feature_min)
        return (matrix - self.feature_min) / spread

    def _normalize(self, matrix: np.ndarray) -> np.ndarray:
        if self.feature_min is None or self.feature_max is None:
            return matrix
        spread = np.where((self.feature_max - self.feature_min) == 0, 1.0, self.feature_max - self.feature_min)
        return (matrix - self.feature_min) / spread

    def _denormalize(self, matrix: np.ndarray) -> np.ndarray:
        if self.feature_min is None or self.feature_max is None:
            return matrix
        spread = np.where((self.feature_max - self.feature_min) == 0, 1.0, self.feature_max - self.feature_min)
        return (matrix * spread) + self.feature_min

    def _build_sequences(self, series: np.ndarray):
        inputs = []
        targets = []
        for index in range(len(series) - self.window_size):
            inputs.append(series[index : index + self.window_size])
            targets.append(series[index + self.window_size])
        return np.asarray(inputs, dtype=float), np.asarray(targets, dtype=float)

    def train(self, habit_entries: List[dict]) -> bool:
        if torch is None:
            self.trained = False
            return False

        matrix = self._to_matrix(habit_entries)
        if len(matrix) < 6:
            self.trained = False
            return False

        normalized = self._fit_scaler(matrix)
        x_train, y_train = self._build_sequences(normalized)
        if len(x_train) == 0:
            self.trained = False
            return False

        torch.manual_seed(7)
        self.model = _HabitLSTM(input_size=4, hidden_size=32, output_size=4)
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(self.model.parameters(), lr=0.01)

        x_tensor = torch.tensor(x_train, dtype=torch.float32)
        y_tensor = torch.tensor(y_train, dtype=torch.float32)

        self.model.train()
        for _ in range(140):
            optimizer.zero_grad()
            prediction = self.model(x_tensor)
            loss = criterion(prediction, y_tensor)
            loss.backward()
            optimizer.step()

        self.trained = True
        return True

    def predict(self, habit_entries: List[dict], horizon_days: int = 30) -> Dict[str, List[float]]:
        matrix = self._to_matrix(habit_entries)
        if len(matrix) == 0:
            return {
                "study_hours": project_series([0.0], horizon_days),
                "sleep_hours": project_series([0.0], horizon_days),
                "screen_time_hours": project_series([0.0], horizon_days),
                "exercise_minutes": project_series([0.0], horizon_days),
            }

        if self.train(habit_entries) and torch is not None and self.model is not None:
            normalized = self._normalize(matrix)
            if len(normalized) < self.window_size:
                normalized = np.vstack([normalized, np.repeat(normalized[-1][None, :], self.window_size - len(normalized), axis=0)])
            window = normalized[-self.window_size :].copy()
            forecast = {"study_hours": [], "sleep_hours": [], "screen_time_hours": [], "exercise_minutes": []}

            self.model.eval()
            for _ in range(horizon_days):
                tensor_window = torch.tensor(window[None, :, :], dtype=torch.float32)
                with torch.no_grad():
                    next_normalized = self.model(tensor_window).cpu().numpy()[0]

                next_normalized = np.clip(next_normalized, 0.0, 1.0)
                next_denormalized = self._denormalize(next_normalized.reshape(1, -1))[0]
                study, sleep, screen, exercise_ratio = next_denormalized.tolist()
                exercise_minutes = exercise_ratio * 60.0

                forecast["study_hours"].append(round(max(0.0, float(study)), 2))
                forecast["sleep_hours"].append(round(max(0.0, float(sleep)), 2))
                forecast["screen_time_hours"].append(round(max(0.0, float(screen)), 2))
                forecast["exercise_minutes"].append(round(max(0.0, float(exercise_minutes)), 2))

                window = np.vstack([window[1:], next_normalized])

            return forecast

        fallback_history = {
            "study_hours": [entry.get("study_hours", 0) for entry in habit_entries] or [0],
            "sleep_hours": [entry.get("sleep_hours", 0) for entry in habit_entries] or [0],
            "screen_time_hours": [entry.get("screen_time_hours", 0) for entry in habit_entries] or [0],
            "exercise_minutes": [entry.get("exercise_minutes", 0) for entry in habit_entries] or [0],
        }
        return {key: project_series(values, horizon_days) for key, values in fallback_history.items()}


forecaster = HabitLSTMForecaster()
