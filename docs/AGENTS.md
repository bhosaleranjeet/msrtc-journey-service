Project

This repository contains a hackathon prototype that reimagines the MSRTC digital booking experience as a citizen-first journey planning and booking platform.

Before making meaningful changes, read:

1. docs/TARGET.md
2. docs/PRODUCT.md
3. docs/ARCHITECTURE.md

Do not attempt to implement the entire project from TARGET.md.

Implementation must happen incrementally through spec driven development.

⸻

Source of Truth

Use the following precedence when requirements conflict:

1. Current user instruction
2. docs/ARCHITECTURE.md
3. docs/PRODUCT.md
4. docs/TARGET.md

Do not silently resolve meaningful conflicts.

Document the resolution in docs/DECISIONS.md.

⸻

Development Workflow

before even starting the development, once you understand the provided docs, create a specs folder and divide the project into multiple specs which then we will implement one by one. 

For every implementation task:

1. Read the relevant spec completely.
2. Inspect existing implementation before modifying it.
3. Identify dependencies and affected modules.
4. Implement the smallest coherent change satisfying the spec.
5. Add or update tests where practical.
6. Run relevant validation commands.
7. Update the specification status.
8. Record material implementation changes in docs/CHANGELOG.md.
9. Record architectural/product decisions in docs/DECISIONS.md.

Do not mark a specification complete while acceptance criteria remain unsatisfied.

⸻

Scope Discipline

Do not add features merely because they seem useful.

If functionality is not required by:

* the active specification,
* an accepted decision,
* or an explicit user instruction,

do not implement it.

Prefer a polished complete golden path over broad incomplete functionality.

This is a hackathon prototype.

⸻

Product Principles

The product exists to reduce the amount of MSRTC operational knowledge required from passengers.

Follow these principles:

* citizens describe journeys; the system resolves transport terminology
* prefer human-readable places over internal stop codes
* never use AI where deterministic logic is more reliable
* OpenAI handles language understanding and ambiguity resolution
* deterministic systems handle schedules, routing, fares, bookings and transaction state
* never present mocked government integrations as real
* mobile-first UX
* accessibility is part of the product, not post-launch polish
* errors must explain what happened and what the citizen can do next
* do not end the journey at “No buses found” when a valid connection can be proposed

⸻

AI Boundary

OpenAI models may:

* parse natural-language travel intent
* interpret temporal phrases
* resolve ambiguous user language
* help map user terminology to known places/stops
* explain transport or concession information

OpenAI models must not be treated as the authoritative source for:

* whether a bus exists
* schedules
* seat inventory
* fares
* route connectivity
* reservation status
* payment status
* refund eligibility

Those must come from deterministic application data and services.

Prefer structured model outputs validated against schemas.

⸻

Mock Data

This prototype does not have access to private MSRTC systems.

Use clearly identified synthetic or mock data for:

* schedules
* service inventory
* seat availability
* fares
* payment responses
* GPS tracking
* ticket issuance
* refunds
* government integrations

Never scrape, reverse-engineer or depend on private MSRTC APIs.

⸻

Engineering Expectations

Prefer:

* small modules
* explicit interfaces
* typed models
* deterministic business logic
* reusable components
* clear domain boundaries
* meaningful error states
* tests around routing and transaction logic

Avoid:

* giant components
* duplicated business logic
* untyped API contracts
* hidden side effects
* hardcoded logic scattered across UI components
* unnecessary abstractions
* premature infrastructure

⸻

Change Documentation

Use docs/CHANGELOG.md for factual implementation history.

Use docs/DECISIONS.md for reasoning.

Do not duplicate long explanations in both.

A changelog entry answers:

What changed?

A decision entry answers:

Why did we choose this?

⸻

Completion Standard

Before declaring a spec complete:

* all required behavior exists
* acceptance criteria pass
* relevant tests pass
* lint/type checks pass where configured
* mocked behavior is clearly distinguishable from real integrations
* no unrelated scope has been added
* documentation reflects any material deviation