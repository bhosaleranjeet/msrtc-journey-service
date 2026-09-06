import pytest
from pydantic import ValidationError

from app.integrations.msrtc.mock_provider import MockTransportProvider
from app.integrations.payments.mock_provider import MockPaymentProvider
from app.repositories.bookings import InMemoryBookingRepository
from app.repositories.tickets import InMemoryTicketRepository
from app.schemas.aftercare import ComplaintRequest, ManualComplaintRequest
from app.schemas.bookings import PassengerRequest, TripSeatSelection
from app.services.aftercare_service import AftercareService
from app.services.booking_service import BookingService
from app.services.journey_service import JourneyDomainError
from app.services.ticket_service import TicketService


def _confirmed_aftercare() -> tuple[AftercareService, str]:
    transport = MockTransportProvider()
    bookings = BookingService(transport, InMemoryBookingRepository(), MockPaymentProvider())
    tickets = TicketService(transport, InMemoryTicketRepository())
    booking = bookings.create("trip_pune_satara", ("trip_pune_satara", "trip_satara_demo"))
    bookings.select_seats(
        booking.id,
        seat_selections=(
            TripSeatSelection(trip_id="trip_pune_satara", seat_number="2"),
            TripSeatSelection(trip_id="trip_satara_demo", seat_number="4"),
        ),
    )
    bookings.add_passenger(booking.id, PassengerRequest(name="Demo Passenger", age=30))
    bookings.begin_payment(booking.id, confirmation_should_fail=False)
    bookings.confirm(booking.id)
    return AftercareService(bookings, tickets, transport), booking.id


@pytest.mark.parametrize(
    ("state", "has_bus", "has_position"),
    [
        ("BUS_NOT_ASSIGNED", False, False),
        ("BUS_ASSIGNED", True, False),
        ("TRACKING_AVAILABLE", True, False),
        ("TRIP_STARTED", True, True),
        ("LOCATION_STALE", True, True),
        ("TRIP_COMPLETED", True, False),
    ],
)
def test_every_tracking_demo_state_is_explicit_and_deterministic(state: str, has_bus: bool, has_position: bool) -> None:
    aftercare, booking_id = _confirmed_aftercare()

    tracking = aftercare.tracking(booking_id, state)

    assert (tracking.bus_number is not None) is has_bus
    assert (tracking.position is not None) is has_position
    assert tracking.is_synthetic is True
    assert tracking.destination == "Demo Destination"


def test_tracking_rejects_unknown_demo_state() -> None:
    aftercare, booking_id = _confirmed_aftercare()
    with pytest.raises(JourneyDomainError) as error:
        aftercare.tracking(booking_id, "FLYING")
    assert error.value.code == "INVALID_TRACKING_STATE"


def test_complaint_is_linked_to_ticket_and_can_be_reopened() -> None:
    aftercare, booking_id = _confirmed_aftercare()

    complaint = aftercare.submit_complaint(
        booking_id,
        ComplaintRequest(
            category="BUS CONDITION",
            subcategory="Broken seat",
            photo_name="seat.jpg",
            photo_content_type="image/jpeg",
            photo_size_bytes=1024,
        ),
    )

    assert complaint.reference.startswith("CMP-2026-")
    assert complaint.ticket_number.startswith("MSRTC-")
    assert complaint.journey == "Pune Station → Demo Destination"
    assert complaint.photo_name == "seat.jpg"
    assert complaint.photo_content_type == "image/jpeg"
    assert complaint.photo_size_bytes == 1024
    assert aftercare.get_complaint(complaint.reference) == complaint


def test_manual_complaint_supports_an_offline_journey_without_a_ticket_number() -> None:
    aftercare, _ = _confirmed_aftercare()

    complaint = aftercare.submit_manual_complaint(
        ManualComplaintRequest(
            origin="Pune Station", destination="Nashik CBS", journey_date="2026-09-07",
            category="STAFF", subcategory="Conductor behaviour",
        )
    )

    assert complaint.booking_id is None
    assert complaint.ticket_number is None
    assert complaint.journey == "Pune Station → Nashik CBS"
    assert aftercare.get_complaint(complaint.reference) == complaint


def test_complaint_rejects_an_unknown_booking_or_reference() -> None:
    aftercare, _ = _confirmed_aftercare()
    request = ComplaintRequest(category="BUS CONDITION", subcategory="Broken seat")

    with pytest.raises(JourneyDomainError) as booking_error:
        aftercare.submit_complaint("booking_missing", request)
    assert booking_error.value.code == "BOOKING_NOT_FOUND"

    with pytest.raises(JourneyDomainError) as reference_error:
        aftercare.get_complaint("CMP-2026-MISSING")
    assert reference_error.value.code == "COMPLAINT_NOT_FOUND"


def test_complaint_issue_must_belong_to_selected_category() -> None:
    with pytest.raises(ValidationError):
        ComplaintRequest(category="STAFF", subcategory="Broken seat")


@pytest.mark.parametrize(
    "photo_fields",
    [
        {"photo_name": "notes.txt", "photo_content_type": "text/plain", "photo_size_bytes": 20},
        {"photo_name": "seat.jpg"},
        {"photo_name": "seat.jpg", "photo_content_type": "image/jpeg", "photo_size_bytes": 5_000_001},
    ],
)
def test_complaint_photo_metadata_must_describe_a_supported_image(photo_fields: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        ComplaintRequest(category="BUS CONDITION", subcategory="Broken seat", **photo_fields)
