from datetime import datetime

from pydantic import BaseModel


class JourneyPassLeg(BaseModel):
    sequence: int
    departure_at: datetime
    arrival_at: datetime
    boarding_point: str
    destination: str
    service_name: str
    seat_numbers: list[str]


class JourneyPass(BaseModel):
    ticket_id: str
    ticket_number: str
    qr_payload: str
    issued_at: datetime
    departure_at: datetime
    arrival_at: datetime
    boarding_point: str
    destination: str
    service_name: str
    seat_numbers: list[str]
    passenger_name: str
    paid_amount_inr: int
    payment_reference: str
    legs: list[JourneyPassLeg] = []
