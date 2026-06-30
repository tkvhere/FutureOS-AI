from __future__ import annotations

import json
import random
import string
from datetime import date, timedelta

import httpx


BASE_URL = "http://localhost:8000"


def _random_email() -> str:
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"smoke_{suffix}@gmail.com"


def main() -> int:
    email = _random_email()
    password = "smoketest123"

    with httpx.Client(base_url=BASE_URL, timeout=15.0) as client:
        health = client.get("/health")
        health.raise_for_status()

        signup = client.post(
            "/auth/signup",
            json={"name": "Smoke User", "email": email, "password": password},
        )
        signup.raise_for_status()

        signup_body = signup.json()
        if "access_token" in signup_body:
            token = signup_body["access_token"]
        else:
            verification_code = signup_body.get("dev_verification_code")
            if not verification_code:
                raise RuntimeError("Verification code was not returned by the local API")

            verify = client.post(
                "/auth/verify",
                json={"email": email, "code": verification_code},
            )
            verify.raise_for_status()

            token = verify.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        today = date.today()
        for offset, study, sleep, screen, exercise in [
            (3, 3.0, 7.0, 2.9, 15),
            (2, 3.4, 7.2, 2.4, 18),
            (1, 3.8, 7.5, 2.0, 24),
            (0, 4.2, 7.8, 1.6, 30),
        ]:
            habit = client.post(
                "/habits/add",
                headers=headers,
                json={
                    "study_hours": study,
                    "sleep_hours": sleep,
                    "screen_time_hours": screen,
                    "exercise_minutes": exercise,
                    "mood": "focused",
                    "log_date": str(today - timedelta(days=offset)),
                },
            )
            habit.raise_for_status()

        summary = {
            "health": client.get("/health").json(),
            "history": client.get("/habits/history", headers=headers).json()["summary"],
            "simulate": client.get("/simulate", headers=headers).json()["scores"],
            "mdp_best": client.get("/mdp/optimal", headers=headers).json()["policy"]["best_action"],
            "compare": client.get("/compare", headers=headers).json()["improvement_percent"],
            "forecast_method": client.get("/forecast", headers=headers).json()["method"],
            "chatbot": client.post("/chatbot", headers=headers, json={"message": "How can I improve focus?"}).json()["reply"],
        }

    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
