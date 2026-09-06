from datetime import UTC, datetime, timedelta

import pytest

from app.integrations.msrtc.mock_provider import MockTransportProvider
from app.integrations.payments.mock_provider import MockPaymentProvider
from app.repositories.bookings import InMemoryBookingRepository
from app.services.booking_service import BookingService
from app.services.journey_service import JourneyDomainError
from app.schemas.bookings import PassengerRequest, TripSeatSelection


class Clock:
    def __init__(self) -> None:
        self.now = datetime(2026, 8, 23, 8, 0, tzinfo=UTC)

    def __call__(self) -> datetime:
        return self.now


def _service(clock: Clock) -> BookingService:
    return BookingService(MockTransportProvider(), InMemoryBookingRepository(), MockPaymentProvider(), clock)


def test_available_seat_is_held_and_not_available_to_another_booking() -> None:
    service = _service(Clock())
    first = service.create("trip_pune_nashik_ac")
    held = service.select_seats(first.id, ["2"])
    second = service.create("trip_pune_nashik_ac")

    assert held.status == "SEATS_HELD"
    assert next(seat for seat in held.seats if seat.number == "2").held_by_current_booking
    with pytest.raises(JourneyDomainError) as error:
        service.select_seats(second.id, ["2"])
    assert error.value.code == "SEAT_UNAVAILABLE"


def test_expired_hold_returns_seat_to_available() -> None:
    clock = Clock()
    service = _service(clock)
    first = service.create("trip_pune_nashik_ac")
    service.select_seats(first.id, ["2"])
    clock.now += timedelta(minutes=11)
    second = service.create("trip_pune_nashik_ac")

    selected = service.select_seats(second.id, ["2"])
    assert selected.status == "SEATS_HELD"
    assert next(seat for seat in selected.seats if seat.number == "2").held_by_current_booking


def test_unknown_or_booked_seats_return_machine_readable_errors() -> None:
    service = _service(Clock())
    booking = service.create("trip_pune_nashik_ac")
    with pytest.raises(JourneyDomainError) as error:
        service.select_seats(booking.id, ["1"])
    assert error.value.code == "SEAT_UNAVAILABLE"


def _booking_ready_for_payment(service: BookingService):
    booking = service.create("trip_pune_nashik_ac")
    service.select_seats(booking.id, ["2"])
    return service.add_passenger(booking.id, PassengerRequest(name="Asha Patil", age=65, concession_type="SENIOR"))


def test_payment_receipt_does_not_confirm_booking_and_mock_concession_is_calculated() -> None:
    service = _service(Clock())
    passenger_booking = _booking_ready_for_payment(service)
    paid = service.begin_payment(passenger_booking.id, confirmation_should_fail=False)

    assert passenger_booking.base_fare_inr == 520
    assert passenger_booking.concession_discount_inr == 104
    assert paid.status == "PAYMENT_RECEIVED"
    assert paid.payment_status == "RECEIVED"
    assert paid.payment_reference is not None
    assert paid.status != "CONFIRMED"


def test_confirmation_failure_after_successful_payment_starts_refund() -> None:
    service = _service(Clock())
    passenger_booking = _booking_ready_for_payment(service)
    service.begin_payment(passenger_booking.id, confirmation_should_fail=True)
    failed = service.confirm(passenger_booking.id)

    assert failed.status == "FAILED"
    assert failed.payment_status == "RECEIVED"
    assert failed.refund_status == "PENDING"
    assert next(seat for seat in failed.seats if seat.number == "2").status == "AVAILABLE"
    replacement_booking = service.create("trip_pune_nashik_ac")
    replacement_hold = service.select_seats(replacement_booking.id, ["2"])
    assert next(seat for seat in replacement_hold.seats if seat.number == "2").held_by_current_booking


def test_confirmed_booking_projects_selected_seat_as_booked() -> None:
    service = _service(Clock())
    passenger_booking = _booking_ready_for_payment(service)
    service.begin_payment(passenger_booking.id, confirmation_should_fail=False)
    confirmed = service.confirm(passenger_booking.id)

    assert confirmed.status == "CONFIRMED"
    assert next(seat for seat in confirmed.seats if seat.number == "2").status == "BOOKED"
    refreshed_booking = service.create("trip_pune_nashik_ac")
    assert next(seat for seat in refreshed_booking.seats if seat.number == "2").status == "BOOKED"


def test_invalid_payment_transition_is_rejected() -> None:
    service = _service(Clock())
    booking = service.create("trip_pune_nashik_ac")

    with pytest.raises(JourneyDomainError) as error:
        service.begin_payment(booking.id, confirmation_should_fail=False)
    assert error.value.code == "INVALID_BOOKING_STATE"


def test_connected_booking_holds_matching_inventory_and_combines_fares() -> None:
    service = _service(Clock())
    booking = service.create("trip_pune_satara", ("trip_pune_satara", "trip_satara_demo"))
    held = service.select_seats(
        booking.id,
        seat_selections=[
            TripSeatSelection(trip_id="trip_pune_satara", seat_number="2"),
            TripSeatSelection(trip_id="trip_satara_demo", seat_number="4"),
        ],
    )
    priced = service.add_passenger(booking.id, PassengerRequest(name="Asha Patil", age=32, concession_type="NONE"))

    assert held.trip_ids == ["trip_pune_satara", "trip_satara_demo"]
    assert priced.base_fare_inr == 390


def test_connected_booking_accepts_a_different_seat_for_each_bus() -> None:
    service = _service(Clock())
    booking = service.create("trip_pune_satara", ("trip_pune_satara", "trip_satara_demo"))

    held = service.select_seats(
        booking.id,
        seat_selections=[
            TripSeatSelection(trip_id="trip_pune_satara", seat_number="2"),
            TripSeatSelection(trip_id="trip_satara_demo", seat_number="3"),
        ],
    )

    assert held.status == "SEATS_HELD"
    assert [group.seats[1].held_by_current_booking for group in held.seat_groups] == [True, False]
    assert held.seat_groups[1].seats[2].held_by_current_booking


def test_connected_booking_rejects_one_legacy_seat_for_both_buses() -> None:
    service = _service(Clock())
    booking = service.create("trip_pune_satara", ("trip_pune_satara", "trip_satara_demo"))

    with pytest.raises(JourneyDomainError) as error:
        service.select_seats(booking.id, ["2"])

    assert error.value.code == "INVALID_SEAT_SELECTION"


def test_booking_rejects_known_trips_that_do_not_form_a_connection() -> None:
    service = _service(Clock())

    with pytest.raises(JourneyDomainError) as error:
        service.create("trip_pune_nashik_ac", ("trip_pune_nashik_ac", "trip_satara_demo"))

    assert error.value.code == "INVALID_CONNECTION"
