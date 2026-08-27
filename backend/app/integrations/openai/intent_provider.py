"""OpenAI implementation of natural-language journey intent parsing."""

import json
import os
from datetime import date
from typing import Protocol

from pydantic import ValidationError

from app.schemas.intent import ParsedJourneyIntent


class IntentProviderError(Exception):
    """A recoverable issue parsing passenger language."""


class IntentProvider(Protocol):
    def parse(self, query: str, reference_date: date) -> ParsedJourneyIntent: ...


class OpenAIIntentProvider:
    """Uses OpenAI Structured Outputs, then validates the result at the domain boundary."""

    def __init__(self, *, api_key: str, model: str = "gpt-4.1-mini") -> None:
        self._api_key = api_key
        self._model = model

    def parse(self, query: str, reference_date: date) -> ParsedJourneyIntent:
        try:
            from openai import OpenAI

            client = OpenAI(api_key=self._api_key)
            response = client.responses.create(
                model=self._model,
                store=False,
                instructions=(
                    "Extract a passenger's journey request into the supplied schema. "
                    f"The reference date is {reference_date.isoformat()}. Resolve relative dates against it. "
                    "Return only stated or unambiguously implied values. Do not invent places, services, "
                    "fares, routes, availability, booking details, or preferences."
                ),
                input=query,
                text={
                    "format": {
                        "type": "json_schema",
                        "name": "journey_intent",
                        "strict": True,
                        "schema": ParsedJourneyIntent.model_json_schema(),
                    }
                },
            )
            return ParsedJourneyIntent.model_validate_json(response.output_text)
        except (ValidationError, ValueError, json.JSONDecodeError) as error:
            raise IntentProviderError("The AI response did not contain a valid journey request.") from error
        except Exception as error:
            raise IntentProviderError("Natural-language search is temporarily unavailable.") from error


def configured_intent_provider() -> IntentProvider:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise IntentProviderError("Natural-language search is not configured. Use the fields below to search manually.")
    return OpenAIIntentProvider(api_key=api_key, model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"))
