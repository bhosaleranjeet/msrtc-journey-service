# 007 — Ticket and Booking Management

- Status: complete
- Depends on: 006

## Goal

Issue a clear journey pass only after confirmation and let passengers understand cancellation and refund outcomes.

## In scope

- Dedicated ticket issuance after a confirmed booking only.
- Journey pass with passenger-facing journey, boarding, arrival, service, seat, passenger, payment and mock QR/ticket identifier.
- Booking management view by booking ID.
- Backend cancellation preview calculating eligibility, deadline, deduction, non-refundable charges and expected refund.
- Cancellation and simulated refund state progression.

## Out of scope

- Real QR validation, banking integration, authentication/accounts.

## Acceptance criteria

- No ticket can be created for an unconfirmed booking.
- Cancellation policy is calculated by the backend and presented without requiring the passenger to interpret rules.
- Eligible cancellation creates a visible refund lifecycle; ineligible cancellation has a clear reason.
- Boundary tests cover cancellation windows and refund amounts.
