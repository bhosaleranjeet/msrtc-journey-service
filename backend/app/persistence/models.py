from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.persistence.database import Base


class StopRow(Base):
    __tablename__ = "stops"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    city: Mapped[str] = mapped_column(String(120), index=True)
    aliases: Mapped[list[str]] = mapped_column(JSON, default=list)
    latitude: Mapped[float | None]
    longitude: Mapped[float | None]
    description: Mapped[str | None] = mapped_column(Text)
    is_major_hub: Mapped[bool] = mapped_column(Boolean, default=True)


class RouteRow(Base):
    __tablename__ = "routes"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    origin_stop_id: Mapped[str] = mapped_column(ForeignKey("stops.id"), index=True)
    destination_stop_id: Mapped[str] = mapped_column(ForeignKey("stops.id"), index=True)
    intermediate_stop_ids: Mapped[list[str]] = mapped_column(JSON, default=list)


class ServiceRow(Base):
    __tablename__ = "services"

    id: Mapped[str] = mapped_column(String(120), primary_key=True)
    name: Mapped[str] = mapped_column(String(180))
    service_type: Mapped[str] = mapped_column(String(40), index=True)
    route_id: Mapped[str] = mapped_column(ForeignKey("routes.id"), index=True)
    is_ac: Mapped[bool] = mapped_column(Boolean, index=True)
    base_fare: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    capacity: Mapped[int] = mapped_column(Integer, default=6)
    amenities: Mapped[list[str]] = mapped_column(JSON, default=list)
    departure_minutes: Mapped[int] = mapped_column(Integer)
    duration_minutes: Mapped[int] = mapped_column(Integer)


class TripRow(Base):
    __tablename__ = "trips"
    __table_args__ = (UniqueConstraint("service_id", "service_date"),)

    id: Mapped[str] = mapped_column(String(160), primary_key=True)
    service_id: Mapped[str] = mapped_column(ForeignKey("services.id"), index=True)
    service_date: Mapped[date] = mapped_column(Date, index=True)
    departure_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    arrival_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(24), default="SCHEDULED")


class SeatRow(Base):
    __tablename__ = "seats"
    __table_args__ = (UniqueConstraint("trip_id", "number"),)

    id: Mapped[str] = mapped_column(String(190), primary_key=True)
    trip_id: Mapped[str] = mapped_column(ForeignKey("trips.id"), index=True)
    number: Mapped[str] = mapped_column(String(12))
    status: Mapped[str] = mapped_column(String(24), default="AVAILABLE", index=True)
    seat_type: Mapped[str] = mapped_column(String(24), default="WINDOW")


class BookingRow(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    trip_id: Mapped[str] = mapped_column(ForeignKey("trips.id"), index=True)
    status: Mapped[str] = mapped_column(String(32), index=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    passenger_name: Mapped[str | None] = mapped_column(String(160))
    passenger_age: Mapped[int | None] = mapped_column(Integer)
    passenger_concession: Mapped[str | None] = mapped_column(String(32))
    base_fare_inr: Mapped[int] = mapped_column(Integer, default=0)
    concession_discount_inr: Mapped[int] = mapped_column(Integer, default=0)
    total_fare_inr: Mapped[int] = mapped_column(Integer, default=0)
    payment_status: Mapped[str] = mapped_column(String(32))
    payment_reference: Mapped[str | None] = mapped_column(String(100))
    refund_status: Mapped[str] = mapped_column(String(32))
    confirmation_should_fail: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)


class BookingSeatRow(Base):
    __tablename__ = "booking_seats"

    booking_id: Mapped[str] = mapped_column(ForeignKey("bookings.id", ondelete="CASCADE"), primary_key=True)
    seat_id: Mapped[str] = mapped_column(ForeignKey("seats.id"), primary_key=True)


class BookingTripRow(Base):
    __tablename__ = "booking_trips"

    booking_id: Mapped[str] = mapped_column(ForeignKey("bookings.id", ondelete="CASCADE"), primary_key=True)
    trip_id: Mapped[str] = mapped_column(ForeignKey("trips.id"), primary_key=True)
    sequence: Mapped[int] = mapped_column(Integer, default=1)


class SeatHoldRow(Base):
    __tablename__ = "seat_holds"

    seat_id: Mapped[str] = mapped_column(ForeignKey("seats.id"), primary_key=True)
    booking_id: Mapped[str] = mapped_column(ForeignKey("bookings.id", ondelete="CASCADE"), index=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)


class TicketRow(Base):
    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    booking_id: Mapped[str] = mapped_column(ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, index=True)
    ticket_number: Mapped[str] = mapped_column(String(80), unique=True)
    qr_payload: Mapped[str] = mapped_column(Text)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
