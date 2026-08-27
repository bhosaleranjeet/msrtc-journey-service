from datetime import date, datetime, time
from enum import StrEnum

from pydantic import BaseModel, Field


class JourneySort(StrEnum):
    RECOMMENDED = "recommended"
    CHEAPEST = "cheapest"
    FASTEST = "fastest"
    EARLIEST = "earliest"


class JourneySearchRequest(BaseModel):
    origin: str = Field(min_length=2, max_length=100)
    destination: str = Field(min_length=2, max_length=100)
    journey_date: date
    time_start: time | None = None
    time_end: time | None = None
    air_conditioned: bool | None = None
    sort_by: JourneySort = JourneySort.RECOMMENDED


class StopCandidate(BaseModel):
    id: str
    name: str
    city: str
    description: str


class JourneyResult(BaseModel):
    id: str
    trip_id: str
    service_name: str
    service_type: str
    is_air_conditioned: bool
    departure_at: datetime
    arrival_at: datetime
    duration_minutes: int
    fare_inr: int
    available_seats: int
    total_seats: int
    origin: StopCandidate
    destination: StopCandidate


class JourneySegment(BaseModel):
    trip_id: str
    service_name: str
    service_type: str
    is_air_conditioned: bool
    departure_at: datetime
    arrival_at: datetime
    duration_minutes: int
    fare_inr: int
    available_seats: int
    origin: StopCandidate
    destination: StopCandidate


class ConnectingJourneyResult(BaseModel):
    id: str
    segments: list[JourneySegment] = Field(min_length=2, max_length=2)
    transfer_stop: StopCandidate
    transfer_minutes: int
    total_duration_minutes: int
    total_fare_inr: int
    available_seats: int


class JourneySearchResponse(BaseModel):
    sort_by: JourneySort
    results: list[JourneyResult]
    connecting_results: list[ConnectingJourneyResult] = []


class ApiErrorBody(BaseModel):
    code: str
    message: str
    details: dict[str, object] = {}
