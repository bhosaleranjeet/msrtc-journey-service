from datetime import time, timedelta

import pytest

from app.integrations.msrtc.mock_provider import DEMO_DATE, MockTransportProvider
from app.repositories.transport import InMemoryTransportRepository
from app.schemas.journeys import JourneySearchRequest, JourneySort
from app.services.journey_service import JourneyDomainError, JourneyService


def _service() -> JourneyService:
    return JourneyService(MockTransportProvider())


def test_stop_search_returns_all_nashik_options() -> None:
    candidates = _service().search_stops("Nashik")
    assert [candidate.name for candidate in candidates] == ["Nashik Mahamarg", "Nashik CBS", "Nashik Road"]


def test_generic_nashik_requires_selection() -> None:
    with pytest.raises(JourneyDomainError) as error:
        _service().search_direct(JourneySearchRequest(origin="Pune", destination="Nashik", journey_date=DEMO_DATE))

    assert error.value.code == "AMBIGUOUS_STOP"
    assert error.value.details["field"] == "destination"


def test_direct_journeys_are_ranked_deterministically() -> None:
    response = _service().search_direct(
        JourneySearchRequest(
            origin="Pune",
            destination="Nashik Mahamarg",
            journey_date=DEMO_DATE,
            sort_by=JourneySort.CHEAPEST,
        )
    )
    assert [result.trip_id for result in response.results] == ["trip_pune_nashik_fast", "trip_pune_nashik_ac"]


def test_search_honours_time_and_service_preferences() -> None:
    response = _service().search_direct(
        JourneySearchRequest(
            origin="Pune",
            destination="Nashik Mahamarg",
            journey_date=DEMO_DATE,
            time_start=time(6, 0),
            time_end=time(8, 0),
            air_conditioned=True,
        )
    )
    assert [result.trip_id for result in response.results] == ["trip_pune_nashik_ac"]


def test_demo_destination_returns_a_single_valid_connection() -> None:
    response = _service().search_direct(JourneySearchRequest(origin="Pune", destination="Demo Destination", journey_date=DEMO_DATE))

    assert response.results == []
    assert len(response.connecting_results) == 1
    connection = response.connecting_results[0]
    assert [segment.trip_id for segment in connection.segments] == ["trip_pune_satara", "trip_satara_demo"]
    assert connection.transfer_stop.name == "Satara Bus Stand"
    assert connection.transfer_minutes == 45
    assert connection.total_fare_inr == 390
    assert connection.total_duration_minutes == 315


def _provider_with_transfer_wait(wait_minutes: int) -> InMemoryTransportRepository:
    provider = MockTransportProvider()
    trips = list(provider.list_trips())
    first = next(trip for trip in trips if trip.id == "trip_pune_satara")
    second_index = next(index for index, trip in enumerate(trips) if trip.id == "trip_satara_demo")
    second = trips[second_index]
    new_departure = first.arrival_at + timedelta(minutes=wait_minutes)
    trips[second_index] = second.model_copy(
        update={"departure_at": new_departure, "arrival_at": new_departure + timedelta(minutes=90)}
    )
    seats = [seat for trip in provider.list_trips() for seat in provider.list_seats(trip.id)]
    return InMemoryTransportRepository(
        stops=provider.list_stops(), routes=provider.list_routes(), services=provider.list_services(), trips=trips, seats=seats
    )


@pytest.mark.parametrize("wait_minutes", [14, 121])
def test_unreasonable_transfer_windows_are_rejected(wait_minutes: int) -> None:
    with pytest.raises(JourneyDomainError) as error:
        JourneyService(_provider_with_transfer_wait(wait_minutes)).search_direct(
            JourneySearchRequest(origin="Pune", destination="Demo Destination", journey_date=DEMO_DATE)
        )

    assert error.value.code == "NO_JOURNEY_FOUND"
