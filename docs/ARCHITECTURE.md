Architecture — Citizen-First MSRTC Journey Platform

1. Purpose

This document defines the technical architecture, system boundaries, domain responsibilities, and engineering constraints for the MSRTC journey-planning prototype.

The goal is to build a credible end-to-end system that demonstrates:

* natural-language journey search
* intelligent stop resolution
* direct bus discovery
* connecting journey planning
* seat selection
* passenger and concession handling
* booking lifecycle management
* mock payment processing
* ticket issuance
* cancellation and refund handling

This is a hackathon prototype, so the architecture should remain simple enough to build quickly while still demonstrating sound product and backend thinking.

The system must not depend on unauthorized MSRTC APIs or private government infrastructure.

⸻

2. Architectural Principles

The following principles are mandatory.

2.1 AI interprets; deterministic systems decide

OpenAI models may interpret what the passenger means.

They must not become the source of truth for transport operations.

AI may determine:

* intended origin
* intended destination
* travel date
* approximate time preference
* travel preferences
* ambiguous place interpretation

AI must not determine:

* whether a bus exists
* departure or arrival times
* fares
* seat availability
* route connectivity
* payment status
* reservation status
* refund eligibility

Operational truth comes from deterministic application data and services.

⸻

2.2 The frontend does not contain domain logic

React components should be responsible primarily for:

* rendering
* interaction
* local presentation state
* calling APIs
* displaying application state

Business rules such as:

* route calculation
* transfer eligibility
* fares
* booking state
* refund calculation

must live in backend/domain services.

⸻

2.3 Mocked infrastructure must remain explicit

The prototype uses synthetic data and simulated integrations.

Mocked systems may include:

* MSRTC schedules
* route inventory
* seat inventory
* live bus tracking
* payment gateway
* ticket generation
* refund processing

The architecture should allow these mocked adapters to eventually be replaced by real integrations without rewriting the application domain.

⸻

2.4 Prefer boring architecture

This is not a distributed-systems project.

Do not introduce:

* microservices
* Kafka
* event buses
* Kubernetes
* unnecessary queues
* complex caching infrastructure
* premature abstraction layers

unless a specification later proves them necessary.

Prefer:

one frontend + one backend + one database + OpenAI + mocked adapters.

⸻

3. High-Level Architecture

┌─────────────────────────────────────────────────────────────┐
│                         Passenger                           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 React / TypeScript Frontend                 │
│                                                             │
│  Search                                                     │
│  Results                                                    │
│  Journey Details                                            │
│  Seat Selection                                             │
│  Passenger Details                                          │
│  Payment                                                    │
│  Ticket                                                     │
│  Manage Booking                                             │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       FastAPI Backend                       │
│                                                             │
│  API Layer                                                  │
│       │                                                     │
│       ├───────────────┬────────────────┬─────────────────┐   │
│       ▼               ▼                ▼                 ▼   │
│  Intent Service   Journey Service   Booking Service   Ticket │
│       │               │                │              Service│
│       │               │                │                  │   │
│       ▼               ▼                ▼                  ▼   │
│  OpenAI Adapter   Route Engine    Booking State       Ticket │
│                   + Fare Logic      Machine           Domain │
│       │               │                │                  │   │
│       └───────────────┼────────────────┼──────────────────┘   │
│                       │                │                      │
│                       ▼                ▼                      │
│                  Repository Layer / Domain Data              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       PostgreSQL                            │
│                                                             │
│ Stops │ Routes │ Services │ Seats │ Bookings │ Payments    │
│ Passengers │ Tickets │ Refunds                          │
└─────────────────────────────────────────────────────────────┘
External / Simulated Systems
┌────────────────────┐
│ OpenAI API          │
└────────────────────┘
┌────────────────────┐
│ Mock MSRTC Adapter  │
└────────────────────┘
┌────────────────────┐
│ Mock Payment        │
│ Gateway             │
└────────────────────┘
┌────────────────────┐
│ Mock Tracking       │
│ Provider            │
└────────────────────┘

⸻

4. Technology Stack

Frontend

Recommended:

* React
* TypeScript
* Vite
* React Router
* Tailwind CSS
* lightweight global state only where required
* TanStack Query or equivalent for server state

The frontend should remain mobile-first.

Avoid introducing a large state-management framework unless state complexity proves necessary.

⸻

Backend

Recommended:

* Python
* FastAPI
* Pydantic
* SQLAlchemy
* Uvicorn
* PostgreSQL

Backend responsibilities include:

* API contracts
* validation
* journey search
* route planning
* fare calculation
* booking lifecycle
* payment simulation
* ticket issuance
* cancellation/refunds
* OpenAI orchestration

⸻

AI

OpenAI API.

Use structured outputs whenever possible.

Model responses must be validated using typed schemas before entering the transport domain.

⸻

Database

PostgreSQL is the preferred persistence layer.

For an initial prototype, SQLite may be used temporarily if it materially accelerates setup, but application data access should remain repository-based so moving to PostgreSQL does not affect domain logic.

Implementation status (2026-08-28): SQLAlchemy repository protocols now back both environments. Local development falls back to SQLite, while production accepts a pooled PostgreSQL `DATABASE_URL`. Alembic owns schema migration and an idempotent startup seed creates the active 14-day synthetic network without replacing trips that may already have bookings. `booking_seats` is durable confirmed inventory; `seat_holds` is transient contention state.

⸻

5. Backend Layering

The backend should follow approximately:

app/
├── api/
│   ├── routes/
│   └── dependencies/
│
├── domain/
│   ├── journeys/
│   ├── bookings/
│   ├── payments/
│   ├── passengers/
│   └── tickets/
│
├── services/
│   ├── intent_service.py
│   ├── journey_service.py
│   ├── booking_service.py
│   ├── payment_service.py
│   └── ticket_service.py
│
├── repositories/
│
├── integrations/
│   ├── openai/
│   ├── msrtc/
│   ├── payments/
│   └── tracking/
│
├── models/
│
├── schemas/
│
├── core/
│
└── main.py

This is guidance, not a requirement to create empty directories prematurely.

Create modules only when required by implementation.

⸻

6. Core Domain Model

The transport domain should revolve around the following concepts.

Stop

Represents a boarding/alighting location.

Example fields:

id
code
name
city
aliases
latitude
longitude
description

Example:

id: stop_nashik_mahamarg
code: NSKMRG
name: Nashik Mahamarg
city: Nashik
aliases:
  - Nashik
  - Nasik
  - Nashik Highway

Aliases help resolve human terminology without changing canonical transport data.

⸻

Route

Represents logical connectivity between stops.

Example:

route_id
origin_stop
destination_stop
intermediate_stops

Routes represent network structure.

They are not individual bus departures.

⸻

Service

Represents an actual scheduled bus journey.

Example fields:

service_id
service_name
service_type
route_id
departure_time
arrival_time
fare
capacity
amenities

Example service types:

* Ordinary
* Shivneri
* E-Shivai
* Semi-Luxury

⸻

Trip Instance

A service operating on a particular date.

Example:

trip_id
service_id
journey_date
departure_datetime
arrival_datetime
seat_inventory
status

This separation avoids embedding date-specific inventory into the service definition.

⸻

Seat

Example:

seat_id
trip_id
seat_number
status
seat_type

Status:

AVAILABLE
HELD
BOOKED

⸻

Journey

A journey is the passenger-facing travel solution.

It may contain:

one segment

or:

multiple segments

For the hackathon MVP, maximum supported segments:

2

meaning at most one transfer.

⸻

Journey Segment

Example:

trip_id
origin
destination
departure
arrival
fare

⸻

Passenger

Example:

name
age
gender
concession_type
concession_proof_type

Avoid storing unnecessary sensitive information in the prototype.

⸻

Booking

Central transaction aggregate.

Example:

booking_id
journey
passengers
selected_seats
fare
status
created_at
expires_at

⸻

Payment

Example:

payment_id
booking_id
amount
status
provider_reference
created_at

⸻

Ticket

Created only when booking reaches confirmed state.

Example:

ticket_id
booking_id
ticket_number
qr_payload
issued_at

⸻

Refund

Example:

refund_id
booking_id
payment_id
amount
status
created_at

⸻

7. Journey Search Architecture

Journey search should be separated into stages.

Passenger Query
      │
      ▼
Intent Resolution
      │
      ▼
Stop Resolution
      │
      ▼
Journey Search
      │
      ├── Direct Search
      │
      └── One-Transfer Search
      │
      ▼
Ranking
      │
      ▼
Passenger Results

⸻

8. Natural-Language Intent Service

Example input:

Pune to Nashik tomorrow morning, AC

The OpenAI adapter should return structured data similar to:

{
  "origin": "Pune",
  "destination": "Nashik",
  "travel_date": "2026-08-24",
  "time_window": {
    "start": "06:00",
    "end": "12:00"
  },
  "preferences": {
    "ac": true
  }
}

The returned structure must be validated.

If parsing fails:

* do not invent missing values
* return a recoverable error
* let the user modify the structured search manually

The AI result should then pass to the stop-resolution layer.

⸻

9. Stop Resolution

Natural language should never directly query route inventory.

Example:

User input:
Nashik

Stop resolver may return:

Nashik Mahamarg
Nashik CBS
Nashik Road

The resolver may use:

1. canonical stop name
2. aliases
3. fuzzy matching
4. geographic context
5. AI interpretation if necessary

Deterministic resolution should be preferred before calling OpenAI.

AI can help rank or interpret ambiguous candidates but must only select from known stop records.

It cannot invent a stop.

⸻

10. Journey Engine

The journey engine operates exclusively on known transport data.

It should support:

Direct journey

Origin → Destination

Search services that:

* serve requested origin
* serve requested destination
* operate on requested date
* satisfy time constraints
* have sufficient inventory

⸻

One-transfer journey

Origin → Transfer → Destination

The engine should:

1. find services leaving origin
2. identify reachable transfer stops
3. find subsequent services reaching destination
4. verify connection timing
5. calculate total duration
6. calculate total fare
7. reject unreasonable connections
8. rank valid journeys

⸻

11. Transfer Rules

For MVP, transfer logic should remain deterministic.

Suggested values:

minimum transfer:
15 minutes
maximum transfer:
120 minutes

These values may later become configuration.

A candidate connection is valid when:

second_departure >= first_arrival + minimum_transfer

and:

second_departure <= first_arrival + maximum_transfer

Avoid arbitrary multi-hop graph traversal during the hackathon unless required.

Maximum:

one transfer.

⸻

12. Journey Ranking

The system may produce several valid journeys.

Ranking should be deterministic.

Possible metrics:

total_duration
total_fare
number_of_transfers
departure_time
arrival_time
service_preference_match

UI labels may include:

* Recommended
* Cheapest
* Fastest
* Earliest

The recommendation algorithm does not require AI.

An initial weighted ranking is sufficient.

⸻

13. Booking Architecture

The booking lifecycle must explicitly distinguish:

payment state

from:

reservation state

This is important.

The lifecycle should resemble:

JOURNEY_SELECTED
       │
       ▼
SEATS_HELD
       │
       ▼
PAYMENT_PENDING
       │
       ▼
PAYMENT_RECEIVED
       │
       ▼
BOOKING_CONFIRMING
       │
       ├───────────────┐
       ▼               ▼
CONFIRMED           FAILED
       │               │
       ▼               ▼
TICKET_ISSUED      REFUND_PENDING
                       │
                       ▼
                    REFUNDED

Do not implement booking as:

payment success = ticket success

⸻

14. Seat Hold

Before payment:

selected seats should enter:

HELD

A hold should have an expiry time.

Example:

10 minutes

If booking does not complete before expiration:

HELD → AVAILABLE

The prototype does not require sophisticated concurrency handling, but the domain model should represent the concept correctly.

⸻

15. Booking State Machine

Suggested booking states:

DRAFT
SEATS_HELD
PAYMENT_PENDING
PAYMENT_RECEIVED
CONFIRMING
CONFIRMED
FAILED
CANCELLED

Transitions should happen through explicit domain/service methods.

Avoid directly setting arbitrary booking statuses from API handlers.

Example:

booking.confirm_payment()
booking.confirm_reservation()
booking.cancel()

Invalid transitions should be rejected.

⸻

16. Payment Adapter

Define a payment-provider interface.

Example conceptual contract:

create_payment()
verify_payment()
refund_payment()

For this prototype:

MockPaymentProvider

implements it.

This allows future replacement with:

RazorpayAdapter
UPIProvider
MSRTCPaymentAdapter

without changing booking-domain logic.

The prototype should support at least:

Success

payment successful
booking successful

Recovery scenario

payment successful
booking confirmation delayed/failed
refund initiated

This second state demonstrates system resilience.

⸻

17. Ticket Issuance

A ticket must only be issued when:

booking.status == CONFIRMED

Ticket creation should be handled by a dedicated domain/service layer.

Ticket contains passenger-facing information first:

* journey
* departure
* boarding
* arrival
* bus
* seat
* passenger
* fare
* ticket number

Operational identifiers may be secondary.

QR data can be simulated.

⸻

18. Cancellation Architecture

Cancellation must evaluate:

current time
scheduled origin departure time
booking status
applicable cancellation rule

The passenger should not calculate policy manually.

The backend should return:

{
  "can_cancel": true,
  "deadline": "...",
  "paid_amount": 495,
  "deduction": 49.5,
  "non_refundable_charges": 10,
  "refund_amount": 435.5
}

Frontend merely presents this result.

⸻

19. Refund Lifecycle

Suggested statuses:

NOT_REQUIRED
PENDING
PROCESSING
COMPLETED
FAILED

The UI can simulate progression.

No real banking integration is required.

⸻

20. API Architecture

API should be resource/capability oriented.

Potential routes:

POST   /api/intent/parse
GET    /api/stops/search
POST   /api/journeys/search
GET    /api/trips/{trip_id}
POST   /api/bookings
GET    /api/bookings/{booking_id}
POST   /api/bookings/{booking_id}/seats
POST   /api/bookings/{booking_id}/passengers
POST   /api/bookings/{booking_id}/payment
POST   /api/bookings/{booking_id}/confirm
GET    /api/bookings/{booking_id}/ticket
GET    /api/bookings/{booking_id}/cancellation-preview
POST   /api/bookings/{booking_id}/cancel
GET    /api/bookings/{booking_id}/refund

Exact endpoints can evolve through individual feature specs.

Do not implement all routes in advance.

⸻

21. API Error Contract

Errors should be machine-readable.

Suggested structure:

{
  "error": {
    "code": "NO_DIRECT_JOURNEY",
    "message": "No direct service was found.",
    "details": {}
  }
}

Potential codes:

INVALID_JOURNEY_QUERY
AMBIGUOUS_STOP
STOP_NOT_FOUND
NO_JOURNEY_FOUND
SEAT_UNAVAILABLE
SEAT_HOLD_EXPIRED
INVALID_BOOKING_STATE
PAYMENT_FAILED
BOOKING_CONFIRMATION_FAILED
CANCELLATION_NOT_ALLOWED

Frontend should not parse human error strings to determine behavior.

⸻

22. Repository / Persistence Boundary

Business services should not directly embed SQL queries.

Use repositories where persistence is necessary.

Examples:

StopRepository
TripRepository
BookingRepository
PaymentRepository
TicketRepository

For MVP, repository implementations may be simple.

The goal is to avoid coupling journey/business logic to storage technology.

⸻

23. Synthetic Data Strategy

The prototype should contain a small but carefully designed network.

Do not attempt to model all MSRTC routes.

The dataset should exist specifically to demonstrate:

1. normal direct route
2. ambiguous destination
3. multiple service choices
4. one connecting journey
5. seat availability
6. concession
7. payment recovery
8. cancellation/refund

Example network:

Pune
├── Nashik
├── Mumbai
├── Satara
└── Kolhapur
Satara
└── Demo Destination

At least one destination should deliberately have:

no Pune direct route

but:

Pune → Satara
Satara → Destination

so the connecting-route experience is deterministic during the demo.

⸻

24. Demo Reliability

Hackathon demonstration reliability takes priority over simulated realism.

The golden demo dataset must be deterministic.

For example:

Pune → Nashik

must always produce several direct services.

And:

Pune → Demo Destination

must always produce the intended one-transfer journey.

Avoid randomized demo-critical availability.

⸻

25. Frontend Architecture

Suggested structure:

src/
├── app/
├── pages/
├── features/
│   ├── search/
│   ├── journeys/
│   ├── seats/
│   ├── booking/
│   ├── payment/
│   ├── ticket/
│   └── cancellation/
│
├── components/
├── api/
├── hooks/
├── types/
└── utils/

Prefer feature-oriented organization over one giant shared-components architecture.

⸻

26. Frontend State

Separate:

Server state

Examples:

* journey results
* trip details
* booking
* payment state
* ticket
* refund

Use API/query state.

Temporary UI state

Examples:

* selected filter
* open modal
* form step
* map panel

Keep local where possible.

Booking identity

A booking ID returned by the backend should become the source of truth for later booking steps.

Avoid keeping the complete booking transaction only in browser memory.

⸻

27. URL Structure

The user should be able to refresh major screens where practical.

Potential routes:

/
/search
/journeys
/journeys/:journeyId
/booking/:bookingId/seats
/booking/:bookingId/passengers
/booking/:bookingId/payment
/booking/:bookingId/ticket
/booking/:bookingId/manage

Exact structure can be refined through frontend specs.

⸻

28. Accessibility

Architecture and component design must allow:

* keyboard navigation
* semantic HTML
* proper focus states
* labelled form controls
* sufficient contrast
* screen-reader-friendly errors
* mobile touch targets
* non-color-only seat-state indicators

Accessibility should not be deferred to the final day.

⸻

29. Observability

Keep observability lightweight.

Backend should log important domain events such as:

intent_parsed
journey_searched
connection_found
booking_created
seat_held
payment_received
booking_confirmed
ticket_issued
booking_cancelled
refund_initiated

Do not log sensitive passenger information unnecessarily.

Structured logs are preferred.

⸻

30. Security

This is a prototype but basic security discipline still applies.

Never commit:

* OpenAI API keys
* database passwords
* secrets
* payment credentials

Use environment variables.

Example:

OPENAI_API_KEY
DATABASE_URL
APP_ENV

Include:

.env.example

without real secrets.

⸻

31. Authentication

Authentication is explicitly outside the hackathon MVP unless later required.

A booking may be accessed through its generated booking identifier within the prototype.

Do not spend implementation time building:

* registration
* passwords
* OTP authentication
* social login
* user profile systems

unless a later specification changes this decision.

⸻

32. Deployment

Preferred architecture:

Frontend
   │
Static/Web deployment
   │
   ▼
FastAPI Backend
   │
   ▼
Hosted PostgreSQL

The exact hosting provider may be selected later based on speed and hackathon constraints.

Deployment requirements:

* public HTTPS URL
* frontend and backend accessible publicly
* secrets configured outside source control
* deterministic demo data
* OpenAI integration available in deployed environment

⸻

33. Testing Strategy

Testing effort should focus on business-critical deterministic logic.

Highest priority:

Journey Engine

Test:

* direct route
* no direct route
* valid transfer
* transfer too short
* transfer too long
* multiple candidates
* ranking

Booking State Machine

Test:

* valid transitions
* invalid transitions
* seat hold
* payment success
* confirmation failure
* cancellation

Refund Calculation

Test boundary conditions around cancellation windows.

Intent Parser

Use contract/schema tests.

Do not make CI dependent on live OpenAI responses.

Mock AI responses in automated tests.

⸻

34. AI Failure Handling

The application must remain usable when AI fails.

Example:

Natural-language search fails.

Instead of:

Something went wrong.

show parsed fields or the standard structured search form:

From
To
Date
Time

AI enhances search.

It must not become a single point of failure for core journey booking.

⸻

35. Integration Boundaries

All external systems should be represented behind adapters.

OpenAIProvider
TransportProvider
PaymentProvider
TrackingProvider

Current implementations:

OpenAI API
MockTransportProvider
MockPaymentProvider
MockTrackingProvider

This makes the prototype’s mocked nature structurally explicit.

⸻

36. Things We Are Intentionally Not Building

Unless later specifications explicitly change scope:

* real MSRTC integration
* scraping private MSRTC systems
* complete Maharashtra route coverage
* real payment processing
* real GPS tracking
* authentication
* user profiles
* admin portal
* fleet management
* conductor tools
* depot operations
* arbitrary multi-hop routing
* AI chatbot
* recommendation engine based on user history
* dynamic pricing
* loyalty system

⸻

37. Architecture Invariants

These rules must remain true throughout implementation.

INV-001

AI may interpret transport requests but may not create operational transport truth.

INV-002

No ticket exists without a confirmed booking.

INV-003

Successful payment does not automatically imply successful booking.

INV-004

Route connectivity is calculated deterministically.

INV-005

At most one transfer is supported by the MVP journey engine.

INV-006

UI components do not own booking business rules.

INV-007

Mocked infrastructure must not be presented as a real MSRTC integration.

INV-008

Demo-critical scenarios must remain deterministic.

INV-009

Domain rules belong in backend/domain services rather than frontend presentation code.

INV-010

When AI is unavailable, structured journey search remains functional.

⸻

38. Architecture Decision Process

If implementation requires violating or materially changing anything in this document:

1. do not silently make the change
2. determine whether the spec explicitly requires it
3. document the decision in docs/DECISIONS.md
4. update this document if the architectural truth has permanently changed

Implementation details that do not alter system boundaries do not require architecture-document updates.

⸻

39. Target End State

At completion, the architecture should support the following chain cleanly:

"I want to go from Pune to Nashik tomorrow morning, AC"
                         │
                         ▼
                 OpenAI Intent Parser
                         │
                         ▼
                Validated Search Intent
                         │
                         ▼
                  Stop Resolution
                         │
                         ▼
                  Journey Engine
                         │
                 ┌───────┴────────┐
                 │                │
                 ▼                ▼
            Direct Route    Connecting Route
                 │                │
                 └───────┬────────┘
                         ▼
                  Journey Results
                         │
                         ▼
                    Seat Hold
                         │
                         ▼
                 Passenger Details
                         │
                         ▼
                   Mock Payment
                         │
                         ▼
                Booking Confirmation
                         │
                         ▼
                     Ticket
                         │
                         ▼
               Cancellation / Refund

The architecture exists to make this journey reliable, understandable, testable, and feasible to implement within the hackathon timeline.
