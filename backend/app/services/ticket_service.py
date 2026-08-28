from collections.abc import Callable
from datetime import UTC, datetime
from uuid import uuid4

from app.domain.bookings.models import Booking, BookingStatus
from app.domain.tickets.models import Ticket
from app.repositories.tickets import TicketRepository
from app.repositories.transport import TransportRepository
from app.schemas.tickets import JourneyPass
from app.services.journey_service import JourneyDomainError


class TicketService:
    def __init__(self, transport: TransportRepository, tickets: TicketRepository, clock: Callable[[], datetime] | None = None) -> None:
        self._transport = transport
        self._tickets = tickets
        self._clock = clock or (lambda: datetime.now(UTC))

    def issue(self, booking: Booking) -> JourneyPass:
        if booking.status != BookingStatus.CONFIRMED:
            raise JourneyDomainError("TICKET_NOT_AVAILABLE", "A journey pass is issued only after the booking is confirmed.", {}, 409)
        ticket = self._tickets.get_by_booking(booking.id)
        if not ticket:
            ticket = self._tickets.save(
                Ticket(
                    id=f"ticket_{uuid4().hex[:12]}", booking_id=booking.id,
                    ticket_number=f"MSRTC-{uuid4().hex[:8].upper()}", qr_payload=f"mock:booking:{booking.id}", issued_at=self._clock(),
                )
            )
        trip = next(trip for trip in self._transport.list_trips() if trip.id == booking.trip_id)
        service = next(service for service in self._transport.list_services() if service.id == trip.service_id)
        route = next(route for route in self._transport.list_routes() if route.id == service.route_id)
        stops = {stop.id: stop for stop in self._transport.list_stops()}
        seat_numbers = [seat.number for seat in self._transport.list_seats(booking.trip_id) if seat.id in booking.selected_seat_ids]
        return JourneyPass(
            ticket_id=ticket.id, ticket_number=ticket.ticket_number, qr_payload=ticket.qr_payload, issued_at=ticket.issued_at,
            departure_at=trip.departure_at, arrival_at=trip.arrival_at, boarding_point=stops[route.origin_stop_id].name,
            destination=stops[route.destination_stop_id].name, service_name=service.name, seat_numbers=seat_numbers,
            passenger_name=booking.passenger.name if booking.passenger else "Passenger", paid_amount_inr=booking.total_fare_inr,
            payment_reference=booking.payment_reference or "Mock payment",
        )
