from datetime import date, time

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class StructuredOutputModel(BaseModel):
    """OpenAI strict JSON Schema requires every object to forbid extra fields."""

    model_config = ConfigDict(extra="forbid")


class TimeWindow(StructuredOutputModel):
    start: time
    end: time

    @field_validator("start", "end")
    @classmethod
    def discard_timezone_for_local_journey_clock(cls, value: time) -> time:
        """Journey preferences are local clock times, not instants in UTC."""
        return value.replace(tzinfo=None)

    @model_validator(mode="after")
    def end_must_follow_start(self) -> "TimeWindow":
        if self.end <= self.start:
            raise ValueError("Time window end must be after its start.")
        return self


class TravelPreferences(StructuredOutputModel):
    air_conditioned: bool | None


class ParsedJourneyIntent(StructuredOutputModel):
    """Language interpretation only; it contains no operational transport claims."""

    origin: str = Field(min_length=2, max_length=100)
    destination: str = Field(min_length=2, max_length=100)
    travel_date: date
    time_window: TimeWindow | None
    preferences: TravelPreferences


class IntentParseRequest(BaseModel):
    query: str = Field(min_length=4, max_length=500)
    reference_date: date | None = None
