from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import func, select

from app.domain.bookings.models import Booking
from app.integrations.payments.mock_provider import MockPaymentProvider
from app.persistence.database import Base, create_database_engine, create_session_factory
from app.persistence.models import BookingRow, StopRow, TripRow
from app.persistence.seed import active_date_window, seed_database
from app.repositories.sql import SqlBookingRepository, SqlTransportRepository
from app.repositories.sql import SqlTicketRepository
from app.schemas.bookings import PassengerRequest, TripSeatSelection
from app.schemas.journeys import JourneySearchRequest, JourneySort
from app.services.booking_service import BookingService
from app.services.journey_service import JourneyDomainError, JourneyService
from app.services.ticket_service import TicketService


@pytest.fixture()
def database(tmp_path):
    engine = create_database_engine(f"sqlite:///{tmp_path / 'network.db'}")
    Base.metadata.create_all(engine)
    sessions = create_session_factory(engine)
    seed_database(sessions)
    return sessions


def test_seed_is_idempotent_and_covers_the_curated_demo_network(database) -> None:
    with database() as session:
        first_trip_count = session.scalar(select(func.count()).select_from(TripRow))
        assert session.scalar(select(func.count()).select_from(StopRow).where(StopRow.is_major_hub.is_(True))) == 4

    seed_database(database)

    with database() as session:
        assert session.scalar(select(func.count()).select_from(TripRow)) == first_trip_count
        assert first_trip_count == 336


def test_bidirectional_search_and_date_window_error(database) -> None:
    transport = SqlTransportRepository(database)
    journeys = JourneyService(transport, SqlBookingRepository(database))
    start_date, end_date = transport.supported_date_range()

    outward = journeys.search_direct(JourneySearchRequest(origin="Mumbai", destination="Pune", journey_date=start_date))
    return_trip = journeys.search_direct(JourneySearchRequest(origin="Pune", destination="Mumbai", journey_date=start_date))
    assert len(outward.results) == 2
    assert len(return_trip.results) == 2

    with pytest.raises(JourneyDomainError) as error:
        journeys.search_direct(JourneySearchRequest(origin="Mumbai", destination="Pune", journey_date=end_date + timedelta(days=1)))
    assert error.value.code == "DATE_OUTSIDE_DEMO_WINDOW"
    assert error.value.details == {"start_date": start_date.isoformat(), "end_date": end_date.isoformat()}


def test_database_network_filters_sorts_resolves_and_connects(database) -> None:
    transport = SqlTransportRepository(database)
    journeys = JourneyService(transport, SqlBookingRepository(database))
    start_date, end_date = transport.supported_date_range()

    final_day = journeys.search_direct(
        JourneySearchRequest(
            origin="Mumbai",
            destination="Pune",
            journey_date=end_date,
            air_conditioned=True,
            sort_by=JourneySort.CHEAPEST,
        )
    )
    assert final_day.results
    assert all(result.is_air_conditioned for result in final_day.results)
    assert [result.fare_inr for result in final_day.results] == sorted(result.fare_inr for result in final_day.results)
    assert len(journeys.search_stops("Nashik")) == 3

    with pytest.raises(JourneyDomainError) as ambiguous:
        journeys.search_direct(JourneySearchRequest(origin="Pune", destination="Nashik", journey_date=start_date))
    assert ambiguous.value.code == "AMBIGUOUS_STOP"

    connection = journeys.search_direct(
        JourneySearchRequest(origin="Pune", destination="Demo Destination", journey_date=start_date)
    )
    assert not connection.results
    assert len(connection.connecting_results) == 1
    assert len(connection.connecting_results[0].segments) == 2

    with pytest.raises(JourneyDomainError) as unsupported:
        journeys.search_direct(JourneySearchRequest(origin="Mumbai", destination="Demo Destination", journey_date=start_date))
    assert unsupported.value.code == "NO_JOURNEY_FOUND"


def test_booking_and_inventory_survive_repository_recreation(database) -> None:
    transport = SqlTransportRepository(database)
    bookings = SqlBookingRepository(database)
    service = BookingService(transport, bookings, MockPaymentProvider())
    start_date, _ = active_date_window()
    journey = JourneyService(transport, bookings).search_direct(
        JourneySearchRequest(origin="Pune", destination="Nashik Mahamarg", journey_date=start_date)
    ).results[0]

    created = service.create(journey.trip_id)
    held = service.select_seats(created.id, ["2"])
    service.add_passenger(held.id, PassengerRequest(name="Prototype Passenger", age=30, concession_type="NONE"))
    service.begin_payment(held.id, False)
    confirmed = service.confirm(held.id)
    assert confirmed.status == "CONFIRMED"

    reopened = SqlBookingRepository(database).get(created.id)
    assert reopened is not None
    assert reopened.status == "CONFIRMED"
    assert len(reopened.selected_seat_ids) == 1
    assert SqlBookingRepository(database).is_booked(reopened.selected_seat_ids[0])


def test_competing_holds_return_one_conflict(database) -> None:
    transport = SqlTransportRepository(database)
    bookings = SqlBookingRepository(database)
    start_date, _ = transport.supported_date_range()
    journey = JourneyService(transport, bookings).search_direct(
        JourneySearchRequest(origin="Pune", destination="Mumbai", journey_date=start_date)
    ).results[0]
    first = Booking(id="booking_competitor_one", trip_id=journey.trip_id, created_at=datetime.now(UTC))
    second = Booking(id="booking_competitor_two", trip_id=journey.trip_id, created_at=datetime.now(UTC))
    bookings.create(first)
    bookings.create(second)
    seat_id = next(seat.id for seat in transport.list_seats(journey.trip_id) if seat.number == "2")
    expires_at = datetime.now(UTC) + timedelta(minutes=10)
    first.hold_seats((seat_id,), expires_at)
    second.hold_seats((seat_id,), expires_at)

    with ThreadPoolExecutor(max_workers=2) as executor:
        outcomes = list(executor.map(lambda booking: SqlBookingRepository(database).try_hold_seats(booking, (seat_id,), expires_at), (first, second)))

    assert sorted(outcomes) == [False, True]


def test_ticket_cancellation_and_refund_reopen_from_sql(database) -> None:
    transport = SqlTransportRepository(database)
    repository = SqlBookingRepository(database)
    booking_service = BookingService(transport, repository, MockPaymentProvider())
    start_date, _ = transport.supported_date_range()
    journey = JourneyService(transport, repository).search_direct(
        JourneySearchRequest(origin="Mumbai", destination="Pune", journey_date=start_date)
    ).results[0]
    booking_id = booking_service.create(journey.trip_id).id
    booking_service.select_seats(booking_id, ["2"])
    booking_service.add_passenger(booking_id, PassengerRequest(name="Demo Rider", age=62, concession_type="SENIOR"))
    booking_service.begin_payment(booking_id, False)
    booking_service.confirm(booking_id)

    first_pass = TicketService(transport, SqlTicketRepository(database)).issue(booking_service.aggregate(booking_id))
    reopened_pass = TicketService(transport, SqlTicketRepository(database)).issue(
        BookingService(transport, SqlBookingRepository(database), MockPaymentProvider()).aggregate(booking_id)
    )
    assert reopened_pass.ticket_number == first_pass.ticket_number

    cancelled = booking_service.cancel(booking_id)
    assert cancelled.status == "CANCELLED"
    booking_service.advance_refund(booking_id)
    completed = booking_service.advance_refund(booking_id)
    assert completed.refund_status == "COMPLETED"
    assert SqlBookingRepository(database).get(booking_id).status == "CANCELLED"


def test_expired_hold_and_terminal_confirmation_failure_release_inventory(database) -> None:
    transport = SqlTransportRepository(database)
    repository = SqlBookingRepository(database)
    start_date, _ = transport.supported_date_range()
    journey = JourneyService(transport, repository).search_direct(
        JourneySearchRequest(origin="Pune", destination="Nashik Mahamarg", journey_date=start_date)
    ).results[0]

    expired = Booking(id="booking_expired_sql", trip_id=journey.trip_id, created_at=datetime.now(UTC))
    repository.create(expired)
    seat_id = next(seat.id for seat in transport.list_seats(journey.trip_id) if seat.number == "2")
    past = datetime.now(UTC) - timedelta(minutes=1)
    expired.hold_seats((seat_id,), past)
    assert repository.try_hold_seats(expired, (seat_id,), past)
    repository.expire_holds(datetime.now(UTC))
    assert repository.holder_for(seat_id) is None
    assert repository.get(expired.id).status == "DRAFT"

    service = BookingService(transport, repository, MockPaymentProvider())
    booking_id = service.create(journey.trip_id).id
    service.select_seats(booking_id, ["2"])
    service.add_passenger(booking_id, PassengerRequest(name="Recovery Demo", age=30, concession_type="NONE"))
    service.begin_payment(booking_id, True)
    failed = service.confirm(booking_id)
    assert failed.status == "FAILED"
    assert failed.refund_status == "PENDING"
    assert repository.holder_for(seat_id) is None
    assert not repository.is_booked(seat_id)


def test_connected_booking_and_both_ticket_legs_survive_repository_recreation(database) -> None:
    transport = SqlTransportRepository(database)
    repository = SqlBookingRepository(database)
    booking_service = BookingService(transport, repository, MockPaymentProvider())
    start_date, _ = transport.supported_date_range()
    connection = JourneyService(transport, repository).search_direct(
        JourneySearchRequest(origin="Pune", destination="Demo Destination", journey_date=start_date)
    ).connecting_results[0]
    trip_ids = tuple(segment.trip_id for segment in connection.segments)
    booking = booking_service.create(trip_ids[0], trip_ids)
    booking_service.select_seats(
        booking.id,
        seat_selections=[
            TripSeatSelection(trip_id=trip_ids[0], seat_number="2"),
            TripSeatSelection(trip_id=trip_ids[1], seat_number="4"),
        ],
    )
    booking_service.add_passenger(booking.id, PassengerRequest(name="Connected Passenger", age=30))
    booking_service.begin_payment(booking.id, False)
    booking_service.confirm(booking.id)

    reopened = BookingService(transport, SqlBookingRepository(database), MockPaymentProvider()).aggregate(booking.id)
    journey_pass = TicketService(transport, SqlTicketRepository(database)).issue(reopened)

    assert reopened.trip_ids == trip_ids
    assert [leg.seat_numbers for leg in journey_pass.legs] == [["2"], ["4"]]
    assert journey_pass.destination == "Demo Destination"
