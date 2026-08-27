from datetime import datetime
from threading import RLock

from app.domain.bookings.models import Booking


class InMemoryBookingRepository:
    """Process-local booking state for the prototype; replace with database persistence later."""

    def __init__(self) -> None:
        self._bookings: dict[str, Booking] = {}
        self._seat_holds: dict[str, tuple[str, datetime]] = {}
        self._booked_seat_ids: set[str] = set()
        self._lock = RLock()

    def create(self, booking: Booking) -> Booking:
        with self._lock:
            self._bookings[booking.id] = booking
            return booking

    def get(self, booking_id: str) -> Booking | None:
        with self._lock:
            return self._bookings.get(booking_id)

    def holder_for(self, seat_id: str) -> str | None:
        with self._lock:
            hold = self._seat_holds.get(seat_id)
            return hold[0] if hold else None

    def is_booked(self, seat_id: str) -> bool:
        with self._lock:
            return seat_id in self._booked_seat_ids

    def hold_seats(self, booking: Booking, seat_ids: tuple[str, ...], expires_at: datetime) -> None:
        with self._lock:
            for seat_id in seat_ids:
                self._seat_holds[seat_id] = (booking.id, expires_at)

    def book_seats(self, booking: Booking) -> None:
        with self._lock:
            self._booked_seat_ids.update(booking.selected_seat_ids)
            for seat_id in booking.selected_seat_ids:
                self._seat_holds.pop(seat_id, None)

    def release_seats(self, booking: Booking) -> None:
        """Release transient inventory after a terminal reservation failure."""
        with self._lock:
            for seat_id in booking.selected_seat_ids:
                hold = self._seat_holds.get(seat_id)
                if hold and hold[0] == booking.id:
                    self._seat_holds.pop(seat_id, None)

    def release_booked_seats(self, booking: Booking) -> None:
        with self._lock:
            self._booked_seat_ids.difference_update(booking.selected_seat_ids)

    def expire_holds(self, now: datetime) -> None:
        with self._lock:
            expired_booking_ids = {booking_id for booking_id, expires_at in self._seat_holds.values() if expires_at <= now}
            self._seat_holds = {seat_id: hold for seat_id, hold in self._seat_holds.items() if hold[1] > now}
            for booking_id in expired_booking_ids:
                booking = self._bookings.get(booking_id)
                if booking:
                    booking.expire_hold()
