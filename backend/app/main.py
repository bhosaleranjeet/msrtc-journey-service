from datetime import timedelta

import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

from app.integrations.openai.intent_provider import IntentProviderError, configured_intent_provider
from app.schemas.intent import IntentParseRequest
from app.schemas.journeys import JourneySearchRequest
from app.schemas.bookings import CreateBookingRequest, PassengerRequest, PaymentRequest, SelectSeatsRequest
from app.integrations.payments.mock_provider import MockPaymentProvider
from app.persistence.database import Base, SessionLocal, engine
from app.persistence.seed import active_date_window, seed_database
from app.repositories.sql import SqlBookingRepository, SqlTicketRepository, SqlTransportRepository
from app.services.booking_service import BookingService
from app.services.ticket_service import TicketService
from app.services.intent_service import IntentService
from app.services.journey_service import JourneyDomainError, JourneyService
from app.core.events import emit_domain_event

Base.metadata.create_all(engine)
seed_database(SessionLocal)

app = FastAPI(
    title="Citizen-First MSRTC Journey API",
    version="0.1.0",
    description="Prototype API using synthetic transport data only.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

transport_provider = SqlTransportRepository(SessionLocal)
booking_repository = SqlBookingRepository(SessionLocal)
payment_provider = MockPaymentProvider()
ticket_repository = SqlTicketRepository(SessionLocal)


@app.exception_handler(JourneyDomainError)
async def journey_domain_error_handler(_: Request, error: JourneyDomainError) -> JSONResponse:
    return JSONResponse(
        status_code=error.status_code,
        content={"error": {"code": error.code, "message": error.message, "details": error.details}},
    )


@app.exception_handler(IntentProviderError)
async def intent_provider_error_handler(_: Request, error: IntentProviderError) -> JSONResponse:
    return JSONResponse(
        status_code=503,
        content={"error": {"code": "AI_UNAVAILABLE", "message": str(error), "details": {}}},
    )


def journey_service() -> JourneyService:
    return JourneyService(transport_provider, booking_repository)


def booking_service() -> BookingService:
    return BookingService(transport_provider, booking_repository, payment_provider)


def ticket_service() -> TicketService:
    return TicketService(transport_provider, ticket_repository)


def intent_service() -> IntentService:
    return IntentService(configured_intent_provider())


@app.get("/api/health")
def health_check() -> dict[str, str]:
    """Confirm that the local prototype API is running."""
    return {"status": "ok", "data_mode": "seeded_synthetic"}


@app.get("/api/demo-network")
def demo_network(summary: bool = False) -> dict[str, object]:
    """Expose the supported synthetic network; this is not an official MSRTC feed."""
    start_date, end_date = transport_provider.supported_date_range()
    return {
        "data_mode": "seeded_synthetic",
        "journey_date": start_date,
        "coverage": transport_provider.network_metadata(),
        "coverage_start": start_date,
        "coverage_end": end_date,
        "stops": transport_provider.list_stops(),
        "services": [] if summary else transport_provider.list_services(),
        "trips": [] if summary else [
            trip for trip in transport_provider.list_trips()
            if start_date <= trip.journey_date <= end_date
        ],
    }


@app.get("/api/stops/search")
def search_stops(q: str) -> dict[str, object]:
    return {"results": journey_service().search_stops(q)}


@app.post("/api/journeys/search")
def search_journeys(request: JourneySearchRequest) -> object:
    response = journey_service().search_direct(request)
    emit_domain_event("journey.search.completed", result_count=len(response.results), connection_count=len(response.connecting_results))
    return response


@app.post("/api/intent/parse")
def parse_intent(request: IntentParseRequest) -> object:
    reference_date = request.reference_date or active_date_window()[0] - timedelta(days=1)
    intent = intent_service().parse(request.query, reference_date)
    emit_domain_event("intent.parsed", has_time_window=intent.time_window is not None, air_conditioned=intent.preferences.air_conditioned)
    return intent


@app.post("/api/bookings")
def create_booking(request: CreateBookingRequest) -> object:
    booking = booking_service().create(request.trip_id)
    emit_domain_event("booking.created", booking_id=booking.id, trip_id=booking.trip_id)
    return booking


@app.get("/api/bookings/{booking_id}")
def get_booking(booking_id: str) -> object:
    return booking_service().get(booking_id)


@app.post("/api/bookings/{booking_id}/seats")
def select_booking_seats(booking_id: str, request: SelectSeatsRequest) -> object:
    booking = booking_service().select_seats(booking_id, request.seat_numbers)
    emit_domain_event("booking.seats_held", booking_id=booking.id, seat_count=len(request.seat_numbers))
    return booking


@app.post("/api/bookings/{booking_id}/passengers")
def add_booking_passenger(booking_id: str, request: PassengerRequest) -> object:
    booking = booking_service().add_passenger(booking_id, request)
    emit_domain_event("booking.passenger_added", booking_id=booking.id, concession_type=request.concession_type)
    return booking


@app.post("/api/bookings/{booking_id}/payment")
def begin_booking_payment(booking_id: str, request: PaymentRequest) -> object:
    booking = booking_service().begin_payment(booking_id, request.confirmation_failure_demo)
    emit_domain_event("payment.received_mock", booking_id=booking.id, recovery_demo=request.confirmation_failure_demo)
    return booking


@app.post("/api/bookings/{booking_id}/confirm")
def confirm_booking(booking_id: str) -> object:
    booking = booking_service().confirm(booking_id)
    emit_domain_event("booking.confirmed" if booking.status == "CONFIRMED" else "booking.confirmation_failed", booking_id=booking.id)
    return booking


@app.get("/api/bookings/{booking_id}/ticket")
def get_booking_ticket(booking_id: str) -> object:
    ticket = ticket_service().issue(booking_service().aggregate(booking_id))
    emit_domain_event("ticket.issued_mock", booking_id=booking_id, ticket_id=ticket.ticket_id)
    return ticket


@app.get("/api/bookings/{booking_id}/cancellation-preview")
def get_cancellation_preview(booking_id: str) -> object:
    return booking_service().cancellation_preview(booking_id)


@app.post("/api/bookings/{booking_id}/cancel")
def cancel_booking(booking_id: str) -> object:
    booking = booking_service().cancel(booking_id)
    emit_domain_event("booking.cancelled", booking_id=booking.id, refund_status=booking.refund_status)
    return booking


@app.post("/api/bookings/{booking_id}/refund/advance")
def advance_booking_refund(booking_id: str) -> object:
    booking = booking_service().advance_refund(booking_id)
    emit_domain_event("refund.advanced_mock", booking_id=booking.id, refund_status=booking.refund_status)
    return booking


# The production container builds the frontend into this location, allowing one
# HTTPS origin for the app and API. Local development continues to use Vite.
frontend_dist = Path(__file__).resolve().parents[2] / "frontend_dist"
if frontend_dist.is_dir():
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
