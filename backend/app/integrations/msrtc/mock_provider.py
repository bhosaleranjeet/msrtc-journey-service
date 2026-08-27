"""Deterministic synthetic network used by the public prototype demo."""

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from app.domain.transport.models import (
    Route,
    Seat,
    SeatStatus,
    SeatType,
    Service,
    ServiceType,
    Stop,
    TripInstance,
)
from app.repositories.transport import InMemoryTransportRepository

# Keep the synthetic network useful whenever the public prototype is opened.
# The service day is fixed for the lifetime of a running backend process, so
# every request in a booking flow still sees the same deterministic schedule.
DEMO_DATE = datetime.now(ZoneInfo("Asia/Kolkata")).date() + timedelta(days=1)


def _at(hour: int, minute: int) -> datetime:
    return datetime(DEMO_DATE.year, DEMO_DATE.month, DEMO_DATE.day, hour, minute)


def _seats(trip_id: str, *, booked: tuple[str, ...] = ()) -> tuple[Seat, ...]:
    return tuple(
        Seat(
            id=f"seat_{trip_id}_{number}",
            trip_id=trip_id,
            number=number,
            status=SeatStatus.BOOKED if number in booked else SeatStatus.AVAILABLE,
            seat_type=SeatType.WINDOW if number in {"1", "2", "5", "6"} else SeatType.AISLE,
        )
        for number in ("1", "2", "3", "4", "5", "6")
    )


class MockTransportProvider(InMemoryTransportRepository):
    """Small, fixed network built solely for repeatable prototype demonstrations."""

    def __init__(self) -> None:
        stops = (
            Stop(id="stop_pune_station", code="PNQSTN", name="Pune Station", city="Pune", aliases=("Pune", "Pune bus stand"), latitude=18.528, longitude=73.874, description="Main boarding area near Pune railway station."),
            Stop(id="stop_nashik_mahamarg", code="NSKMRG", name="Nashik Mahamarg", city="Nashik", aliases=("Nashik", "Nasik", "Nashik Highway"), latitude=19.997, longitude=73.790, description="Mahamarg bus stop on the Mumbai-Agra highway."),
            Stop(id="stop_nashik_cbs", code="NSKCBS", name="Nashik CBS", city="Nashik", aliases=("Nashik", "Nashik Central"), latitude=19.992, longitude=73.787, description="Central Bus Stand in Nashik city."),
            Stop(id="stop_nashik_road", code="NSKRD", name="Nashik Road", city="Nashik", aliases=("Nashik", "Nashik railway station"), latitude=19.966, longitude=73.822, description="Boarding point near Nashik Road railway station."),
            Stop(id="stop_satara_stand", code="STRSTN", name="Satara Bus Stand", city="Satara", aliases=("Satara",), latitude=17.680, longitude=73.993, description="Central Satara intercity bus stand."),
            Stop(id="stop_demo_destination", code="DMODST", name="Demo Destination", city="Demo District", aliases=("Demo Destination",), latitude=17.940, longitude=74.350, description="Synthetic destination used to demonstrate a connection."),
        )
        routes = (
            Route(id="route_pune_nashik_mahamarg", origin_stop_id="stop_pune_station", destination_stop_id="stop_nashik_mahamarg"),
            Route(id="route_pune_nashik_cbs", origin_stop_id="stop_pune_station", destination_stop_id="stop_nashik_cbs"),
            Route(id="route_pune_satara", origin_stop_id="stop_pune_station", destination_stop_id="stop_satara_stand"),
            Route(id="route_satara_demo", origin_stop_id="stop_satara_stand", destination_stop_id="stop_demo_destination"),
        )
        services = (
            Service(id="service_pune_nashik_ac", name="Pune Nashik Express", service_type=ServiceType.SHIVNERI, route_id="route_pune_nashik_mahamarg", is_air_conditioned=True, fare_inr=520, capacity=6, amenities=("Air conditioned", "Reserved seating")),
            Service(id="service_pune_nashik_ordinary", name="Pune Nashik Day Service", service_type=ServiceType.ORDINARY, route_id="route_pune_nashik_cbs", is_air_conditioned=False, fare_inr=320, capacity=6),
            Service(id="service_pune_nashik_fast", name="Pune Nashik Semi-Luxury", service_type=ServiceType.SEMI_LUXURY, route_id="route_pune_nashik_mahamarg", is_air_conditioned=False, fare_inr=410, capacity=6, amenities=("Reserved seating",)),
            Service(id="service_pune_satara", name="Pune Satara Connector", service_type=ServiceType.SEMI_LUXURY, route_id="route_pune_satara", is_air_conditioned=False, fare_inr=210, capacity=6),
            Service(id="service_satara_demo", name="Satara Demo Connector", service_type=ServiceType.ORDINARY, route_id="route_satara_demo", is_air_conditioned=False, fare_inr=180, capacity=6),
        )
        trips = (
            TripInstance(id="trip_pune_nashik_ac", service_id="service_pune_nashik_ac", journey_date=DEMO_DATE, departure_at=_at(7, 0), arrival_at=_at(11, 15)),
            TripInstance(id="trip_pune_nashik_ordinary", service_id="service_pune_nashik_ordinary", journey_date=DEMO_DATE, departure_at=_at(8, 0), arrival_at=_at(13, 15)),
            TripInstance(id="trip_pune_nashik_fast", service_id="service_pune_nashik_fast", journey_date=DEMO_DATE, departure_at=_at(9, 30), arrival_at=_at(13, 30)),
            TripInstance(id="trip_pune_satara", service_id="service_pune_satara", journey_date=DEMO_DATE, departure_at=_at(8, 0), arrival_at=_at(11, 0)),
            TripInstance(id="trip_satara_demo", service_id="service_satara_demo", journey_date=DEMO_DATE, departure_at=_at(11, 45), arrival_at=_at(13, 15)),
        )
        seats = (
            *_seats("trip_pune_nashik_ac", booked=("1",)),
            *_seats("trip_pune_nashik_ordinary", booked=("2", "5")),
            *_seats("trip_pune_nashik_fast"),
            *_seats("trip_pune_satara", booked=("3",)),
            *_seats("trip_satara_demo"),
        )
        super().__init__(stops=stops, routes=routes, services=services, trips=trips, seats=seats)
