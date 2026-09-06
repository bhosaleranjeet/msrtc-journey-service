from datetime import UTC, datetime
from uuid import uuid4

from app.schemas.aftercare import ComplaintRequest, ComplaintResponse, ComplaintStatus, ManualComplaintRequest, TrackingResponse
from app.services.booking_service import BookingService
from app.services.journey_service import JourneyDomainError
from app.services.ticket_service import TicketService
from app.repositories.transport import TransportRepository


class AftercareService:
    """Customer-facing synthetic aftercare; no MSRTC integration is implied."""
    def __init__(self, bookings: BookingService, tickets: TicketService, transport: TransportRepository) -> None:
        self._bookings, self._tickets, self._transport = bookings, tickets, transport
        self._complaints: dict[str, ComplaintResponse] = {}

    def submit_complaint(self, booking_id: str, request: ComplaintRequest) -> ComplaintResponse:
        booking = self._bookings.aggregate(booking_id)
        ticket = self._tickets.issue(booking)
        response = ComplaintResponse(
            reference=f"CMP-2026-{uuid4().hex[:6].upper()}", booking_id=booking_id, ticket_number=ticket.ticket_number,
            journey=f"{ticket.boarding_point} → {ticket.destination}", category=request.category, subcategory=request.subcategory,
            status=ComplaintStatus.SUBMITTED, photo_name=request.photo_name,
            photo_content_type=request.photo_content_type, photo_size_bytes=request.photo_size_bytes,
            submitted_at=datetime.now(UTC),
        )
        self._complaints[response.reference] = response
        return response

    def submit_manual_complaint(self, request: ManualComplaintRequest) -> ComplaintResponse:
        response = ComplaintResponse(
            reference=f"CMP-2026-{uuid4().hex[:6].upper()}", ticket_number=request.ticket_number or None,
            journey=f"{request.origin.strip()} → {request.destination.strip()}", category=request.category,
            subcategory=request.subcategory, status=ComplaintStatus.SUBMITTED, photo_name=request.photo_name,
            photo_content_type=request.photo_content_type, photo_size_bytes=request.photo_size_bytes,
            submitted_at=datetime.now(UTC),
        )
        self._complaints[response.reference] = response
        return response

    def get_complaint(self, reference: str) -> ComplaintResponse:
        complaint = self._complaints.get(reference)
        if not complaint:
            raise JourneyDomainError("COMPLAINT_NOT_FOUND", "We could not find this simulated complaint reference.", {}, 404)
        return complaint

    def tracking(self, booking_id: str, demo_state: str | None = None) -> TrackingResponse:
        booking = self._bookings.aggregate(booking_id)
        ticket = self._tickets.issue(booking)
        # A confirmed prototype booking opens on the most useful passenger state.
        # The UI can deliberately request every other state for reviewer testing.
        state = demo_state or "TRIP_STARTED"
        if state not in {"BUS_NOT_ASSIGNED", "BUS_ASSIGNED", "TRACKING_AVAILABLE", "TRIP_STARTED", "TRIP_COMPLETED", "LOCATION_STALE"}:
            raise JourneyDomainError("INVALID_TRACKING_STATE", "That tracking demonstration state is not supported.", {}, 422)
        trip = next(item for item in self._transport.list_trips() if item.id == booking.trip_id)
        service = next(item for item in self._transport.list_services() if item.id == trip.service_id)
        route = next(item for item in self._transport.list_routes() if item.id == service.route_id)
        stops = {item.id: item for item in self._transport.list_stops()}
        leg_destination = stops[route.destination_stop_id].name
        bus_number = "MH-14-AB-1234" if state != "BUS_NOT_ASSIGNED" else None
        message = {
            "BUS_NOT_ASSIGNED": "Bus details will appear here once the vehicle is assigned.",
            "BUS_ASSIGNED": "Your bus has been assigned.",
            "TRACKING_AVAILABLE": "Tracking will become available closer to departure.",
            "TRIP_STARTED": "Live location from the synthetic prototype feed.",
            "LOCATION_STALE": "Location has not updated recently.",
            "TRIP_COMPLETED": "This journey has been completed.",
        }[state]
        progress_percent = 100 if state == "TRIP_COMPLETED" else (52 if state in {"TRIP_STARTED", "LOCATION_STALE"} else 0)
        return TrackingResponse(state=state, bus_number=bus_number, service_name=service.name, origin=ticket.boarding_point,
            destination=ticket.destination, scheduled_departure=trip.departure_at,
            position=f"En route to {leg_destination}" if state in {"TRIP_STARTED", "LOCATION_STALE"} else None,
            next_stop=leg_destination if state in {"TRIP_STARTED", "LOCATION_STALE"} else None,
            updated_at=datetime.now(UTC) if state == "TRIP_STARTED" else (datetime.now(UTC).replace(minute=0) if state == "LOCATION_STALE" else None),
            progress_percent=progress_percent, message=message)
