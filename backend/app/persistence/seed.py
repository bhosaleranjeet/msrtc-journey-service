from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from app.persistence.models import RouteRow, SeatRow, ServiceRow, StopRow, TripRow

IST = ZoneInfo("Asia/Kolkata")
SEED_DAYS = 14


@dataclass(frozen=True)
class Hub:
    key: str
    code: str
    name: str
    city: str
    aliases: tuple[str, ...]
    latitude: float
    longitude: float
    description: str
    major: bool = True


@dataclass(frozen=True)
class Corridor:
    origin: str
    destination: str
    duration_minutes: int
    ordinary_fare: int
    premium: bool = False


HUBS = (
    Hub("stop_mumbai_central", "MUM", "Mumbai Central", "Mumbai", ("Mumbai", "Bombay"), 18.9696, 72.8194, "Central Mumbai intercity bus terminal."),
    Hub("stop_pune_station", "PUN", "Pune Station", "Pune", ("Pune", "Poona"), 18.5289, 73.8744, "MSRTC boarding point near Pune railway station."),
    Hub("stop_nashik_mahamarg", "NSK-M", "Nashik Mahamarg", "Nashik", ("Nashik", "Nasik"), 19.9975, 73.7898, "Mahamarg bus stop on the Mumbai-Agra highway."),
    Hub("stop_ahilyanagar", "AHN", "Ahilyanagar Bus Stand", "Ahilyanagar", ("Ahilyanagar", "Ahmednagar", "Nagar"), 19.0952, 74.7496, "Central Ahilyanagar bus stand."),
    Hub("stop_sambhajinagar", "CSN", "Chhatrapati Sambhajinagar CBS", "Chhatrapati Sambhajinagar", ("Sambhajinagar", "Aurangabad", "Chhatrapati Sambhajinagar"), 19.8762, 75.3433, "Central bus stand in Chhatrapati Sambhajinagar."),
    Hub("stop_jalgaon", "JLG", "Jalgaon Bus Stand", "Jalgaon", ("Jalgaon",), 21.0077, 75.5626, "Central Jalgaon bus stand."),
    Hub("stop_nagpur", "NGP", "Nagpur Ganeshpeth", "Nagpur", ("Nagpur",), 21.1458, 79.0882, "Ganeshpeth intercity bus terminal."),
    Hub("stop_amravati", "AMT", "Amravati Bus Stand", "Amravati", ("Amravati", "Amrawati"), 20.9374, 77.7796, "Central Amravati bus stand."),
    Hub("stop_nanded", "NDD", "Nanded CBS", "Nanded", ("Nanded",), 19.1383, 77.3210, "Central Nanded bus stand."),
    Hub("stop_latur", "LTR", "Latur Bus Stand", "Latur", ("Latur",), 18.4088, 76.5604, "Central Latur bus stand."),
    Hub("stop_solapur", "SUR", "Solapur Bus Stand", "Solapur", ("Solapur", "Sholapur"), 17.6599, 75.9064, "Central Solapur bus stand."),
    Hub("stop_satara", "STR", "Satara Bus Stand", "Satara", ("Satara",), 17.6805, 74.0183, "Central Satara bus stand."),
    Hub("stop_sangli", "SGL", "Sangli Bus Stand", "Sangli", ("Sangli",), 16.8524, 74.5815, "Central Sangli bus stand."),
    Hub("stop_kolhapur", "KOP", "Kolhapur CBS", "Kolhapur", ("Kolhapur",), 16.7050, 74.2433, "Central Kolhapur bus stand."),
    Hub("stop_ratnagiri", "RTN", "Ratnagiri Bus Stand", "Ratnagiri", ("Ratnagiri",), 16.9902, 73.3120, "Central Ratnagiri bus stand."),
    Hub("stop_nashik_cbs", "NSK-C", "Nashik CBS", "Nashik", ("Nashik", "Nasik", "Nashik CBS"), 20.0037, 73.7893, "Central Bus Stand in Nashik city.", False),
    Hub("stop_nashik_road", "NSK-R", "Nashik Road", "Nashik", ("Nashik", "Nasik", "Nashik Road"), 19.9533, 73.8409, "Boarding point near Nashik Road railway station.", False),
    Hub("stop_demo_destination", "DEMO", "Demo Destination", "Demo Destination", ("Demo Destination",), 17.1000, 74.1000, "Synthetic destination used to demonstrate a connection.", False),
)

# Eighteen real Maharashtra corridors plus the retained connection-demo leg.
CORRIDORS = (
    Corridor("stop_mumbai_central", "stop_pune_station", 210, 390, True),
    Corridor("stop_mumbai_central", "stop_nashik_mahamarg", 255, 420, True),
    Corridor("stop_mumbai_central", "stop_ratnagiri", 510, 650),
    Corridor("stop_pune_station", "stop_nashik_mahamarg", 255, 410, True),
    Corridor("stop_pune_station", "stop_ahilyanagar", 180, 300),
    Corridor("stop_pune_station", "stop_satara", 180, 240),
    Corridor("stop_pune_station", "stop_solapur", 270, 430, True),
    Corridor("stop_pune_station", "stop_kolhapur", 300, 480, True),
    Corridor("stop_nashik_cbs", "stop_sambhajinagar", 270, 430),
    Corridor("stop_nashik_cbs", "stop_jalgaon", 180, 300),
    Corridor("stop_ahilyanagar", "stop_sambhajinagar", 150, 260),
    Corridor("stop_sambhajinagar", "stop_nanded", 300, 500),
    Corridor("stop_jalgaon", "stop_amravati", 300, 480),
    Corridor("stop_amravati", "stop_nagpur", 180, 290, True),
    Corridor("stop_nanded", "stop_latur", 180, 280),
    Corridor("stop_latur", "stop_solapur", 210, 330),
    Corridor("stop_satara", "stop_kolhapur", 150, 230),
    Corridor("stop_sangli", "stop_kolhapur", 75, 140),
    Corridor("stop_satara", "stop_demo_destination", 90, 150),
)


def active_date_window(today: date | None = None) -> tuple[date, date]:
    local_today = today or datetime.now(IST).date()
    start = local_today + timedelta(days=1)
    return start, start + timedelta(days=SEED_DAYS - 1)


def _slug(stop_id: str) -> str:
    return stop_id.removeprefix("stop_").replace("_", "-")


def seed_database(session_factory: sessionmaker[Session], *, today: date | None = None) -> None:
    start_date, end_date = active_date_window(today)
    with session_factory() as session, session.begin():
        existing_stops = set(session.scalars(select(StopRow.id)))
        for hub in HUBS:
            if hub.key not in existing_stops:
                session.add(StopRow(
                    id=hub.key,
                    code=hub.code,
                    name=hub.name,
                    city=hub.city,
                    aliases=list(hub.aliases),
                    latitude=hub.latitude,
                    longitude=hub.longitude,
                    description=hub.description,
                    is_major_hub=hub.major,
                ))

        existing_routes = set(session.scalars(select(RouteRow.id)))
        existing_services = set(session.scalars(select(ServiceRow.id)))
        for corridor_index, corridor in enumerate(CORRIDORS):
            for origin, destination in ((corridor.origin, corridor.destination), (corridor.destination, corridor.origin)):
                route_id = f"route_{_slug(origin)}_{_slug(destination)}"
                if route_id not in existing_routes:
                    session.add(RouteRow(id=route_id, origin_stop_id=origin, destination_stop_id=destination, intermediate_stop_ids=[]))
                    existing_routes.add(route_id)

                first_departure = 12 * 60 if destination == "stop_demo_destination" else 7 * 60 + (corridor_index % 3) * 30
                second_departure = 16 * 60 if destination == "stop_demo_destination" else 13 * 60 + (corridor_index % 4) * 30
                service_specs = (
                    ("morning", first_departure, "SHIVNERI" if corridor.premium else "SEMI_LUXURY", corridor.ordinary_fare + (110 if corridor.premium else 40)),
                    ("afternoon", second_departure, "E_SHIVAI" if corridor.premium else "ORDINARY", corridor.ordinary_fare + (80 if corridor.premium else 0)),
                )
                for label, departure_minutes, service_type, fare in service_specs:
                    service_id = f"service_{_slug(origin)}_{_slug(destination)}_{label}"
                    if service_id not in existing_services:
                        origin_city = next(h.city for h in HUBS if h.key == origin)
                        destination_city = next(h.city for h in HUBS if h.key == destination)
                        session.add(ServiceRow(
                            id=service_id,
                            name=f"{origin_city} {destination_city} {service_type.replace('_', ' ').title()}",
                            service_type=service_type,
                            route_id=route_id,
                            is_ac=service_type in {"SHIVNERI", "E_SHIVAI"},
                            base_fare=fare,
                            currency="INR",
                            capacity=6,
                            amenities=["Reserved seating"] + (["Air conditioned"] if service_type in {"SHIVNERI", "E_SHIVAI"} else []),
                            departure_minutes=departure_minutes,
                            duration_minutes=corridor.duration_minutes,
                        ))
                        existing_services.add(service_id)

        session.flush()
        services = list(session.scalars(select(ServiceRow)))
        existing_trips = set(session.scalars(select(TripRow.id)))
        current = start_date
        while current <= end_date:
            for service in services:
                trip_id = f"trip_{service.id.removeprefix('service_')}_{current.isoformat()}"
                if trip_id in existing_trips:
                    continue
                departure = datetime.combine(current, time.min, tzinfo=IST) + timedelta(minutes=service.departure_minutes)
                arrival = departure + timedelta(minutes=service.duration_minutes)
                session.add(TripRow(
                    id=trip_id,
                    service_id=service.id,
                    service_date=current,
                    departure_at=departure,
                    arrival_at=arrival,
                    status="SCHEDULED",
                ))
                for number in range(1, service.capacity + 1):
                    session.add(SeatRow(
                        id=f"seat_{trip_id}_{number}",
                        trip_id=trip_id,
                        number=str(number),
                        status="BOOKED" if number == 1 and (corridor_hash(trip_id) % 4 == 0) else "AVAILABLE",
                        seat_type="WINDOW" if number in {1, 2, 5, 6} else "AISLE",
                    ))
                existing_trips.add(trip_id)
            current += timedelta(days=1)


def corridor_hash(value: str) -> int:
    """Stable hash used only for plausible baseline inventory."""
    return sum((index + 1) * ord(character) for index, character in enumerate(value))
