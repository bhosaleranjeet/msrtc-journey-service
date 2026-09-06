from datetime import UTC, datetime, timedelta

import pytest

from app.integrations.msrtc.mock_provider import DEMO_DATE, MockTransportProvider
from app.integrations.payments.mock_provider import MockPaymentProvider
from app.repositories.bookings import InMemoryBookingRepository
from app.repositories.tickets import InMemoryTicketRepository
from app.schemas.bookings import PassengerRequest, TripSeatSelection
from app.services.booking_service import BookingService
from app.services.journey_service import JourneyDomainError
from app.services.ticket_service import TicketService


class Clock:
    def __init__(self, now: datetime) -> None:
        self.now = now

    def __call__(self) -> datetime:
        return self.now


def _services(clock: Clock) -> tuple[BookingService, TicketService]:
    transport = MockTransportProvider()
    bookings = InMemoryBookingRepository()
    return (
        BookingService(transport, bookings, MockPaymentProvider(), clock),
        TicketService(transport, InMemoryTicketRepository(), clock),
    )


def _confirmed_booking(bookings: BookingService):
    booking = bookings.create("trip_pune_nashik_ac")
    bookings.select_seats(booking.id, ["2"])
    bookings.add_passenger(booking.id, PassengerRequest(name="Asha Patil", age=30))
    bookings.begin_payment(booking.id, confirmation_should_fail=False)
    bookings.confirm(booking.id)
    return bookings.aggregate(booking.id)


def test_ticket_requires_confirmation_and_contains_journey_information() -> None:
    clock = Clock(datetime.combine(DEMO_DATE - timedelta(days=1), datetime.min.time(), tzinfo=UTC).replace(hour=8))
    bookings, tickets = _services(clock)
    draft = bookings.aggregate(bookings.create("trip_pune_nashik_ac").id)
    with pytest.raises(JourneyDomainError) as error:
        tickets.issue(draft)
    assert error.value.code == "TICKET_NOT_AVAILABLE"

    journey_pass = tickets.issue(_confirmed_booking(bookings))
    assert journey_pass.boarding_point == "Pune Station"
    assert journey_pass.destination == "Nashik Mahamarg"
    assert journey_pass.seat_numbers == ["2"]
    assert journey_pass.qr_payload.startswith("mock:booking:")


def test_cancellation_preview_calculates_refund_and_releases_booking() -> None:
    clock = Clock(datetime.combine(DEMO_DATE - timedelta(days=1), datetime.min.time(), tzinfo=UTC).replace(hour=8))
    bookings, _ = _services(clock)
    confirmed = _confirmed_booking(bookings)
    preview = bookings.cancellation_preview(confirmed.id)
    assert preview.can_cancel is True
    assert (preview.deduction_inr, preview.non_refundable_charges_inr, preview.refund_amount_inr) == (52, 10, 458)

    cancelled = bookings.cancel(confirmed.id)
    assert cancelled.status == "CANCELLED"
    assert cancelled.refund_status == "PENDING"
    assert bookings.advance_refund(confirmed.id).refund_status == "PROCESSING"
    assert bookings.advance_refund(confirmed.id).refund_status == "COMPLETED"


def test_cancellation_deadline_is_enforced() -> None:
    clock = Clock(datetime.combine(DEMO_DATE, datetime.min.time(), tzinfo=UTC).replace(hour=5))
    bookings, _ = _services(clock)
    confirmed = _confirmed_booking(bookings)
    preview = bookings.cancellation_preview(confirmed.id)

    assert preview.can_cancel is False
    assert preview.reason == "The cancellation deadline has passed."


def test_connected_ticket_contains_both_services_and_independent_seats() -> None:
    clock = Clock(datetime.combine(DEMO_DATE - timedelta(days=1), datetime.min.time(), tzinfo=UTC).replace(hour=8))
    bookings, tickets = _services(clock)
    booking = bookings.create("trip_pune_satara", ("trip_pune_satara", "trip_satara_demo"))
    bookings.select_seats(
        booking.id,
        seat_selections=[
            TripSeatSelection(trip_id="trip_pune_satara", seat_number="2"),
            TripSeatSelection(trip_id="trip_satara_demo", seat_number="4"),
        ],
    )
    bookings.add_passenger(booking.id, PassengerRequest(name="Asha Patil", age=30))
    bookings.begin_payment(booking.id, confirmation_should_fail=False)
    bookings.confirm(booking.id)

    journey_pass = tickets.issue(bookings.aggregate(booking.id))

    assert journey_pass.destination == "Demo Destination"
    assert [leg.seat_numbers for leg in journey_pass.legs] == [["2"], ["4"]]
    assert [(leg.boarding_point, leg.destination) for leg in journey_pass.legs] == [
        ("Pune Station", "Satara Bus Stand"),
        ("Satara Bus Stand", "Demo Destination"),
    ]

    bookings.cancel(booking.id)
    replacement = bookings.create("trip_pune_satara", ("trip_pune_satara", "trip_satara_demo"))
    reopened = bookings.select_seats(
        replacement.id,
        seat_selections=[
            TripSeatSelection(trip_id="trip_pune_satara", seat_number="2"),
            TripSeatSelection(trip_id="trip_satara_demo", seat_number="4"),
        ],
    )
    selected_by_trip = {
        group.trip_id: [seat.number for seat in group.seats if seat.held_by_current_booking]
        for group in reopened.seat_groups
    }
    assert selected_by_trip == {"trip_pune_satara": ["2"], "trip_satara_demo": ["4"]}


def test_existing_ticket_remains_available_after_cancellation() -> None:
    clock = Clock(datetime.combine(DEMO_DATE - timedelta(days=1), datetime.min.time(), tzinfo=UTC).replace(hour=8))
    bookings, tickets = _services(clock)
    confirmed = _confirmed_booking(bookings)
    original = tickets.issue(confirmed)

    bookings.cancel(confirmed.id)
    reopened = tickets.issue(bookings.aggregate(confirmed.id))

    assert reopened.ticket_number == original.ticket_number
