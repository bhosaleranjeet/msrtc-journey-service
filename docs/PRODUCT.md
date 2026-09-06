# Product

## Product promise

This prototype helps a passenger describe a journey in everyday language, then handles MSRTC terminology and booking complexity on their behalf.

It is a public, mobile-first hackathon demonstration. All unavailable transport, payment, tracking and government dependencies are synthetic and must be labelled as such.

## Primary passenger

A Maharashtra bus passenger who knows where they want to go but may not know the correct depot, stop, service code, reservation terminology, or cancellation rules.

## Primary outcome

Within about one minute, a passenger can search for a journey, understand available direct or connecting options, choose a seat, complete a mock booking, and receive a clear journey pass.

## Experience principles

- Ask for human places, not internal codes.
- Explain choices and recovery states in plain language.
- Prefer a useful connection over a dead-end “no buses found” message.
- Make transport truth deterministic and visibly distinguish mocks from real integrations.
- Treat accessibility, trust and mobile usability as core product requirements.

## MVP boundary

The MVP supports a scenario-led synthetic network with four clearly advertised demo journeys, direct journeys and one deterministic one-transfer route, independent seat selection per bus, a mock payment lifecycle, ticket issuance, cancellation/refund presentation, and a frontend-only demo access gate. It excludes real authentication, official or complete MSRTC network coverage, real payment/GPS integrations, and operational tooling.

## Demo scenarios

1. “Pune to Nashik tomorrow morning, AC” resolves to validated intent, presents direct options, and completes booking.
2. “Pune to Demo Destination” returns and books the deterministic Pune → Satara → Demo Destination connection.
3. A request outside the curated network is acknowledged and redirected to the available demo journeys without being presented as a system failure.

## Measures of success

- The golden path is understandable without prior MSRTC operational knowledge.
- Both demo scenarios work reliably with seeded data.
- A payment-success/booking-failure recovery state can be demonstrated.
- The interface remains usable if AI intent parsing is unavailable.
