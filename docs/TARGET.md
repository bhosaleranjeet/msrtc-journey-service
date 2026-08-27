Mission

Build a polished, publicly accessible prototype demonstrating how Maharashtra’s state bus booking experience could work if designed around citizen intent instead of transport-system terminology.

The prototype must demonstrate that a passenger should be able to tell the system where they want to go and have the platform handle the complexity of finding, understanding and booking the journey.

This is not a visual redesign of the current MSRTC website.

It is a rethinking of journey discovery, booking and post-booking experience.

⸻

Core Thesis

MSRTC connects Maharashtra physically.

Its digital experience should make that network equally easy to navigate.

Passengers should not need to understand:

* depot naming conventions
* internal stop names
* service codes
* route structures
* reservation terminology
* refund policies
* operational systems

to complete a journey.

⸻

Golden Journey

The final prototype must support the following complete experience.

1. Journey Discovery

A passenger can search traditionally:

From → To → Date

or naturally:

Pune to Nashik tomorrow morning, AC

The system converts natural language into structured journey intent.

⸻

2. Intelligent Stop Resolution

The system understands that human place names may correspond to multiple MSRTC stops.

It presents meaningful options using human-readable descriptions rather than requiring exact internal terminology.

Example:

Nashik

→ Nashik Mahamarg
→ Nashik CBS
→ Nashik Road

⸻

3. Bus Discovery

Available services are presented as decision-oriented results.

Passengers can understand:

* departure
* arrival
* duration
* service type
* AC/non-AC
* price
* boarding point
* destination
* availability

without understanding internal service nomenclature.

The interface should support:

* Recommended
* Cheapest
* Fastest
* Earliest

⸻

4. Network Journey Planning

When no direct service exists, the system should attempt to find a reasonable connecting MSRTC journey.

Example:

Pune → Satara → Destination

The passenger should receive:

* individual services
* transfer location
* transfer duration
* total duration
* total fare

The product should prefer helping the citizen complete the journey instead of returning only:

No buses found.

⸻

5. Boarding Point

Boarding locations must be understandable to normal passengers.

Where useful, provide:

* human-readable stop name
* location context
* map preview
* distance/context
* boarding instructions

Internal codes are secondary information.

⸻

6. Seat Selection

Passenger can choose an available seat from a clear mobile-friendly seat map.

The system maintains booking state during the flow.

⸻

7. Passenger & Concession

Passenger information can be entered.

The prototype demonstrates how relevant MSRTC concessions could be surfaced clearly rather than hidden inside bureaucratic form fields.

Mock eligibility is acceptable and must be identified as such.

⸻

8. Booking Transaction

The prototype demonstrates a robust booking lifecycle:

Seat Hold
→ Payment Intent
→ Mock Payment
→ Verification
→ Booking Confirmation
→ Ticket Issuance

A successful payment must not automatically imply a successful booking.

The product must be capable of representing uncertain/intermediate states.

⸻

9. Journey Pass

After booking, the passenger receives a clear ticket focused on:

* journey
* departure
* boarding point
* arrival
* service
* seat
* passenger
* payment
* ticket/QR identifier

Operational metadata should remain accessible without dominating the primary experience.

⸻

10. Journey Management

Passenger can view the booking and demonstrate:

* cancellation eligibility
* cancellation deduction
* expected refund
* cancellation confirmation
* refund state

The user should not have to manually interpret cancellation rules.

⸻

AI Role

OpenAI must be used meaningfully.

Primary use:

Natural language journey request
→ structured search intent.

Potential secondary use:

Ambiguous place/stop interpretation.

AI is not responsible for transport truth.

Schedules, connectivity, fares, seats and booking state are deterministic.

⸻

Prototype Boundaries

The prototype may use synthetic data for all unavailable dependencies.

It must not claim real integration with:

* MSRTC reservation infrastructure
* real payment gateways
* real GPS systems
* government identity systems
* production inventory systems

Mocked integrations must be clearly disclosed.

⸻

Experience Quality

The final application should feel comparable to modern consumer travel software.

Priorities:

1. clarity
2. speed
3. mobile usability
4. trust
5. accessibility
6. visual polish

The visual treatment may take inspiration from MSRTC/Maharashtra identity but should not imitate the existing portal.

⸻

Demo Requirement

The final implementation must be capable of demonstrating the primary experience within approximately one minute.

Preferred demo:

1. natural-language Pune → Nashik search
2. intent extraction
3. clear results
4. seat and booking flow
5. completed journey pass

Then demonstrate:

1. journey with no direct service
2. connecting-route recommendation

The second moment should clearly establish that the project is more than a visual redesign.

⸻

Definition of Done

The target is achieved when:

* the golden journey works end-to-end
* AI intent parsing works
* stop ambiguity can be demonstrated
* direct route search works
* connecting-route planning works
* booking flow works
* payment state is modeled
* ticket is generated
* cancellation/refund flow works
* UI is polished and mobile-responsive
* demo data reliably reproduces intended scenarios
* mocked dependencies are clearly disclosed
* public deployment is functional
* the experience can be demonstrated cleanly within the submission video