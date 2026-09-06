from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import delete, func, select, update
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.orm import Session, sessionmaker

from app.domain.bookings.models import (
    Booking,
    BookingStatus,
    ConcessionType,
    Passenger,
    PaymentStatus,
    RefundStatus,
)
from app.domain.tickets.models import Ticket
from app.domain.transport.models import Route, Seat, SeatStatus, SeatType, Service, ServiceType, Stop, TripInstance
from app.persistence.models import (
    BookingRow,
    BookingSeatRow,
    BookingTripRow,
    RouteRow,
    SeatHoldRow,
    SeatRow,
    ServiceRow,
    StopRow,
    TicketRow,
    TripRow,
)
from app.persistence.seed import CURATED_ROUTE_IDS, CURATED_STOP_IDS, HUBS, active_date_window


class SqlTransportRepository:
    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self._sessions = session_factory

    def list_stops(self) -> tuple[Stop, ...]:
        with self._sessions() as session:
            rows = session.scalars(select(StopRow).where(StopRow.id.in_(CURATED_STOP_IDS)).order_by(StopRow.name)).all()
            return tuple(Stop(
                id=row.id,
                code=row.code,
                name=row.name,
                city=row.city,
                aliases=tuple(row.aliases or []),
                latitude=row.latitude,
                longitude=row.longitude,
                description=row.description,
            ) for row in rows)

    def list_routes(self) -> tuple[Route, ...]:
        with self._sessions() as session:
            rows = session.scalars(select(RouteRow).where(RouteRow.id.in_(CURATED_ROUTE_IDS))).all()
            return tuple(Route(
                id=row.id,
                origin_stop_id=row.origin_stop_id,
                destination_stop_id=row.destination_stop_id,
                intermediate_stop_ids=tuple(row.intermediate_stop_ids or []),
            ) for row in rows)

    def list_services(self) -> tuple[Service, ...]:
        with self._sessions() as session:
            rows = session.scalars(select(ServiceRow).where(ServiceRow.route_id.in_(CURATED_ROUTE_IDS))).all()
            return tuple(Service(
                id=row.id,
                name=row.name,
                service_type=ServiceType(row.service_type),
                route_id=row.route_id,
                is_air_conditioned=row.is_ac,
                fare_inr=int(row.base_fare),
                capacity=row.capacity,
                amenities=tuple(row.amenities or []),
            ) for row in rows)

    def list_trips(self) -> tuple[TripInstance, ...]:
        with self._sessions() as session:
            rows = session.scalars(
                select(TripRow).join(ServiceRow, TripRow.service_id == ServiceRow.id).where(ServiceRow.route_id.in_(CURATED_ROUTE_IDS))
            ).all()
            return tuple(TripInstance(
                id=row.id,
                service_id=row.service_id,
                journey_date=row.service_date,
                departure_at=row.departure_at,
                arrival_at=row.arrival_at,
                status=row.status,
            ) for row in rows)

    def list_seats(self, trip_id: str) -> tuple[Seat, ...]:
        with self._sessions() as session:
            rows = session.scalars(select(SeatRow).where(SeatRow.trip_id == trip_id).order_by(SeatRow.number)).all()
            return tuple(Seat(
                id=row.id,
                trip_id=row.trip_id,
                number=row.number,
                status=SeatStatus(row.status),
                seat_type=SeatType(row.seat_type),
            ) for row in rows)

    def supported_date_range(self) -> tuple[date, date]:
        return active_date_window()

    def network_metadata(self) -> dict[str, int | str]:
        start_date, end_date = self.supported_date_range()
        with self._sessions() as session:
            return {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "hub_count": sum(1 for hub in HUBS if hub.major),
                "corridor_count": len(CURATED_ROUTE_IDS) // 2,
                "demo_connection_count": 1,
                "stop_count": session.scalar(select(func.count()).select_from(StopRow).where(StopRow.id.in_(CURATED_STOP_IDS))) or 0,
                "route_count": session.scalar(select(func.count()).select_from(RouteRow).where(RouteRow.id.in_(CURATED_ROUTE_IDS))) or 0,
                "service_count": session.scalar(select(func.count()).select_from(ServiceRow).where(ServiceRow.route_id.in_(CURATED_ROUTE_IDS))) or 0,
                "trip_count": session.scalar(
                    select(func.count()).select_from(TripRow).join(ServiceRow, TripRow.service_id == ServiceRow.id).where(
                        ServiceRow.route_id.in_(CURATED_ROUTE_IDS), TripRow.service_date.between(start_date, end_date)
                    )
                ) or 0,
            }


class SqlBookingRepository:
    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self._sessions = session_factory

    def create(self, booking: Booking) -> Booking:
        with self._sessions() as session, session.begin():
            session.add(self._new_row(booking))
            for sequence, trip_id in enumerate(booking.trip_ids or (booking.trip_id,), start=1):
                session.add(BookingTripRow(booking_id=booking.id, trip_id=trip_id, sequence=sequence))
        return booking

    def save(self, booking: Booking) -> Booking:
        with self._sessions() as session, session.begin():
            row = session.get(BookingRow, booking.id)
            if row is None:
                session.add(self._new_row(booking))
            else:
                self._apply(row, booking)
        return booking

    def get(self, booking_id: str) -> Booking | None:
        with self._sessions() as session:
            row = session.get(BookingRow, booking_id)
            if row is None:
                return None
            seat_ids = tuple(session.scalars(
                select(BookingSeatRow.seat_id).where(BookingSeatRow.booking_id == booking_id)
            ))
            trip_ids = tuple(session.scalars(
                select(BookingTripRow.trip_id).where(BookingTripRow.booking_id == booking_id).order_by(BookingTripRow.sequence)
            )) or (row.trip_id,)
            passenger = None
            if row.passenger_name is not None and row.passenger_age is not None:
                passenger = Passenger(
                    name=row.passenger_name,
                    age=row.passenger_age,
                    concession_type=ConcessionType(row.passenger_concession or ConcessionType.NONE),
                )
            return Booking(
                id=row.id,
                trip_id=row.trip_id,
                trip_ids=trip_ids,
                status=BookingStatus(row.status),
                selected_seat_ids=seat_ids,
                created_at=row.created_at,
                expires_at=row.expires_at,
                passenger=passenger,
                base_fare_inr=row.base_fare_inr,
                concession_discount_inr=row.concession_discount_inr,
                total_fare_inr=row.total_fare_inr,
                payment_status=PaymentStatus(row.payment_status),
                payment_reference=row.payment_reference,
                refund_status=RefundStatus(row.refund_status),
                confirmation_should_fail=row.confirmation_should_fail,
            )

    def holder_for(self, seat_id: str) -> str | None:
        with self._sessions() as session:
            row = session.get(SeatHoldRow, seat_id)
            return row.booking_id if row else None

    def is_booked(self, seat_id: str) -> bool:
        with self._sessions() as session:
            row = session.get(SeatRow, seat_id)
            return bool(row and row.status == SeatStatus.BOOKED)

    def try_hold_seats(self, booking: Booking, seat_ids: tuple[str, ...], expires_at: datetime) -> bool:
        session = self._sessions()
        try:
            with session.begin():
                rows = list(session.scalars(
                    select(SeatRow).where(SeatRow.id.in_(seat_ids)).with_for_update()
                ))
                if len(rows) != len(seat_ids) or any(row.status == SeatStatus.BOOKED for row in rows):
                    return False
                holds = list(session.scalars(
                    select(SeatHoldRow).where(SeatHoldRow.seat_id.in_(seat_ids)).with_for_update()
                ))
                if any(hold.booking_id != booking.id for hold in holds):
                    return False
                session.execute(delete(SeatHoldRow).where(SeatHoldRow.booking_id == booking.id))
                session.execute(delete(BookingSeatRow).where(BookingSeatRow.booking_id == booking.id))
                for seat_id in seat_ids:
                    session.add(BookingSeatRow(booking_id=booking.id, seat_id=seat_id))
                    session.add(SeatHoldRow(seat_id=seat_id, booking_id=booking.id, expires_at=expires_at))
                row = session.get(BookingRow, booking.id)
                if row is None:
                    return False
                self._apply(row, booking)
            return True
        except (IntegrityError, OperationalError):
            session.rollback()
            return False
        finally:
            session.close()

    def protect_seats(self, booking: Booking) -> None:
        with self._sessions() as session, session.begin():
            session.execute(
                update(SeatHoldRow).where(SeatHoldRow.booking_id == booking.id).values(expires_at=None)
            )
            row = session.get(BookingRow, booking.id)
            if row:
                self._apply(row, booking)

    def book_seats(self, booking: Booking) -> None:
        with self._sessions() as session, session.begin():
            seat_ids = tuple(session.scalars(
                select(BookingSeatRow.seat_id).where(BookingSeatRow.booking_id == booking.id)
            ))
            session.execute(update(SeatRow).where(SeatRow.id.in_(seat_ids)).values(status=SeatStatus.BOOKED))
            session.execute(delete(SeatHoldRow).where(SeatHoldRow.booking_id == booking.id))
            row = session.get(BookingRow, booking.id)
            if row:
                self._apply(row, booking)

    def release_seats(self, booking: Booking) -> None:
        with self._sessions() as session, session.begin():
            session.execute(delete(SeatHoldRow).where(SeatHoldRow.booking_id == booking.id))
            session.execute(delete(BookingSeatRow).where(BookingSeatRow.booking_id == booking.id))
            row = session.get(BookingRow, booking.id)
            if row:
                self._apply(row, booking)

    def release_booked_seats(self, booking: Booking) -> None:
        with self._sessions() as session, session.begin():
            seat_ids = tuple(session.scalars(
                select(BookingSeatRow.seat_id).where(BookingSeatRow.booking_id == booking.id)
            ))
            session.execute(update(SeatRow).where(SeatRow.id.in_(seat_ids)).values(status=SeatStatus.AVAILABLE))
            row = session.get(BookingRow, booking.id)
            if row:
                self._apply(row, booking)

    def expire_holds(self, now: datetime) -> None:
        with self._sessions() as session, session.begin():
            booking_ids = set(session.scalars(
                select(SeatHoldRow.booking_id).where(SeatHoldRow.expires_at.is_not(None), SeatHoldRow.expires_at <= now)
            ))
            if not booking_ids:
                return
            session.execute(delete(SeatHoldRow).where(SeatHoldRow.booking_id.in_(booking_ids)))
            session.execute(delete(BookingSeatRow).where(BookingSeatRow.booking_id.in_(booking_ids)))
            session.execute(
                update(BookingRow)
                .where(BookingRow.id.in_(booking_ids), BookingRow.status == BookingStatus.SEATS_HELD)
                .values(status=BookingStatus.DRAFT, expires_at=None)
            )

    @staticmethod
    def _new_row(booking: Booking) -> BookingRow:
        row = BookingRow(id=booking.id, trip_id=booking.trip_id, created_at=booking.created_at)
        SqlBookingRepository._apply(row, booking)
        return row

    @staticmethod
    def _apply(row: BookingRow, booking: Booking) -> None:
        row.status = booking.status
        row.expires_at = booking.expires_at
        row.passenger_name = booking.passenger.name if booking.passenger else None
        row.passenger_age = booking.passenger.age if booking.passenger else None
        row.passenger_concession = booking.passenger.concession_type if booking.passenger else None
        row.base_fare_inr = booking.base_fare_inr
        row.concession_discount_inr = booking.concession_discount_inr
        row.total_fare_inr = booking.total_fare_inr
        row.payment_status = booking.payment_status
        row.payment_reference = booking.payment_reference
        row.refund_status = booking.refund_status
        row.confirmation_should_fail = booking.confirmation_should_fail


class SqlTicketRepository:
    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self._sessions = session_factory

    def get_by_booking(self, booking_id: str) -> Ticket | None:
        with self._sessions() as session:
            row = session.scalar(select(TicketRow).where(TicketRow.booking_id == booking_id))
            return None if row is None else Ticket(
                id=row.id,
                booking_id=row.booking_id,
                ticket_number=row.ticket_number,
                qr_payload=row.qr_payload,
                issued_at=row.issued_at,
            )

    def save(self, ticket: Ticket) -> Ticket:
        with self._sessions() as session, session.begin():
            row = session.scalar(select(TicketRow).where(TicketRow.booking_id == ticket.booking_id))
            if row is None:
                session.add(TicketRow(
                    id=ticket.id,
                    booking_id=ticket.booking_id,
                    ticket_number=ticket.ticket_number,
                    qr_payload=ticket.qr_payload,
                    issued_at=ticket.issued_at,
                ))
        return ticket
