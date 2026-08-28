# 009 — Expanded Maharashtra Network and Persistent Bookings

- Status: implemented
- Depends on: 002, 004, 005, 006, 007, 008

## Goal

Make the public prototype feel like a credible network product while keeping every operational fact deterministic, synthetic, and clearly separated from AI interpretation.

## Product scope

- Fifteen major Maharashtra hubs, with extra Nashik stop choices and the retained Demo Destination fixture.
- Eighteen bidirectional real-city corridors, two departures per direction, and one retained synthetic connection-demo leg.
- Ordinary, Semi-Luxury, Shivneri, and E-Shivai examples over a rolling 14-day window beginning tomorrow in India.
- Direct services remain bookable. One-transfer results remain non-bookable previews.
- Homepage stop suggestions, coverage disclosure, four direct-route shortcuts, and explicit passenger-data safety copy.

## Persistence scope

- SQLAlchemy transport, booking, seat-hold, booked-inventory, passenger, and ticket repositories.
- SQLite fallback when `DATABASE_URL` is absent; PostgreSQL through a pooled Neon URL in production.
- Alembic migration and an idempotent startup seed. Existing trip and inventory records are never overwritten.
- Separate `booking_seats` and `seat_holds` tables so deleting a transient hold cannot delete a confirmed seat assignment.
- Transactional hold acquisition with row locks on PostgreSQL and a unique seat-hold key as the final conflict guard.

## API additions

- `/api/health` reports `data_mode: seeded_synthetic`.
- `/api/demo-network` retains stops, services, and trips while adding coverage dates and network counts. `?summary=true` omits the large service/trip collections.
- Searches outside the active seed window return `DATE_OUTSIDE_DEMO_WINDOW` with `start_date` and `end_date` details.

## Acceptance criteria

- Re-running the seed does not duplicate data.
- Fifteen major hubs and both directions of seeded corridors are searchable.
- Confirmed and cancelled bookings, booked seat assignments, and issued tickets survive repository/application recreation.
- Two competing holds for one seat result in one success and one conflict.
- Hold expiry, terminal confirmation failure, and cancellation release the appropriate inventory.
- Frontend search fields suggest supported stops and constrain the date picker to the active window.
- UI and documentation explicitly say schedules, availability, and fares are illustrative synthetic data.
- Backend tests, frontend lint/build, and the production Docker build pass.

## Deliberate exclusions

- Runtime AI-generated routes, fares, schedules, or inventory.
- Claims of official MSRTC data coverage.
- Booking both legs of a connecting itinerary.
- Production authentication or collection of real passenger identity data.

## Data-source boundary

The [official reservation portal](https://npublic.msrtcors.com/reservation-home?deviceType=browser) does not expose a suitable public operational API. The available [unofficial GTFS listing](https://mobilitydatabase.org/feeds/gtfs/mdb-2336), sourced from an [independent GitHub project](https://github.com/iqskr/gtfs), covers only two routes and expired in June 2025. It is therefore not used as product data. AI interprets passenger language only; it cannot generate operational facts.
