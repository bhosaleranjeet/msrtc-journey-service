# 006 — Passengers, Concessions and Payment

- Status: complete
- Depends on: 005

## Goal

Capture necessary passenger information and demonstrate a robust mock payment-to-confirmation lifecycle.

## In scope

- Passenger information API/UI with minimal required prototype data.
- Clearly labelled mock concession eligibility and calculated booking amount.
- Payment provider interface and `MockPaymentProvider`.
- Explicit lifecycle: SEATS_HELD → PAYMENT_PENDING → PAYMENT_RECEIVED → CONFIRMING → CONFIRMED or FAILED/REFUND_PENDING.
- Normal success and a deterministic recovery scenario where payment succeeds but booking confirmation fails and a refund begins.

## Out of scope

- Real gateway credentials, identity verification, real government concession checks.

## Acceptance criteria

- A successful payment alone never creates a ticket or marks a booking confirmed.
- Invalid transitions are rejected and tested.
- The recovery scenario clearly communicates payment, confirmation and refund states.
- Mock eligibility and payment behavior are visibly disclosed.
- A terminal booking-confirmation failure releases held seats immediately; refund processing continues independently.
