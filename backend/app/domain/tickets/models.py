from datetime import datetime

from pydantic import BaseModel


class Ticket(BaseModel):
    id: str
    booking_id: str
    ticket_number: str
    qr_payload: str
    issued_at: datetime
