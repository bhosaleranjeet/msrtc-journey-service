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
