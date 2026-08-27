from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from app.domain.bookings.models import Booking, BookingStatus
from app.domain.transport.models import SeatStatus
from app.integrations.payments.mock_provider import PaymentProvider
from app.repositories.bookings import InMemoryBookingRepository
from app.repositories.transport import TransportRepository
from app.schemas.bookings import BookingResponse, BookingSeat, CancellationPreview, PassengerRequest
from app.services.journey_service import JourneyDomainError

HOLD_DURATION = timedelta(minutes=10)


class BookingService:
    def __init__(self, transport: TransportRepository, bookings: InMemoryBookingRepository, payments: PaymentProvider, clock: Callable[[], datetime] | None = None) -> None:
        self._transport = transport
        self._bookings = bookings
        self._payments = payments
        self._clock = clock or (lambda: datetime.now(UTC))

    def create(self, trip_id: str) -> BookingResponse:
        self._expire_holds()
        if not any(trip.id == trip_id for trip in self._transport.list_trips()):
            raise JourneyDomainError("TRIP_NOT_FOUND", "This service is no longer available.", {"trip_id": trip_id}, 404)
        booking = Booking(id=f"booking_{uuid4().hex[:12]}", trip_id=trip_id, created_at=self._clock())
        self._bookings.create(booking)
        return self._response(booking)

    def get(self, booking_id: str) -> BookingResponse:
        self._expire_holds()
        return self._response(self._booking_or_error(booking_id))

    def aggregate(self, booking_id: str) -> Booking:
        self._expire_holds()
        return self._booking_or_error(booking_id)

    def select_seats(self, booking_id: str, seat_numbers: list[str]) -> BookingResponse:
        self._expire_holds()
        booking = self._booking_or_error(booking_id)
        if len(set(seat_numbers)) != len(seat_numbers):
            raise JourneyDomainError("INVALID_SEAT_SELECTION", "Choose each seat only once.", {}, 422)
        trip_seats = {seat.number: seat for seat in self._transport.list_seats(booking.trip_id)}
        selected = []
        for number in seat_numbers:
            seat = trip_seats.get(number)
            if not seat or seat.status != SeatStatus.AVAILABLE:
                raise JourneyDomainError("SEAT_UNAVAILABLE", "One of those seats is no longer available.", {"seat_number": number}, 409)
            holder = self._bookings.holder_for(seat.id)
            if self._bookings.is_booked(seat.id) or (holder and holder != booking.id):
                raise JourneyDomainError("SEAT_UNAVAILABLE", "One of those seats is currently being selected by another passenger.", {"seat_number": number}, 409)
            selected.append(seat)
        expires_at = self._clock() + HOLD_DURATION
        booking.hold_seats(tuple(seat.id for seat in selected), expires_at)
        self._bookings.hold_seats(booking, booking.selected_seat_ids, expires_at)
        return self._response(booking)

    def add_passenger(self, booking_id: str, request: PassengerRequest) -> BookingResponse:
        self._expire_holds()
        booking = self._booking_or_error(booking_id)
        service = next(service for service in self._transport.list_services() if service.id == self._trip_service_id(booking.trip_id))
        base_fare = service.fare_inr * len(booking.selected_seat_ids)
        discount = self._mock_concession_discount(request.age, request.concession_type.value, base_fare)
        try:
            booking.add_passenger(request.to_domain(), base_fare, discount)
        except ValueError as error:
            raise JourneyDomainError("INVALID_BOOKING_STATE", str(error), {}, 409) from error
        return self._response(booking)

    def begin_payment(self, booking_id: str, confirmation_should_fail: bool) -> BookingResponse:
        self._expire_holds()
        booking = self._booking_or_error(booking_id)
        try:
            booking.begin_payment(confirmation_should_fail)
            receipt = self._payments.create_payment(booking.total_fare_inr)
            booking.receive_payment(receipt.reference)
        except ValueError as error:
            raise JourneyDomainError("INVALID_BOOKING_STATE", str(error), {}, 409) from error
        return self._response(booking)

    def confirm(self, booking_id: str) -> BookingResponse:
        booking = self._booking_or_error(booking_id)
        try:
            booking.begin_confirmation()
            booking.confirm_reservation()
            if booking.status == BookingStatus.CONFIRMED:
                self._bookings.book_seats(booking)
            elif booking.status == BookingStatus.FAILED:
                self._bookings.release_seats(booking)
        except ValueError as error:
            raise JourneyDomainError("INVALID_BOOKING_STATE", str(error), {}, 409) from error
        return self._response(booking)

    def cancellation_preview(self, booking_id: str) -> CancellationPreview:
        booking = self._booking_or_error(booking_id)
        trip = next(trip for trip in self._transport.list_trips() if trip.id == booking.trip_id)
        deadline = trip.departure_at - timedelta(hours=2)
        if booking.status != BookingStatus.CONFIRMED:
            return CancellationPreview(can_cancel=False, reason="Only a confirmed booking can be cancelled.", deadline=None, paid_amount_inr=booking.total_fare_inr, deduction_inr=0, non_refundable_charges_inr=0, refund_amount_inr=0)
        now = self._clock().replace(tzinfo=None)
        if now >= deadline:
            return CancellationPreview(can_cancel=False, reason="The cancellation deadline has passed.", deadline=deadline, paid_amount_inr=booking.total_fare_inr, deduction_inr=0, non_refundable_charges_inr=0, refund_amount_inr=0)
        deduction = round(booking.total_fare_inr * 0.10)
        non_refundable = min(10, booking.total_fare_inr - deduction)
        return CancellationPreview(
            can_cancel=True, deadline=deadline, paid_amount_inr=booking.total_fare_inr, deduction_inr=deduction,
            non_refundable_charges_inr=non_refundable, refund_amount_inr=max(booking.total_fare_inr - deduction - non_refundable, 0),
        )

    def cancel(self, booking_id: str) -> BookingResponse:
        preview = self.cancellation_preview(booking_id)
        if not preview.can_cancel:
            raise JourneyDomainError("CANCELLATION_NOT_ALLOWED", preview.reason or "Cancellation is not available.", {}, 409)
        booking = self._booking_or_error(booking_id)
        try:
            booking.cancel()
            self._bookings.release_booked_seats(booking)
        except ValueError as error:
            raise JourneyDomainError("INVALID_BOOKING_STATE", str(error), {}, 409) from error
        return self._response(booking)

    def advance_refund(self, booking_id: str) -> BookingResponse:
        booking = self._booking_or_error(booking_id)
        try:
            booking.advance_refund()
        except ValueError as error:
            raise JourneyDomainError("INVALID_BOOKING_STATE", str(error), {}, 409) from error
        return self._response(booking)

    def _response(self, booking: Booking) -> BookingResponse:
        seats: list[BookingSeat] = []
        for seat in self._transport.list_seats(booking.trip_id):
            holder = self._bookings.holder_for(seat.id)
            is_current = holder == booking.id
            if self._bookings.is_booked(seat.id):
                status = SeatStatus.BOOKED
                is_current = False
            else:
                status = SeatStatus.HELD if holder else seat.status
            seats.append(BookingSeat(id=seat.id, number=seat.number, status=status, seat_type=seat.seat_type, held_by_current_booking=is_current))
        return BookingResponse(
            id=booking.id, trip_id=booking.trip_id, status=booking.status, created_at=booking.created_at, expires_at=booking.expires_at,
            seats=seats, passenger=booking.passenger, base_fare_inr=booking.base_fare_inr,
            concession_discount_inr=booking.concession_discount_inr, total_fare_inr=booking.total_fare_inr,
            payment_status=booking.payment_status, payment_reference=booking.payment_reference, refund_status=booking.refund_status,
        )

    def _trip_service_id(self, trip_id: str) -> str:
        return next(trip.service_id for trip in self._transport.list_trips() if trip.id == trip_id)

    @staticmethod
    def _mock_concession_discount(age: int, concession_type: str, base_fare: int) -> int:
        """Synthetic rules only: senior (60+) saves 20%; student (25 and under) saves 10%."""
        if concession_type == "SENIOR" and age >= 60:
            return round(base_fare * 0.20)
        if concession_type == "STUDENT" and age <= 25:
            return round(base_fare * 0.10)
        return 0

    def _booking_or_error(self, booking_id: str) -> Booking:
        booking = self._bookings.get(booking_id)
        if not booking:
            raise JourneyDomainError("BOOKING_NOT_FOUND", "We could not find this booking.", {"booking_id": booking_id}, 404)
        return booking

    def _expire_holds(self) -> None:
        self._bookings.expire_holds(self._clock())
