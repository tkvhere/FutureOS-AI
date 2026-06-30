from __future__ import annotations

from statistics import mean
from typing import List


def project_series(history: List[float], horizon_days: int, damping: float = 0.92) -> List[float]:
    if not history:
        history = [0.0]

    trend = 0.0
    if len(history) > 1:
        trend = (history[-1] - history[0]) / max(len(history) - 1, 1)

    window_average = mean(history[-3:])
    forecast = []
    current = history[-1]
    for day in range(horizon_days):
        current = max(0.0, current + trend * damping + (window_average - current) * 0.18)
        forecast.append(round(current, 2))
    return forecast


def bundle_forecasts(history_bundle: dict, horizon_days: int) -> dict:
    return {
        key: project_series(values, horizon_days)
        for key, values in history_bundle.items()
    }
