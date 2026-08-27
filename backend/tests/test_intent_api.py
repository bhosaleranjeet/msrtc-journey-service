from fastapi.testclient import TestClient

from app.main import app


def test_intent_api_returns_a_recoverable_error_without_api_key(monkeypatch) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    client = TestClient(app)

    response = client.post(
        "/api/intent/parse",
        json={"query": "Pune to Nashik tomorrow morning, AC", "reference_date": "2026-08-23"},
    )

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "AI_UNAVAILABLE"
