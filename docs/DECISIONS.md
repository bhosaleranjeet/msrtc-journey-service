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

## ADR-013 — Extend bookings compatibly for one connected itinerary

- Status: accepted
- Date: 2026-09-05

Round 2 retains the existing single-trip booking aggregate and adds an ordered `booking_trips` relation for at most two deterministic trips. The first trip remains the legacy `trip_id`, preserving current clients and cancellation behavior, while the ordered itinerary supports connected fares, inventory checks, and Journey Pass presentation. Assignment, tracking, and complaints remain explicitly synthetic customer-facing demonstrations; no operational MSRTC integration is implied.

## ADR-014 — Use a scenario-led synthetic network

- Status: accepted
- Date: 2026-09-05

The prototype exposes six deliberate synthetic corridors rather than broad illustrative statewide coverage: Mumbai–Pune, three Pune–Nashik stop variants, Pune–Satara, and Satara–Demo Destination. The homepage advertises only four testable examples. This makes supported behavior clear, ensures every proposed Nashik stop is a valid destination, and retains one deterministic connection demonstration without implying a reliable statewide timetable.

## ADR-015 — Use server-side language detection for voice input

- Status: accepted
- Date: 2026-09-05

Browser speech recognition is retained only as a local end-of-speech signal because its language support, especially for Marathi in Safari, is inconsistent and tied to one locale. A short recording made only after the passenger presses the microphone is sent to the configured OpenAI transcription service without a language hint, allowing Marathi, English, and common code-switching to be identified. Audio is not stored; the resulting transcript continues through the existing deterministic intent and journey pipeline. If microphone access or transcription is unavailable, typed search remains available.

## ADR-016 — Localize presentation while preserving canonical transport identity

- Status: accepted
- Date: 2026-09-05

English and Marathi presentation use one keyed catalog, including dynamic statuses, errors, stop descriptions, booking stages, tracking and complaint copy. Stop and route identifiers remain canonical at the API boundary and are localized only for display. This prevents translated labels from becoming accidental transport keys and ensures voice, typed, and manual searches all enter the same deterministic stop-resolution pipeline.

## ADR-017 — Keep synthetic aftercare isolated and transient

- Status: accepted
- Date: 2026-09-05

Tracking states, map positions, notification copy and complaint acknowledgements are customer-facing simulations behind a dedicated aftercare service. They are intentionally process-local because the prototype has no real user account, vehicle assignment, GPS, notification, evidence-storage or MSRTC complaint integration. Optional complaint images are previewed locally; the API validates and acknowledges only their filename, MIME type, and size, never the image bytes. Confirmed bookings and tickets remain durable SQL records, every aftercare screen declares its synthetic status, and the adapter can be replaced without changing booking truth.

## ADR-018 — Remember a small recent-booking index in the browser

- Status: accepted
- Date: 2026-09-05

ADR-010's single reference is superseded by a browser-local index of at most five confirmed booking IDs and display summaries. Selecting one always reloads authoritative booking and ticket state from the backend; the browser does not store payment, cancellation, or complaint truth. This gives reviewers a useful “My bookings” experience without implying that the frontend-only access gate is a real customer account.
