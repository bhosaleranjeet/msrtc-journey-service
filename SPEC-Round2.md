# SPEC — ROUND 2 TOP-10 PRODUCT REFINEMENT

Status: READY FOR IMPLEMENTATION
Deadline: 7 September 2026
Objective: Build the strongest possible Top-10 submission from the existing
working MSRTC Journey Service.

---

# 1. CONTEXT

This project has been selected in the Top 250 of the Build What Moves India
hackathon.

The next submission determines the Top 10 projects.

The current application is already a working end-to-end citizen-first
reimagining of the MSRTC online booking experience.

DO NOT rebuild the application.

DO NOT replace working architecture without a concrete reason.

This round is about:

- product refinement
- deeper citizen usability
- improving standout functionality
- accessibility
- realistic public-service use cases
- UI/UX polish
- demonstrating a credible evolution from the first submission

An OpenAI mentor reviewed the current product.

Her recommendations, in priority order, were:

1. Marathi/regional-language support throughout the experience
2. Natural-language VOICE journey search in addition to existing text search
3. Significantly improve the connecting-bus experience because it is one of
   the strongest differentiators but is currently not working/presented well

These are P0 requirements.

Additional product improvements requested by the product owner:

4. Structured complaint/feedback experience tied to an existing ticket
5. Customer-facing bus-number assignment and live bus tracking experience

These are P1 requirements.

---

# 2. PRODUCT THESIS

Preserve the existing central principle:

> Passengers should understand the journey, not the system behind it.

Every new capability must reinforce this.

Do not add functionality merely because it looks impressive in a demo.

---

# 3. NON-NEGOTIABLE CONSTRAINTS

Preserve all currently working functionality.

Do not regress:

- normal journey search
- natural-language text search
- stop resolution
- direct journey discovery
- journey results
- boarding/drop selection
- seat selection
- passenger details
- concessions
- fare calculation
- payment flow
- booking lifecycle
- ticket/Journey Pass
- cancellation
- refunds
- existing responsive behavior

Existing APIs and backend behavior should remain compatible unless a change is
strictly necessary for one of the requirements in this spec.

All unavailable external infrastructure must remain explicitly mocked.

Do not pretend:

- GPS data is real
- bus numbers come from MSRTC
- complaints are submitted to MSRTC
- schedules/inventory are production MSRTC data
- notifications are actually connected to MSRTC infrastructure

---

# 4. IMPLEMENTATION PRIORITY

Implement strictly in this order:

P0.1 Marathi/localization foundation
P0.2 Voice journey search
P0.3 Connecting journey V2

THEN:

P1.1 Complaint/feedback experience
P1.2 Bus assignment + tracking experience

THEN:

P2 Final UI consistency
P2 Responsive/mobile QA
P2 Accessibility
P2 Regression
P2 Demo-path reliability

Do not start P1 work while a P0 feature remains substantially broken.

---

# 5. P0.1 — MARATHI LANGUAGE SUPPORT

## Goal

A Marathi-speaking citizen should be able to use the complete primary journey
without needing English.

This must not be a superficial translation of the homepage.

Support Marathi throughout all citizen-facing primary flows.

---

## 5.1 Language Selector

Add a clear but unobtrusive language control to the global header.

Minimum:

English | मराठी

The selected language must persist while navigating.

Prefer persistence using the existing appropriate client persistence mechanism.

Changing language must NOT:

- reset an active booking
- clear search results
- clear selected seats
- lose passenger information
- restart the journey

Language is presentation state, not transaction state.

---

## 5.2 Localization Architecture

Do NOT hardcode conditionals throughout components such as:

if language == "mr"

Establish a proper localization layer.

For example:

src/
  i18n/
    en.ts
    mr.ts

or use an existing lightweight localization library if one is already present
or clearly beneficial.

All newly translated citizen-facing strings should use stable translation keys.

Example:

journey.search.title
journey.search.from
journey.search.to
journey.results.recommended
booking.seat.title
payment.received
ticket.boarding
tracking.live
complaint.category

---

## 5.3 Translation Coverage

Translate the complete primary experience:

### Global

- navigation
- language selector
- buttons
- common actions
- loading states
- error states
- empty states

### Search

- hero copy
- From
- To
- Date
- Search
- natural-language search
- examples
- voice-search guidance

### Results

- Recommended
- Fastest
- Cheapest
- Earliest
- departure
- arrival
- duration
- seats
- fare
- service labels
- boarding/drop labels
- connecting journey language

### Booking

- seat selection
- passenger information
- concessions
- fare breakdown
- payment
- booking states

### Post-booking

- Journey Pass
- Manage Journey
- cancellation
- refund
- complaint
- tracking

---

## 5.4 Marathi Quality

Translations must be citizen-friendly Marathi.

Do NOT mechanically translate internal technical terminology.

Prefer language an ordinary MSRTC passenger would understand.

Keep unavoidable identifiers unchanged:

- ticket numbers
- bus numbers
- seat numbers
- monetary values
- PNR/reference IDs where applicable

Transport service names may remain official names where translation would make
them less recognizable.

---

## 5.5 Dynamic Content

Dynamic journey information must remain understandable in Marathi.

Example:

Pune → Nashik

should be capable of displaying localized stop/city labels where known.

Do not use an LLM at runtime merely to translate fixed interface strings.

Fixed interface translation must be deterministic.

---

# 6. P0.2 — NATURAL-LANGUAGE VOICE SEARCH

## Goal

A citizen should be able to speak the same journey request they can currently
type.

Examples:

"मला उद्या सकाळी पुण्याहून नाशिकला जायचं आहे."

or:

"Pune to Nashik tomorrow morning, AC."

Voice is another input method for the SAME existing intent/search pipeline.

Do not build a separate voice-search journey engine.

Architecture:

VOICE
  ↓
Speech recognition
  ↓
Transcript
  ↓
Existing natural-language intent pipeline
  ↓
Structured intent
  ↓
Stop resolution
  ↓
Deterministic journey engine

---

## 6.1 Search UI

Extend the existing natural-language search component.

Provide an obvious microphone action.

Conceptually:

┌──────────────────────────────────────────────────┐
│ Pune to Nashik tomorrow morning...        [🎙]  │
└──────────────────────────────────────────────────┘

Voice search must feel integrated with text search.

Do not create:

- chatbot UI
- assistant avatar
- separate AI page
- floating AI orb
- conversational chat interface

---

## 6.2 Voice Interaction States

Explicitly support:

IDLE
REQUESTING_PERMISSION
LISTENING
PROCESSING
TRANSCRIBED
ERROR

The UI must clearly communicate each state.

### Listening

Show:

Listening...

with subtle visual feedback.

### Transcript

After recognition, display the recognized text in the existing natural-language
search field.

IMPORTANT:

Do NOT immediately hide the transcript.

The passenger should be able to verify what the system heard.

Then use the existing parsing/search flow.

---

## 6.3 Language

Voice input must support at minimum:

- Marathi
- English

Ideally tolerate common Marathi/English code-switching if supported by the
selected speech mechanism.

Examples:

"Pune वरून Nashik ला उद्या morning ची AC bus"

This is a realistic Maharashtra usage pattern.

Do not invent a custom speech-recognition model.

Use an appropriate browser or available speech-to-text capability.

If a selected API/browser capability has compatibility limitations, degrade
gracefully to text search.

---

## 6.4 Permission/Error UX

Handle:

- microphone permission denied
- no microphone available
- no speech detected
- recognition failure
- unsupported browser
- network/API failure where applicable

Never leave the microphone in an ambiguous active state.

Text search must ALWAYS remain available.

Voice search is progressive enhancement.

---

## 6.5 Privacy

Make microphone state obvious.

Do not imply continuous listening.

Stop listening when:

- recognition completes
- user cancels
- timeout occurs
- component unmounts/navigation occurs

---

# 7. P0.3 — CONNECTING JOURNEY V2

## Goal

Turn connecting buses into one of the strongest experiences in the entire
product.

Current weakness:

The concept is strong, but the implementation/presentation does not yet make
the journey sufficiently obvious, trustworthy or usable.

The experience must answer:

> If there is no direct bus, can MSRTC still get me there?

---

# 8. CONNECTION DISCOVERY

Use deterministic transport data.

Do NOT use the LLM to invent connecting services.

For a requested:

A → C

if no suitable direct journey exists, evaluate:

A → B
B → C

where B is a valid transfer point.

For Round 2, one transfer remains sufficient.

Do NOT implement arbitrary multi-hop routing unless the existing architecture
already safely supports it.

---

# 9. CONNECTION VALIDATION

A connection is valid only if:

- both services exist in known transport data
- first service reaches the transfer point
- second service departs from the transfer point
- second departure occurs after first arrival
- minimum transfer buffer is satisfied
- maximum reasonable transfer wait is satisfied
- services operate on the requested date
- required seat inventory is available where inventory is modeled

Never show impossible connections.

---

# 10. CONNECTION RANKING

Generate valid candidate connections and rank them deterministically.

Consider:

- total journey duration
- total fare
- transfer waiting time
- departure preference
- service preference
- seat availability

Avoid presenting too many choices.

The passenger should receive a small number of useful alternatives.

---

# 11. CONNECTING JOURNEY RESULTS UX

DO NOT display two unrelated bus cards.

The passenger is buying/understanding ONE journey composed of TWO legs.

Present it as one connected timeline.

Example:

WE CAN STILL GET YOU THERE

Pune
07:00
 │
 │ E-Shivai
 │ 2h 20m
 ▼
Satara
09:20

┌──────────────────────────────────┐
│ Change buses at Satara           │
│ 25 minute transfer               │
│ Same bus station                 │
└──────────────────────────────────┘

Satara
09:45
 │
 │ Ordinary
 │ 1h 30m
 ▼
Mahabaleshwar
11:15

Total journey        4h 15m
Transfer             25 min
Total fare           ₹___

[Choose this journey]

---

# 12. TRANSFER CONFIDENCE

The UX must reduce transfer anxiety.

Explicitly answer:

- Where do I change?
- How long do I have?
- Do I remain at the same station?
- What is my next bus?
- When does it leave?
- What happens if relevant information changes?

Where the synthetic dataset permits, distinguish:

Same station

from:

Different boarding point

Do not claim walking/navigation information unless it is actually modeled.

---

# 13. CONNECTING JOURNEY BOOKING

Ensure the journey remains coherent after selection.

During subsequent screens, show BOTH legs in the journey summary.

Do not allow the UI to suddenly appear as though only the first bus is being
booked.

Where seats are selected separately for each service, make the distinction
extremely clear.

Example:

LEG 1
Pune → Satara
Seat 12A

LEG 2
Satara → Mahabaleshwar
Seat 7B

If the current backend does not support multi-leg booking correctly, fix this
before polishing the card.

---

# 14. CONNECTING JOURNEY PASS

The final Journey Pass must show the complete connection.

Example:

PUNE
07:00
 ↓
SATARA
09:20

CHANGE BUS
25 minutes

SATARA
09:45
 ↓
MAHABALESHWAR
11:15

Then show service/seat information for each leg.

The passenger should be able to use the ticket during the actual hypothetical
journey without remembering information from previous screens.

---

# 15. P1.1 — SMART COMPLAINT / FEEDBACK EXPERIENCE

## Product Goal

Create a citizen-friendly complaint flow connected to an existing journey.

Do NOT build a generic:

Subject
Complaint text
Submit

form.

The passenger should not need to explain information the system already knows.

---

# 16. ENTRY POINTS

Provide complaint access from appropriate places such as:

- Manage Journey
- Journey Pass / completed journey
- Help/Support area

Do not make complaints a dominant primary navigation item unless justified by
the existing navigation architecture.

---

# 17. TICKET-FIRST COMPLAINT FLOW

If accessed globally:

Step 1:

Enter Ticket Number

[________________]

[Find journey]

After a valid ticket is found, prefill/display:

- passenger
- journey
- travel date
- service
- boarding point
- destination
- seat
- bus number if assigned

Do NOT ask the passenger to re-enter known booking information.

If accessed directly from Manage Journey, skip ticket lookup and use the
current booking.

---

# 18. STRUCTURED COMPLAINT CATEGORIES

The complaint should be selection-based rather than requiring a written essay.

Example top-level categories:

BUS CONDITION
STAFF
JOURNEY
SAFETY
CLEANLINESS
FACILITIES
OTHER

Then contextual subcategories.

Example:

BUS CONDITION
  - Broken seat
  - AC not working
  - Window issue
  - Charging point not working
  - Cleanliness issue
  - Other bus-condition issue

JOURNEY
  - Bus delayed
  - Bus did not arrive
  - Wrong boarding information
  - Unscheduled stop
  - Other journey issue

STAFF
  - Conductor behaviour
  - Driver behaviour
  - Ticketing issue
  - Other staff issue

Do not create dozens of options.

Keep categorization understandable.

---

# 19. OPTIONAL PHOTO EVIDENCE

Allow the passenger to attach photo evidence.

Examples:

- broken seat
- damaged window
- cleanliness
- AC vent/equipment
- bus condition

Requirements:

- image upload only
- preview before submission
- remove/replace image
- sensible file-size restriction
- clear upload error
- mobile camera/photo-library compatible where browser support allows

Photo is OPTIONAL.

Never block a complaint merely because no photo was attached.

---

# 20. COMPLAINT CONFIRMATION

After submission, generate a mock complaint reference.

Example:

Complaint submitted

Reference:
CMP-2026-XXXXXX

Journey:
Pune → Nashik

Category:
Bus condition → Broken seat

[View complaint]

Clearly disclose in prototype context that complaint submission is simulated
and not sent to production MSRTC systems.

---

# 21. COMPLAINT STATUS

A lightweight mock status experience may support:

SUBMITTED
UNDER_REVIEW
RESOLVED

Do not build an admin system.

Do not implement complex workflow management.

Customer-side demonstration only.

---

# 22. P1.2 — BUS ASSIGNMENT + LIVE TRACKING EXPERIENCE

## Product Goal

Demonstrate how a passenger could know which physical bus is operating their
service and track it once operational assignment is available.

This is a mocked customer-facing experience.

Do NOT build the driver/conductor/admin application in this round.

---

# 23. DOMAIN DISTINCTION

Keep these concepts separate:

SERVICE / TRIP
= scheduled transport journey

BUS
= physical vehicle assigned to that trip

Example:

Trip:
Pune → Nashik
06:30 E-Shivai

Assigned vehicle:
MH-14-AB-1234

The bus number may not be known when the passenger initially books.

---

# 24. ASSIGNMENT STATES

Support:

BUS_NOT_ASSIGNED
BUS_ASSIGNED
TRACKING_AVAILABLE
TRIP_STARTED
TRIP_COMPLETED

Before assignment:

> Bus details will appear here once the vehicle is assigned.

After assignment:

> Your bus has been assigned.

Bus:
MH-14-AB-1234

Service:
E-Shivai

Do not fabricate administrative workflows in the citizen UI.

---

# 25. NOTIFICATION CONCEPT

When the mocked bus assignment occurs, surface an in-app notification/state
change.

Example:

Your bus has been assigned

MH-14-AB-1234
Pune → Nashik
Departure 06:30

Do not claim SMS, WhatsApp or push notifications actually occurred unless they
are implemented.

They may be described as future integration possibilities, not current
functionality.

---

# 26. TRACKING MODEL

For the prototype, simulate the customer experience.

A conceptual real deployment could obtain location from an authorized
driver/conductor device rather than requiring dedicated vehicle hardware.

However:

DO NOT present personal smartphone sharing as production architecture without
acknowledging:

- consent
- privacy
- battery usage
- authentication
- spoofing
- loss of connectivity
- employee/device policy

For the prototype, model the result:

authorized trip location
→ backend
→ passenger tracking view

Do not build the workforce-side location-sharing system.

---

# 27. TRACKING UI

Add a customer-facing tracking view accessible from an active Journey Pass /
Manage Journey.

The page should show:

- assigned bus number
- service
- origin
- destination
- scheduled departure
- current journey status
- current/last known position
- last updated time
- relevant upcoming stop where supported

If a map implementation is already available or can be added reliably, show a
simple route map with:

Origin
Bus position
Destination

Avoid excessive map controls.

The purpose is:

> Where is my bus?

not:

> Explore a GIS application.

---

# 28. TRACKING STATES

Explicitly support:

### Not yet available

Tracking will become available closer to departure.

### Bus assigned

Your bus has been assigned.

### Live

Live location

Updated just now / X minutes ago

### Location stale

Location hasn't updated recently.

Last update: HH:MM

### Trip completed

This journey has been completed.

Never show a stale simulated coordinate as confidently "Live".

---

# 29. MOBILE-FIRST TRACKING

Tracking is especially important on mobile.

At approximately 360–430px:

the passenger should immediately see:

BUS NUMBER
STATUS
MAP/POSITION
DEPARTURE
NEXT RELEVANT INFORMATION

Do not bury the bus number below the map.

---

# 30. CROSS-FEATURE INTEGRATION

The new capabilities must feel like one product.

Example complete journey:

Citizen opens site
        ↓
switches to मराठी
        ↓
speaks journey request
        ↓
voice becomes transcript
        ↓
intent is understood
        ↓
no direct bus exists
        ↓
connecting journey is offered
        ↓
citizen books both legs
        ↓
Journey Pass shows complete trip
        ↓
bus is assigned
        ↓
bus number becomes visible
        ↓
citizen tracks the bus
        ↓
after/during journey, citizen reports broken seat
        ↓
ticket automatically provides journey context
        ↓
selects:
Bus condition → Broken seat
        ↓
attaches photo
        ↓
complaint reference generated

This is the Round 2 product story.

---

# 31. IMPORTANT — DO NOT FORCE EVERYTHING INTO THE FINAL DEMO

Implementation completeness and demo storytelling are different.

The strongest demo path should emphasize:

1. Marathi
2. Voice search
3. Connecting journey
4. Journey Pass
5. Bus assignment/tracking

Complaint can be demonstrated briefly or presented as additional product
depth.

Do not allow complaint functionality to consume more demo attention than the
mentor-recommended features.

---

# 32. UI/UX QUALITY

New features MUST use the existing established visual system.

Do not introduce a new design language.

Maintain:

- existing typography
- spacing scale
- colors
- radius system
- button styles
- card styles
- header/navigation
- responsive container behavior

Do not create "AI-looking" components for voice.

Do not create an enterprise-dashboard-looking tracking screen.

Do not make complaints look like a government PDF form.

The product remains:

Government credibility
+
consumer-product usability.

---

# 33. MARATHI RESPONSIVE QA

Marathi strings may be longer/differently shaped than English.

Explicitly test:

360px
390px
430px
tablet
desktop

Check:

- buttons
- tabs
- cards
- badges
- navigation
- journey timeline
- seat screen
- payment
- ticket
- complaint categories
- tracking

Do not solve overflow by shrinking Marathi typography excessively.

---

# 34. ACCESSIBILITY

New functionality must support:

- keyboard operation
- visible focus states
- semantic buttons
- screen-reader labels
- microphone state announcement
- upload labels
- non-color-only status indicators
- sufficiently large touch targets
- accessible language declaration where applicable

When Marathi is selected, set the appropriate document language metadata.

---

# 35. PERFORMANCE

Do not make the application materially heavier for visual polish.

Especially avoid:

- huge animation libraries for one effect
- unnecessary map dependencies
- large unoptimized images
- blocking translation requests
- loading AI merely to translate UI

Lazy-load heavier functionality such as maps where appropriate.

Voice failure must not affect normal search.

Tracking failure must not affect ticket access.

Complaint failure must not affect booking management.

---

# 36. MOCK DATA REQUIREMENTS

Extend the synthetic dataset deliberately to create deterministic demo
scenarios.

Required golden scenarios:

## Scenario A — Direct journey

Known route that reliably demonstrates normal booking.

## Scenario B — Connecting journey

Known route where:

- no suitable direct service exists
- exactly one strong transfer option exists
- transfer buffer is realistic
- both legs have available seats

## Scenario C — Bus tracking

Known confirmed booking with:

- assigned vehicle number
- predictable simulated route/location
- active tracking state

## Scenario D — Complaint

Known ticket with:

- journey details
- passenger
- seat
- assigned bus

Do not randomize demo-critical data.

---

# 37. TESTING — REQUIRED

Do not consider implementation complete because pages render.

Test:

## Localization

- English → Marathi
- Marathi → English
- language persists
- active booking survives switch
- no untranslated primary-flow strings
- Marathi mobile layout

## Voice

- English speech
- Marathi speech
- permission denied
- cancel listening
- no speech
- transcript editable
- fallback to text
- microphone stops correctly

## Connections

- direct journey
- no direct + valid connection
- invalid transfer timing
- transfer too short
- transfer too long
- second leg unavailable
- journey summary contains both legs
- booking contains both legs
- ticket contains both legs

## Complaint

- valid ticket
- invalid ticket
- prefilled journey
- category/subcategory
- photo
- no photo
- submission
- reference

## Tracking

- no assignment
- assigned
- tracking available
- stale location
- completed journey
- mobile view

---

# 38. REGRESSION

After all work, run the ORIGINAL golden path.

The Round 1 product must still work.

Then run the Round 2 golden path:

मराठी
  ↓
voice request
  ↓
recognized transcript
  ↓
structured journey
  ↓
connecting journey
  ↓
both legs understood
  ↓
booking
  ↓
Journey Pass
  ↓
bus assignment
  ↓
tracking
  ↓
complaint
  ↓
photo
  ↓
reference

---

# 39. IMPLEMENTATION PROCESS FOR AGENT

Before writing code:

1. Read AGENTS.md.
2. Read TARGET.md.
3. Read PRODUCT.md.
4. Read ARCHITECTURE.md.
5. Read existing specs.
6. Read CURRENT.md.
7. Inspect the ACTUAL implementation.
8. Map existing components/APIs/models to this spec.

DO NOT assume the repository exactly matches older documentation.

The codebase is the implementation truth.

---

# 40. BEFORE IMPLEMENTATION — PRODUCE PLAN

Create an implementation plan containing:

- affected frontend components
- affected backend services
- schema/model changes
- API changes
- localization approach
- voice-recognition approach
- connection-engine changes
- complaint data model
- tracking data model
- mock-data additions
- test additions
- migration requirements
- major risks

Identify where existing functionality can be reused.

Do not duplicate existing journey/search logic.

---

# 41. IMPLEMENT IN SMALL VERTICAL SLICES

Recommended sequence:

01 — localization infrastructure
02 — Marathi global shell + search
03 — Marathi complete booking flow
04 — voice input
05 — voice → existing intent pipeline
06 — connecting engine correctness
07 — connecting results UI
08 — multi-leg booking consistency
09 — connecting Journey Pass
10 — complaint lookup
11 — complaint categories
12 — photo attachment
13 — complaint confirmation
14 — bus assignment model
15 — tracking simulation
16 — tracking UI
17 — integration polish
18 — responsive/accessibility
19 — regression
20 — demo QA

After each slice:

- run relevant tests
- update CURRENT.md
- record meaningful decisions in DECISIONS.md
- update CHANGELOG.md

Do not wait until the end to discover regressions.

---

# 42. AGENT DECISION RULE

When implementation details are ambiguous:

FIRST:
inspect existing patterns.

SECOND:
choose the smallest solution consistent with the architecture and this spec.

THIRD:
document materially important choices.

Do NOT repeatedly ask the product owner about minor implementation details.

Only stop for clarification if:

- functionality would materially change
- two interpretations produce significantly different citizen experiences
- an external paid/credentialed service is required
- an irreversible architectural change is necessary

---

# 43. SCOPE CONTROL

DO NOT ADD:

- arbitrary multi-hop journey planning
- real payments
- real MSRTC APIs
- driver application
- conductor application
- admin complaint dashboard
- admin tracking dashboard
- authentication redesign
- chatbot
- AI travel assistant
- predictive delay ML
- push-notification infrastructure
- WhatsApp integration
- SMS integration
- hardware GPS integration
- ratings/reviews
- loyalty
- unrelated dashboard features

If an attractive idea is not in this spec:

DO NOT BUILD IT BEFORE SUBMISSION.

---

# 44. SUCCESS CRITERIA

Round 2 should feel meaningfully different from Round 1.

A reviewer should immediately perceive:

### More inclusive

The service works naturally in Marathi.

### More accessible

A citizen can speak their journey rather than type it.

### More intelligent

The system understands the transport network rather than merely searching
direct services.

### More reassuring

Connecting journeys explain exactly how the passenger changes buses.

### More useful after booking

The passenger can identify and track the assigned physical bus.

### More accountable

A complaint is tied directly to the journey and can include evidence without
forcing the citizen to re-enter information the system already knows.

Most importantly:

The product must still feel like ONE coherent public-service experience.

Not:

"a hackathon project with five new features."

---

# 45. FINAL PRODUCT MESSAGE

Every implementation decision should reinforce:

> Passengers should understand the journey, not the system behind it.

And the Round 2 evolution should demonstrate something broader:

> A public transport digital service should help before the journey,
> during the journey, and when something goes wrong.