# 004 — Connecting Journeys

- Status: complete
- Depends on: 002

## Goal

Offer a useful one-transfer journey whenever there is no appropriate direct service.

## In scope

- Deterministic one-transfer search over known trip data.
- Enforce a 15-minute minimum and 120-minute maximum transfer window.
- Reject unavailable, invalid and unreasonable connections.
- Calculate total duration and fare; rank valid options deterministically.
- Passenger-facing result presentation of both segments, transfer location and transfer duration.
- A deterministic Pune → Satara → Demo Destination scenario.

## Out of scope

- More than one transfer, arbitrary graph traversal, AI recommendation logic.

## Acceptance criteria

- Demo Destination returns the seeded connection when no direct trip exists.
- Too-short and too-long connections are excluded in automated tests.
- Results clearly distinguish direct and connecting journeys and expose totals.
- If neither direct nor valid connecting journeys exist, the UI gives a recoverable message.
