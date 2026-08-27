from datetime import date, time

import pytest
from pydantic import ValidationError

from app.integrations.openai.intent_provider import IntentProviderError
from app.schemas.intent import ParsedJourneyIntent, TimeWindow, TravelPreferences
from app.services.intent_service import IntentService


class FakeIntentProvider:
    def parse(self, query: str, reference_date: date) -> ParsedJourneyIntent:
        assert query == "Pune to Nashik tomorrow morning, AC"
        assert reference_date == date(2026, 8, 23)
        return ParsedJourneyIntent(
            origin="Pune",
            destination="Nashik",
            travel_date=date(2026, 8, 24),
            time_window=TimeWindow(start=time(6), end=time(12)),
            preferences=TravelPreferences(air_conditioned=True),
        )


def test_valid_intent_is_returned_in_a_schema_safe_form() -> None:
    intent = IntentService(FakeIntentProvider()).parse("Pune to Nashik tomorrow morning, AC", date(2026, 8, 23))
    assert intent.destination == "Nashik"
    assert intent.preferences.air_conditioned is True


def test_partial_or_invalid_intent_is_rejected() -> None:
    with pytest.raises(ValidationError):
        ParsedJourneyIntent.model_validate({"origin": "Pune", "travel_date": "2026-08-24"})


def test_provider_failure_is_recoverable() -> None:
    class FailingProvider:
        def parse(self, query: str, reference_date: date) -> ParsedJourneyIntent:
            raise IntentProviderError("Natural-language search is temporarily unavailable.")

    with pytest.raises(IntentProviderError, match="temporarily unavailable"):
        IntentService(FailingProvider()).parse("Pune to Nashik", date(2026, 8, 23))


def test_time_window_is_a_local_clock_preference() -> None:
    window = TimeWindow.model_validate({"start": "06:00:00Z", "end": "12:00:00Z"})
    assert window.start.tzinfo is None
    assert window.end.tzinfo is None
