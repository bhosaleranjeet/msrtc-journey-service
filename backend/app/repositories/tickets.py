from app.domain.tickets.models import Ticket
from typing import Protocol


class TicketRepository(Protocol):
    def get_by_booking(self, booking_id: str) -> Ticket | None: ...
    def save(self, ticket: Ticket) -> Ticket: ...


class InMemoryTicketRepository:
    def __init__(self) -> None:
        self._tickets_by_booking: dict[str, Ticket] = {}

    def get_by_booking(self, booking_id: str) -> Ticket | None:
        return self._tickets_by_booking.get(booking_id)

    def save(self, ticket: Ticket) -> Ticket:
        self._tickets_by_booking[ticket.booking_id] = ticket
        return ticket
