from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel


class BookingStatus(StrEnum):
    DRAFT = "DRAFT"
    SEATS_HELD = "SEATS_HELD"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED"
    CONFIRMING = "CONFIRMING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    FAILED = "FAILED"


class ConcessionType(StrEnum):
    NONE = "NONE"
    STUDENT = "STUDENT"
    SENIOR = "SENIOR"


class PaymentStatus(StrEnum):
    NOT_STARTED = "NOT_STARTED"
    PENDING = "PENDING"
    RECEIVED = "RECEIVED"


class RefundStatus(StrEnum):
    NOT_REQUIRED = "NOT_REQUIRED"
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"


class Passenger(BaseModel):
    name: str
    age: int
    concession_type: ConcessionType = ConcessionType.NONE


class Booking(BaseModel):
    id: str
    trip_id: str
    status: BookingStatus = BookingStatus.DRAFT
    selected_seat_ids: tuple[str, ...] = ()
    created_at: datetime
    expires_at: datetime | None = None
    passenger: Passenger | None = None
    base_fare_inr: int = 0
    concession_discount_inr: int = 0
    total_fare_inr: int = 0
    payment_status: PaymentStatus = PaymentStatus.NOT_STARTED
    payment_reference: str | None = None
    refund_status: RefundStatus = RefundStatus.NOT_REQUIRED
    confirmation_should_fail: bool = False

    def hold_seats(self, seat_ids: tuple[str, ...], expires_at: datetime) -> None:
        if self.status not in {BookingStatus.DRAFT, BookingStatus.SEATS_HELD}:
            raise ValueError("Seats cannot be held for this booking state.")
        self.selected_seat_ids = seat_ids
        self.expires_at = expires_at
        self.status = BookingStatus.SEATS_HELD

    def expire_hold(self) -> None:
        if self.status == BookingStatus.SEATS_HELD:
            self.selected_seat_ids = ()
            self.expires_at = None
            self.status = BookingStatus.DRAFT

    def add_passenger(self, passenger: Passenger, base_fare_inr: int, concession_discount_inr: int) -> None:
        if self.status != BookingStatus.SEATS_HELD:
            raise ValueError("Passenger details require an active seat hold.")
        self.passenger = passenger
        self.base_fare_inr = base_fare_inr
        self.concession_discount_inr = concession_discount_inr
        self.total_fare_inr = base_fare_inr - concession_discount_inr

    def begin_payment(self, confirmation_should_fail: bool) -> None:
        if self.status != BookingStatus.SEATS_HELD or not self.passenger:
            raise ValueError("Payment requires held seats and passenger details.")
        self.status = BookingStatus.PAYMENT_PENDING
        self.payment_status = PaymentStatus.PENDING
        self.expires_at = None
        self.confirmation_should_fail = confirmation_should_fail

    def receive_payment(self, payment_reference: str) -> None:
        if self.status != BookingStatus.PAYMENT_PENDING:
            raise ValueError("Payment was not expected for this booking.")
        self.status = BookingStatus.PAYMENT_RECEIVED
        self.payment_status = PaymentStatus.RECEIVED
        self.payment_reference = payment_reference

    def begin_confirmation(self) -> None:
        if self.status != BookingStatus.PAYMENT_RECEIVED:
            raise ValueError("Only a received payment can be confirmed.")
        self.status = BookingStatus.CONFIRMING

    def confirm_reservation(self) -> None:
        if self.status != BookingStatus.CONFIRMING:
            raise ValueError("Reservation confirmation was not started.")
        if self.confirmation_should_fail:
            self.status = BookingStatus.FAILED
            self.refund_status = RefundStatus.PENDING
            return
        self.status = BookingStatus.CONFIRMED

    def cancel(self) -> None:
        if self.status != BookingStatus.CONFIRMED:
            raise ValueError("Only a confirmed booking can be cancelled.")
        self.status = BookingStatus.CANCELLED
        self.refund_status = RefundStatus.PENDING

    def advance_refund(self) -> None:
        if self.refund_status == RefundStatus.PENDING:
            self.refund_status = RefundStatus.PROCESSING
        elif self.refund_status == RefundStatus.PROCESSING:
            self.refund_status = RefundStatus.COMPLETED
        else:
            raise ValueError("There is no refund progression available for this booking.")
