from datetime import date

from fastapi.testclient import TestClient

from backend.main import app
from backend.database.connection import database


client = TestClient(app)


def _reset_database():
    database.collection("users").delete_many({})
    database.collection("habits").delete_many({})


def _auth_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def _signup_and_verify(payload: dict) -> str:
    signup_response = client.post("/auth/signup", json=payload)
    assert signup_response.status_code == 200
    signup_body = signup_response.json()
    verification_code = signup_body["dev_verification_code"]
    assert signup_body["verification_required"] is True
    assert signup_body["email"] == payload["email"]
    assert verification_code

    verify_response = client.post(
        "/auth/verify",
        json={"email": payload["email"], "code": verification_code},
    )
    assert verify_response.status_code == 200
    return verify_response.json()["access_token"]


def test_signup_login_and_profile_flow():
    _reset_database()

    signup_payload = {
        "name": "Test User",
        "email": "test@gmail.com",
        "password": "testpass123",
    }
    signup_response = client.post("/auth/signup", json=signup_payload)
    assert signup_response.status_code == 200

    signup_body = signup_response.json()
    assert signup_body["verification_required"] is True
    assert signup_body["email"] == signup_payload["email"]
    verification_code = signup_body["dev_verification_code"]
    assert verification_code

    verify_response = client.post(
        "/auth/verify",
        json={"email": signup_payload["email"], "code": verification_code},
    )
    assert verify_response.status_code == 200

    login_response = client.post(
        "/auth/login",
        json={"email": signup_payload["email"], "password": signup_payload["password"]},
    )
    assert login_response.status_code == 200

    token = login_response.json()["access_token"]
    me_response = client.get("/auth/me", headers=_auth_headers(token))
    assert me_response.status_code == 200
    assert me_response.json()["email"] == signup_payload["email"]


def test_signup_rejects_non_gmail_addresses():
    _reset_database()

    response = client.post(
        "/auth/signup",
        json={"name": "Bad User", "email": "notgmail@yahoo.com", "password": "badpass123"},
    )

    assert response.status_code == 422


def test_habit_log_history_and_simulation():
    _reset_database()

    token = _signup_and_verify({"name": "Focus User", "email": "focus@gmail.com", "password": "focuspass123"})

    habit_response = client.post(
        "/habits/add",
        headers=_auth_headers(token),
        json={
            "study_hours": 4.5,
            "sleep_hours": 7.5,
            "screen_time_hours": 1.5,
            "exercise_minutes": 30,
            "mood": "focused",
            "log_date": str(date.today()),
        },
    )
    assert habit_response.status_code == 200
    assert habit_response.json()["entry"]["score"] > 0

    history_response = client.get("/habits/history", headers=_auth_headers(token))
    assert history_response.status_code == 200
    history_body = history_response.json()
    assert len(history_body["entries"]) == 1
    assert history_body["summary"]["level"] in {"Beginner", "Focused", "Elite"}

    simulate_response = client.get("/simulate", headers=_auth_headers(token))
    assert simulate_response.status_code == 200
    simulation_body = simulate_response.json()
    assert "30_days" in simulation_body["projections"]
    assert "mdp" in simulation_body
    assert "goal_days_prediction" in simulation_body
    assert simulation_body["goal_days_prediction"]["method"] in {"decision_tree", "rule_based"}
    assert simulation_body["goal_days_prediction"]["days_to_goal"] > 0


def test_mdp_compare_chatbot_and_forecast():
    _reset_database()

    token = _signup_and_verify({"name": "Optimize User", "email": "optimize@gmail.com", "password": "optpass123"})

    for day, study, sleep, screen, exercise in [
        ("2026-04-07", 2.0, 6.5, 4.0, 10),
        ("2026-04-08", 3.0, 7.0, 3.2, 15),
        ("2026-04-09", 3.5, 7.5, 2.5, 20),
        ("2026-04-10", 4.0, 7.8, 1.8, 25),
    ]:
        client.post(
            "/habits/add",
            headers=_auth_headers(token),
            json={
                "study_hours": study,
                "sleep_hours": sleep,
                "screen_time_hours": screen,
                "exercise_minutes": exercise,
                "mood": "steady",
                "log_date": day,
            },
        )

    mdp_response = client.get("/mdp/optimal", headers=_auth_headers(token))
    assert mdp_response.status_code == 200
    assert mdp_response.json()["policy"]["best_action"] in {"study", "sleep", "scroll", "exercise"}

    compare_response = client.get("/compare", headers=_auth_headers(token))
    assert compare_response.status_code == 200
    compare_body = compare_response.json()
    assert compare_body["improvement_percent"]["knowledge"] >= 0

    chatbot_response = client.post(
        "/chatbot",
        headers=_auth_headers(token),
        json={"message": "My screen time is high, what should I do?"},
    )
    assert chatbot_response.status_code == 200
    assert "screen time" in chatbot_response.json()["reply"].lower()

    forecast_response = client.get("/forecast", headers=_auth_headers(token))
    assert forecast_response.status_code == 200
    forecast_body = forecast_response.json()
    assert forecast_body["history_points"] >= 4
    assert set(forecast_body["forecast"].keys()) == {"study_hours", "sleep_hours", "screen_time_hours", "exercise_minutes"}
    assert "goal_days_prediction" in forecast_body
    assert forecast_body["goal_days_prediction"]["method"] in {"decision_tree", "rule_based"}
    assert forecast_body["goal_days_prediction"]["days_to_goal"] > 0


def test_login_rejects_unverified_gmail_accounts():
    _reset_database()

    signup_response = client.post(
        "/auth/signup",
        json={"name": "Pending User", "email": "pending@gmail.com", "password": "pendingpass123"},
    )
    assert signup_response.status_code == 200

    login_response = client.post(
        "/auth/login",
        json={"email": "pending@gmail.com", "password": "pendingpass123"},
    )
    assert login_response.status_code == 403
