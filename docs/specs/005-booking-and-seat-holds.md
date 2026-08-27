# 005 — Booking and Seat Holds

- Status: complete
- Depends on: 002

## Goal

Let a passenger select an available seat and create a time-bound booking draft backed by server-side state.

## In scope

- Booking aggregate and explicit state transitions: DRAFT → SEATS_HELD.
- Mobile-friendly, accessible seat map with non-colour-only status cues.
- Server-side seat availability validation and hold expiry (10 minutes).
- Booking API for creation, seat selection and retrieval by booking identifier.
- Expired holds return seats to availability.

## Out of scope

- Passenger details, payment, confirmation, ticketing, sophisticated concurrency control.

## Acceptance criteria

- A selected available seat becomes HELD for the booking and cannot be selected by another booking during the hold.
- An unavailable or expired seat selection returns a machine-readable error.
- Hold expiry restores the seat to AVAILABLE.
- Booking state transitions are domain/service methods, not arbitrary API assignments.
