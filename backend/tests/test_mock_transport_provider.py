from app.domain.transport.models import SeatStatus
from app.integrations.msrtc.mock_provider import DEMO_DATE, MockTransportProvider


def test_demo_network_is_repeatable() -> None:
    first = MockTransportProvider()
    second = MockTransportProvider()

    assert first.list_stops() == second.list_stops()
    assert first.list_trips() == second.list_trips()
    assert all(trip.journey_date == DEMO_DATE for trip in first.list_trips())


def test_nashik_has_three_human_readable_stop_choices() -> None:
    provider = MockTransportProvider()
    nashik_stops = [stop.name for stop in provider.list_stops() if stop.city == "Nashik"]

    assert nashik_stops == ["Nashik Mahamarg", "Nashik CBS", "Nashik Road"]


def test_pune_to_nashik_has_direct_ac_and_non_ac_services() -> None:
    provider = MockTransportProvider()
    routes = {route.id: route for route in provider.list_routes()}
    services = [
        service
        for service in provider.list_services()
        if routes[service.route_id].origin_stop_id == "stop_pune_station"
        and routes[service.route_id].destination_stop_id.startswith("stop_nashik")
    ]

    assert len(services) >= 3
    assert any(service.is_air_conditioned for service in services)
    assert any(not service.is_air_conditioned for service in services)


def test_demo_connection_has_a_valid_transfer_and_stable_seats() -> None:
    provider = MockTransportProvider()
    trips = {trip.id: trip for trip in provider.list_trips()}
    transfer_minutes = int((trips["trip_satara_demo"].departure_at - trips["trip_pune_satara"].arrival_at).total_seconds() / 60)

    assert 15 <= transfer_minutes <= 120
    seats = provider.list_seats("trip_pune_nashik_ac")
    assert len(seats) == 6
    assert seats[0].status == SeatStatus.BOOKED
    assert all(seat.status == SeatStatus.AVAILABLE for seat in seats[1:])
