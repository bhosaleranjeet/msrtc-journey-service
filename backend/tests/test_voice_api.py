from fastapi.testclient import TestClient

import app.main as main_module


class FakeTranscriptionProvider:
    def __init__(self) -> None:
        self.received: tuple[bytes, str, str] | None = None

    def transcribe(self, audio: bytes, content_type: str, language_hint: str = "en") -> str:
        self.received = (audio, content_type, language_hint)
        return "मला उद्या पुण्याहून नाशिकला जायचे आहे"


def test_voice_api_returns_transcript_and_preserves_audio_type(monkeypatch) -> None:
    provider = FakeTranscriptionProvider()
    monkeypatch.setattr(main_module, "configured_transcription_provider", lambda: provider)

    response = TestClient(main_module.app).post(
        "/api/voice/transcribe",
        content=b"synthetic-audio",
        headers={"content-type": "audio/mp4", "x-voice-locale": "mr-IN"},
    )

    assert response.status_code == 200
    assert response.json()["transcript"].startswith("मला उद्या")
    assert provider.received == (b"synthetic-audio", "audio/mp4", "mr")


def test_voice_api_defaults_to_english_and_rejects_unknown_language_hints(monkeypatch) -> None:
    provider = FakeTranscriptionProvider()
    monkeypatch.setattr(main_module, "configured_transcription_provider", lambda: provider)
    client = TestClient(main_module.app)

    response = client.post(
        "/api/voice/transcribe",
        content=b"synthetic-audio",
        headers={"content-type": "audio/webm", "x-voice-locale": "unfamiliar"},
    )

    assert response.status_code == 200
    assert provider.received == (b"synthetic-audio", "audio/webm", "en")


def test_voice_api_rejects_empty_or_oversized_recordings() -> None:
    client = TestClient(main_module.app)

    empty = client.post("/api/voice/transcribe", content=b"", headers={"content-type": "audio/webm"})
    oversized = client.post("/api/voice/transcribe", content=b"x" * 5_000_001, headers={"content-type": "audio/webm"})

    assert empty.status_code == 503
    assert empty.json()["error"]["code"] == "VOICE_UNAVAILABLE"
    assert oversized.status_code == 503
    assert oversized.json()["error"]["code"] == "VOICE_UNAVAILABLE"
