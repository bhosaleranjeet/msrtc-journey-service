from datetime import date, datetime
from enum import StrEnum

from pydantic import BaseModel, Field, model_validator


class ComplaintStatus(StrEnum):
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"


class ComplaintCategory(StrEnum):
    BUS_CONDITION = "BUS CONDITION"
    STAFF = "STAFF"
    JOURNEY = "JOURNEY"
    SAFETY = "SAFETY"
    CLEANLINESS = "CLEANLINESS"
    FACILITIES = "FACILITIES"
    OTHER = "OTHER"


COMPLAINT_ISSUES: dict[ComplaintCategory, set[str]] = {
    ComplaintCategory.BUS_CONDITION: {"Broken seat", "AC not working", "Window issue", "Charging point not working", "Cleanliness issue", "Other bus-condition issue"},
    ComplaintCategory.STAFF: {"Conductor behaviour", "Driver behaviour", "Ticketing issue", "Other staff issue"},
    ComplaintCategory.JOURNEY: {"Bus delayed", "Bus did not arrive", "Wrong boarding information", "Unscheduled stop", "Other journey issue"},
    ComplaintCategory.SAFETY: {"Unsafe driving", "Safety concern"},
    ComplaintCategory.CLEANLINESS: {"Bus cleanliness"},
    ComplaintCategory.FACILITIES: {"Waiting-area issue"},
    ComplaintCategory.OTHER: {"Other issue"},
}


class ComplaintRequest(BaseModel):
    category: ComplaintCategory
    subcategory: str = Field(min_length=2, max_length=80)
    details: str | None = Field(default=None, max_length=500)
    photo_name: str | None = Field(default=None, max_length=180)
    photo_content_type: str | None = Field(default=None, max_length=100)
    photo_size_bytes: int | None = Field(default=None, ge=0, le=5_000_000)

    @model_validator(mode="after")
    def validate_issue_for_category(self) -> "ComplaintRequest":
        if self.subcategory not in COMPLAINT_ISSUES[self.category]:
            raise ValueError("Choose an issue that belongs to the selected complaint category.")
        photo_metadata = (self.photo_name, self.photo_content_type, self.photo_size_bytes)
        if any(value is not None for value in photo_metadata) and not all(value is not None for value in photo_metadata):
            raise ValueError("Photo name, content type, and size must be supplied together.")
        if self.photo_content_type and not self.photo_content_type.lower().startswith("image/"):
            raise ValueError("Complaint evidence must be an image.")
        return self


class ManualComplaintRequest(ComplaintRequest):
    origin: str = Field(min_length=2, max_length=100)
    destination: str = Field(min_length=2, max_length=100)
    journey_date: date
    ticket_number: str | None = Field(default=None, max_length=100)


class ComplaintResponse(BaseModel):
    reference: str
    booking_id: str | None = None
    ticket_number: str | None = None
    journey: str
    category: str
    subcategory: str
    status: ComplaintStatus
    photo_name: str | None = None
    photo_content_type: str | None = None
    photo_size_bytes: int | None = None
    submitted_at: datetime


class TrackingResponse(BaseModel):
    state: str
    bus_number: str | None = None
    service_name: str
    origin: str
    destination: str
    scheduled_departure: datetime
    position: str | None = None
    next_stop: str | None = None
    updated_at: datetime | None = None
    progress_percent: int = Field(default=0, ge=0, le=100)
    message: str
    is_synthetic: bool = True
