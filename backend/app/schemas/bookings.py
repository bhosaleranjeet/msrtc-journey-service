from datetime import datetime

from pydantic import BaseModel, Field

from app.domain.bookings.models import BookingStatus, ConcessionType, Passenger, PaymentStatus, RefundStatus
from app.domain.transport.models import SeatStatus, SeatType


class CreateBookingRequest(BaseModel):
    trip_id: str = Field(min_length=1)


class SelectSeatsRequest(BaseModel):
    seat_numbers: list[str] = Field(min_length=1, max_length=6)


class PassengerRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    age: int = Field(ge=1, le=120)
    concession_type: ConcessionType = ConcessionType.NONE

    def to_domain(self) -> Passenger:
        return Passenger(name=self.name.strip(), age=self.age, concession_type=self.concession_type)


class PaymentRequest(BaseModel):
    confirmation_failure_demo: bool = False


class BookingSeat(BaseModel):
    id: str
    number: str
    status: SeatStatus
    seat_type: SeatType
    held_by_current_booking: bool = False


class BookingResponse(BaseModel):
    id: str
    trip_id: str
    status: BookingStatus
    created_at: datetime
    expires_at: datetime | None
    seats: list[BookingSeat]
    passenger: Passenger | None
    base_fare_inr: int
    concession_discount_inr: int
    total_fare_inr: int
    payment_status: PaymentStatus
    payment_reference: str | None
    refund_status: RefundStatus


class CancellationPreview(BaseModel):
    can_cancel: bool
    reason: str | None = None
    deadline: datetime | None = None
    paid_amount_inr: int
    deduction_inr: int
    non_refundable_charges_inr: int
    refund_amount_inr: int
