"""Typed transport concepts used by deterministic services."""

from datetime import date, datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class ServiceType(StrEnum):
    ORDINARY = "ORDINARY"
    SEMI_LUXURY = "SEMI_LUXURY"
    SHIVNERI = "SHIVNERI"
    E_SHIVAI = "E_SHIVAI"


class SeatStatus(StrEnum):
    AVAILABLE = "AVAILABLE"
    HELD = "HELD"
    BOOKED = "BOOKED"


class SeatType(StrEnum):
    WINDOW = "WINDOW"
    AISLE = "AISLE"


class Stop(BaseModel):
    id: str
    code: str
    name: str
    city: str
    aliases: tuple[str, ...] = ()
    latitude: float
    longitude: float
    description: str


class Route(BaseModel):
    id: str
    origin_stop_id: str
    destination_stop_id: str
    intermediate_stop_ids: tuple[str, ...] = ()


class Service(BaseModel):
    id: str
    name: str
    service_type: ServiceType
    route_id: str
    is_air_conditioned: bool
    fare_inr: int = Field(gt=0)
    capacity: int = Field(gt=0)
    amenities: tuple[str, ...] = ()


class TripInstance(BaseModel):
    id: str
    service_id: str
    journey_date: date
    departure_at: datetime
    arrival_at: datetime
    status: str = "SCHEDULED"


class Seat(BaseModel):
    id: str
    trip_id: str
    number: str
    status: SeatStatus
    seat_type: SeatType
