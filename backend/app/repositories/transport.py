"""Repository boundary for transport data.

The current provider is deliberately in-memory. A SQLite/PostgreSQL implementation can
implement the same protocol later without changing journey-domain code.
"""

from collections.abc import Iterable
from datetime import date
from typing import Protocol

from app.domain.transport.models import Route, Seat, Service, Stop, TripInstance


class TransportRepository(Protocol):
    def list_stops(self) -> tuple[Stop, ...]: ...

    def list_routes(self) -> tuple[Route, ...]: ...

    def list_services(self) -> tuple[Service, ...]: ...

    def list_trips(self) -> tuple[TripInstance, ...]: ...

    def list_seats(self, trip_id: str) -> tuple[Seat, ...]: ...

    def supported_date_range(self) -> tuple[date, date]: ...


class InMemoryTransportRepository:
    def __init__(
        self,
        *,
        stops: Iterable[Stop],
        routes: Iterable[Route],
        services: Iterable[Service],
        trips: Iterable[TripInstance],
        seats: Iterable[Seat],
    ) -> None:
        self._stops = tuple(stops)
        self._routes = tuple(routes)
        self._services = tuple(services)
        self._trips = tuple(trips)
        self._seats = tuple(seats)

    def list_stops(self) -> tuple[Stop, ...]:
        return self._stops

    def list_routes(self) -> tuple[Route, ...]:
        return self._routes

    def list_services(self) -> tuple[Service, ...]:
        return self._services

    def list_trips(self) -> tuple[TripInstance, ...]:
        return self._trips

    def list_seats(self, trip_id: str) -> tuple[Seat, ...]:
        return tuple(seat for seat in self._seats if seat.trip_id == trip_id)

    def supported_date_range(self) -> tuple[date, date]:
        dates = tuple(trip.journey_date for trip in self._trips)
        return min(dates), max(dates)
