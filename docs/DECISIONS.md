# Decisions

Record material product and architectural choices here. Each entry explains why a choice was made; factual implementation history belongs in `CHANGELOG.md`.

## ADR-001 — Prototype integrations are mock adapters

- Status: accepted
- Date: 2026-08-23

The application will use explicit mock transport, payment and tracking adapters because private MSRTC and government systems are out of scope. This preserves honest demo messaging and keeps future integration replacement isolated from domain logic.

## ADR-002 — One transfer is the MVP routing limit

- Status: accepted
- Date: 2026-08-23

The journey engine supports direct journeys and a maximum of one transfer. This demonstrates network planning without introducing arbitrary graph traversal or unreliable hackathon scope.

## ADR-003 — AI interprets, deterministic services decide

- Status: accepted
- Date: 2026-08-23

OpenAI may parse natural-language travel requests and assist with ambiguity only from known stop candidates. Schedules, inventory, fares, connections, payments, booking status and refund eligibility remain deterministic application data and logic.

## ADR-004 — Deploy the prototype as one same-origin container

- Status: accepted
- Date: 2026-08-23

The production image builds the frontend and serves it from the FastAPI application. This removes the hard-coded localhost dependency, avoids unnecessary cross-origin configuration, and lets a standard host provide HTTPS for both the UI and API. A hosting account remains responsible for the public URL and secret configuration.

## ADR-005 — Use Tailwind utilities for the renewed frontend presentation

- Status: accepted
- Date: 2026-08-23

Frontend presentation is implemented with Tailwind utility classes through the official Vite plugin. This gives each screen one visible source of layout and visual truth, reduces fragile selector overrides, and keeps responsive and interaction states beside the relevant markup. The legacy component stylesheet is limited to global browser defaults and reduced-motion behavior.

## ADR-006 — Use restraint and continuity across the complete journey

- Status: accepted
- Date: 2026-08-26

The Maharashtra illustration and frosted search surface are reserved for the planning homepage. Transactional stages use a warm neutral page, solid white work surfaces, consistent 16-pixel radii, restrained shadows, MSRTC red actions, and green only for confirmed or successful states. Every stage scrolls naturally rather than forcing content into the viewport. This keeps the regional identity distinctive without allowing decorative effects to compete with search, seat selection, payment, or cancellation decisions.

## ADR-007 — Split Vercel frontend from the stateful prototype backend

- Status: accepted
- Date: 2026-08-28

The public submission may host the static Vite frontend on Vercel while retaining the FastAPI backend as a single long-running Render Docker service. Booking, seat-hold, and ticket repositories are process-local in this prototype, so deploying them as independently scaling functions would not provide reliable continuity across the transaction flow. An all-serverless deployment requires persistent repositories first.

## ADR-008 — Keep the synthetic service day current

- Status: accepted
- Date: 2026-08-28

The mock transport provider seeds tomorrow in the Asia/Kolkata timezone when the backend starts, and the frontend uses the same timezone for its initial date. This preserves deterministic data within each running demo while preventing the public prototype from presenting a permanently stale service date. Natural-language parsing uses the backend-owned demo reference date when the client does not explicitly supply one.

## ADR-009 — Use a frontend-only gate for controlled prototype access

- Status: accepted
- Date: 2026-08-28

The submitted prototype uses one build-time-configurable username and password to place a lightweight access step before the journey planner. Authentication state lasts only for the current browser tab and the interface explicitly states that this is not secure authentication. The credentials are necessarily visible in the compiled frontend and no backend endpoint treats the gate as authorization; production identity and access control remain out of scope.

## ADR-010 — Remember the latest prototype booking reference in the browser

- Status: accepted
- Date: 2026-08-28

The frontend stores only the latest confirmed booking ID in local storage so the single demo user can reopen a journey after refresh or sign-in. The booking, ticket, and cancellation state are always reloaded from the backend rather than duplicated in browser storage. This provides a credible “My booking” path without introducing a customer-account or booking-list API. Its original process-local persistence limitation is superseded by ADR-011.

## ADR-011 — Persist deterministic synthetic transport and booking state in SQL

- Status: accepted
- Date: 2026-08-28

The prototype uses SQLAlchemy repositories with SQLite as the zero-configuration local fallback and PostgreSQL as the production database. A rolling, idempotent seed supplies broad but explicitly illustrative Maharashtra coverage; it never claims official MSRTC truth. Confirmed seats are stored independently from temporary holds, and PostgreSQL row locking plus a unique hold key protects seat acquisition. This replaces the process-local limitation described when ADR-007 and ADR-010 were written.

## ADR-012 — AI may interpret searches but cannot create transport operations

- Status: accepted
- Date: 2026-08-28

Natural-language AI output is limited to origin, destination, date, time, and preferences validated against typed schemas. Routes, departures, fares, availability, connections, bookings, and refunds must come from deterministic repository data. This avoids presenting plausible model output as a real bus service and keeps the prototype reproducible even though no suitable official open MSRTC API is available.
