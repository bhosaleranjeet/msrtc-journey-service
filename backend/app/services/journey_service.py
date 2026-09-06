from dataclasses import dataclass

from app.domain.transport.models import Route, SeatStatus, Service, Stop, TripInstance
from app.repositories.transport import TransportRepository
from app.repositories.bookings import BookingRepository
from app.schemas.journeys import (
    ConnectingJourneyResult,
    JourneyResult,
    JourneySearchRequest,
    JourneySearchResponse,
    JourneySegment,
    JourneySort,
    StopCandidate,
)

MIN_TRANSFER_MINUTES = 15
MAX_TRANSFER_MINUTES = 120


@dataclass
class JourneyDomainError(Exception):
    code: str
    message: str
    details: dict[str, object]
    status_code: int


def _normalise(value: str) -> str:
    return " ".join(value.casefold().split())


def _candidate(stop: Stop) -> StopCandidate:
    return StopCandidate(id=stop.id, name=stop.name, city=stop.city, description=stop.description)


class JourneyService:
    def __init__(self, repository: TransportRepository, bookings: BookingRepository | None = None) -> None:
        self._repository = repository
        self._bookings = bookings

    def search_stops(self, query: str) -> list[StopCandidate]:
        needle = _normalise(query)
        if not needle:
            return []
        return [
            _candidate(stop)
            for stop in self._repository.list_stops()
            if needle in _normalise(stop.name)
            or needle in _normalise(stop.city)
            or any(needle in _normalise(alias) for alias in stop.aliases)
        ]

    def search_direct(self, request: JourneySearchRequest) -> JourneySearchResponse:
        """Return direct journeys first; otherwise offer a single deterministic connection."""
        self._validate_request(request)
        origin = self._resolve_stop(request.origin, "origin")
        destination = self._resolve_stop(request.destination, "destination")
        if origin.id == destination.id:
            raise JourneyDomainError("INVALID_JOURNEY_QUERY", "Choose different boarding and destination stops.", {}, 422)

        routes = {route.id: route for route in self._repository.list_routes()}
        services = {service.id: service for service in self._repository.list_services()}
        stops = {stop.id: stop for stop in self._repository.list_stops()}
        trips = tuple(trip for trip in self._repository.list_trips() if trip.journey_date == request.journey_date)

        direct_results = self._find_direct(origin, destination, trips, routes, services, request)
        if direct_results:
            return JourneySearchResponse(sort_by=request.sort_by, results=self._rank_direct(direct_results, request.sort_by, request.air_conditioned))

        connecting_results = self._find_connections(origin, destination, trips, routes, services, stops, request)
        if connecting_results:
            return JourneySearchResponse(
                sort_by=request.sort_by,
                results=[],
                connecting_results=self._rank_connections(connecting_results, request.sort_by)[:3],
            )
        raise JourneyDomainError(
            "NO_JOURNEY_FOUND",
            "No direct or suitable connecting service matches this search. Try another stop, time, or date.",
            {"origin": origin.id, "destination": destination.id},
            404,
        )

    def _find_direct(
        self, origin: Stop, destination: Stop, trips: tuple[TripInstance, ...], routes: dict[str, Route], services: dict[str, Service], request: JourneySearchRequest
    ) -> list[JourneyResult]:
        results: list[JourneyResult] = []
        for trip in trips:
            service = services[trip.service_id]
            route = routes[service.route_id]
            if route.origin_stop_id != origin.id or route.destination_stop_id != destination.id or not self._matches_preferences(trip, service, request):
                continue
            segment = self._segment(trip, service, origin, destination)
            results.append(JourneyResult(id=f"journey_{trip.id}", total_seats=service.capacity, **segment.model_dump()))
        return results

    def _find_connections(
        self,
        origin: Stop,
        destination: Stop,
        trips: tuple[TripInstance, ...],
        routes: dict[str, Route],
        services: dict[str, Service],
        stops: dict[str, Stop],
        request: JourneySearchRequest,
    ) -> list[ConnectingJourneyResult]:
        outgoing = [
            trip for trip in trips
            if routes[services[trip.service_id].route_id].origin_stop_id == origin.id
            and self._matches_preferences(trip, services[trip.service_id], request)
        ]
        incoming = [
            trip for trip in trips
            if routes[services[trip.service_id].route_id].destination_stop_id == destination.id
            and self._matches_preferences(trip, services[trip.service_id], request, apply_time_filter=False)
        ]
        results: list[ConnectingJourneyResult] = []
        for first_trip in outgoing:
            first_service = services[first_trip.service_id]
            first_route = routes[first_service.route_id]
            transfer_stop = stops[first_route.destination_stop_id]
            for second_trip in incoming:
                second_service = services[second_trip.service_id]
                second_route = routes[second_service.route_id]
                if second_route.origin_stop_id != transfer_stop.id:
                    continue
                transfer_minutes = int((second_trip.departure_at - first_trip.arrival_at).total_seconds() / 60)
                if not MIN_TRANSFER_MINUTES <= transfer_minutes <= MAX_TRANSFER_MINUTES:
                    continue
                first_segment = self._segment(first_trip, first_service, origin, transfer_stop)
                second_segment = self._segment(second_trip, second_service, transfer_stop, destination)
                results.append(
                    ConnectingJourneyResult(
                        id=f"connection_{first_trip.id}_{second_trip.id}",
                        segments=[first_segment, second_segment],
                        transfer_stop=_candidate(transfer_stop),
                        transfer_minutes=transfer_minutes,
                        total_duration_minutes=int((second_trip.arrival_at - first_trip.departure_at).total_seconds() / 60),
                        total_fare_inr=first_service.fare_inr + second_service.fare_inr,
                        available_seats=min(first_segment.available_seats, second_segment.available_seats),
                    )
                )
        return results

    def _matches_preferences(self, trip: TripInstance, service: Service, request: JourneySearchRequest, *, apply_time_filter: bool = True) -> bool:
        available_seats = self._available_seats(trip.id)
        return not (
            available_seats == 0
            or (apply_time_filter and request.time_start is not None and trip.departure_at.time() < request.time_start)
            or (apply_time_filter and request.time_end is not None and trip.departure_at.time() > request.time_end)
            or (request.air_conditioned is not None and service.is_air_conditioned != request.air_conditioned)
        )

    def _segment(self, trip: TripInstance, service: Service, origin: Stop, destination: Stop) -> JourneySegment:
        return JourneySegment(
            trip_id=trip.id,
            service_name=service.name,
            service_type=service.service_type.value.replace("_", " ").title(),
            is_air_conditioned=service.is_air_conditioned,
            departure_at=trip.departure_at,
            arrival_at=trip.arrival_at,
            duration_minutes=int((trip.arrival_at - trip.departure_at).total_seconds() / 60),
            fare_inr=service.fare_inr,
            available_seats=self._available_seats(trip.id),
            origin=_candidate(origin),
            destination=_candidate(destination),
        )

    def _available_seats(self, trip_id: str) -> int:
        return sum(
            seat.status == SeatStatus.AVAILABLE
            and not (self._bookings and (self._bookings.is_booked(seat.id) or self._bookings.holder_for(seat.id)))
            for seat in self._repository.list_seats(trip_id)
        )

    @staticmethod
    def _rank_direct(results: list[JourneyResult], sort_by: JourneySort, air_conditioned: bool | None) -> list[JourneyResult]:
        if sort_by == JourneySort.CHEAPEST:
            key = lambda item: (item.fare_inr, item.duration_minutes, item.departure_at, item.trip_id)
        elif sort_by == JourneySort.FASTEST:
            key = lambda item: (item.duration_minutes, item.fare_inr, item.departure_at, item.trip_id)
        elif sort_by == JourneySort.EARLIEST:
            key = lambda item: (item.departure_at, item.duration_minutes, item.fare_inr, item.trip_id)
        else:
            key = lambda item: (0 if air_conditioned is None or item.is_air_conditioned == air_conditioned else 1, item.duration_minutes, item.fare_inr, item.departure_at, item.trip_id)
        return sorted(results, key=key)

    @staticmethod
    def _rank_connections(results: list[ConnectingJourneyResult], sort_by: JourneySort) -> list[ConnectingJourneyResult]:
        if sort_by == JourneySort.CHEAPEST:
            key = lambda item: (item.total_fare_inr, item.total_duration_minutes, item.segments[0].departure_at, item.id)
        elif sort_by == JourneySort.FASTEST:
            key = lambda item: (item.total_duration_minutes, item.total_fare_inr, item.segments[0].departure_at, item.id)
        else:
            key = lambda item: (item.segments[0].departure_at, item.total_duration_minutes, item.total_fare_inr, item.id)
        return sorted(results, key=key)

    def _validate_request(self, request: JourneySearchRequest) -> None:
        start_date, end_date = self._repository.supported_date_range()
        if not start_date <= request.journey_date <= end_date:
            raise JourneyDomainError(
                "DATE_OUTSIDE_DEMO_WINDOW",
                f"Choose a date from {start_date.isoformat()} to {end_date.isoformat()} for this prototype network.",
                {"start_date": start_date.isoformat(), "end_date": end_date.isoformat()},
                422,
            )
        if request.time_start and request.time_end and request.time_start > request.time_end:
            raise JourneyDomainError("INVALID_JOURNEY_QUERY", "The end of the time window must be after its start.", {}, 422)

    def _resolve_stop(self, value: str, field: str) -> Stop:
        normalised = _normalise(value)
        exact_matches = [
            stop for stop in self._repository.list_stops()
            if normalised == stop.id or normalised == _normalise(stop.name) or normalised in {_normalise(alias) for alias in stop.aliases}
        ]
        if not exact_matches:
            raise JourneyDomainError("STOP_NOT_FOUND", f"We could not find the {field} stop.", {"field": field, "query": value}, 404)
        if len(exact_matches) > 1:
            raise JourneyDomainError(
                "AMBIGUOUS_STOP", f"Choose which {value} stop you mean.",
                {"field": field, "query": value, "candidates": [_candidate(stop).model_dump() for stop in exact_matches]}, 409,
            )
        return exact_matches[0]
