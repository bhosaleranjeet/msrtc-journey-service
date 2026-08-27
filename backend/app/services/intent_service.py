from datetime import date

from app.integrations.openai.intent_provider import IntentProvider, IntentProviderError
from app.schemas.intent import ParsedJourneyIntent


class IntentService:
    def __init__(self, provider: IntentProvider) -> None:
        self._provider = provider

    def parse(self, query: str, reference_date: date) -> ParsedJourneyIntent:
        try:
            return self._provider.parse(query, reference_date)
        except IntentProviderError:
            raise
        except Exception as error:
            raise IntentProviderError("Natural-language search is temporarily unavailable.") from error
