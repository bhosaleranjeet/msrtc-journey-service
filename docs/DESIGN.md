# MSRTC Journey Service — Unified Experience System

Status: implemented
Priority: P0 — submission critical
Type: frontend design system and journey experience

## Product character

The service should feel like dependable public transport made unusually easy: direct, calm, familiar and specific to Maharashtra. It is not a government-portal imitation, a luxury-travel brand, or a glassmorphic SaaS dashboard.

The Maharashtra landscape illustration gives the homepage its identity. After search, the interface becomes quieter so passengers can compare services and complete transactions without decoration competing with decisions.

## Experience structure

The product keeps five deliberate stages:

1. **Plan** — describe or enter a journey.
2. **Choose** — compare direct or connecting services.
3. **Book** — complete one reservation task at a time.
4. **Pass** — read the confirmed journey at a glance.
5. **Manage** — understand cancellation and refund consequences.

Moving forward replaces the main task. Back actions retain entered state. Content may scroll naturally when required; fitting a page into one viewport must never make controls cramped or hide information.

## Visual rules

### Colour

- Warm paper `#F5F1E9` is the application background.
- Ink `#17201B` is the primary text colour.
- MSRTC red `#B63231` is used for primary actions and selected choices.
- Transport green `#155B49` is reserved for confirmation, success and the journey pass.
- Muted gold `#C99A43` is a small civic accent, never a large decorative gradient.
- White is used for transactional surfaces with neutral borders.

### Surfaces

- Glass and backdrop blur are reserved for the search control over the homepage artwork.
- Internal pages use solid white cards, a `16px` radius, a neutral border and one restrained shadow.
- Nested information uses rules and subtle neutral fills rather than cards inside cards.
- Decorative glow fields, oversized background circles and repeated gradients are not used.

### Typography

- Use the native Tailwind sans stack for predictable rendering and strong Devanagari compatibility.
- Page headings use semibold weight and compact tracking, not ultra-light editorial display type.
- Desktop page headings normally remain between `36px` and `48px`; only the homepage hero may be larger.
- Labels are sentence case where possible. Uppercase eyebrow text is short and used sparingly.
- Times, fares and destinations receive the strongest hierarchy on transactional screens.

### Layout

- Header, content and footer share one `max-width: 1152px` alignment.
- Mobile spacing begins at `16px`; desktop spacing uses `24–32px`.
- Internal pages use a consistent top summary/action bar and a two-column workspace only when a summary materially helps.
- Primary actions are red filled buttons. Secondary actions are text or neutral outlines. Destructive actions use a red outline until confirmation.

### Motion and accessibility

- Motion is limited to colour, border and subtle shadow changes; no layout-lifting hover animation is required.
- Every control retains visible keyboard focus, a text label and a minimum touch target.
- Status is always communicated in text as well as colour.
- Errors and ambiguity resolution remain announced with `role="alert"`.

## Screen rules

### Plan

- Keep the Maharashtra hero artwork and centred promise.
- Make natural-language planning the standout entry point.
- Keep manual origin, destination and date fields explicitly separated by “or search manually”.
- Popular routes are compact shortcuts, not promotional cards.

### Choose

- Search context is a compact white summary bar.
- Service cards prioritise departure, arrival, duration and fare.
- Sorting is a restrained segmented control.
- Connecting journeys use a readable timeline and remain presentation-only.

### Book

- Show one task and one compact booking summary.
- The stepper communicates progress without dominating the page.
- The seat map shows a front, a physical aisle and textual availability.
- Passenger, concession, payment and recovery information use the same field and notice patterns.

### Pass

- The pass is a contained green confirmation artefact on the common paper background.
- Route, time, boarding point, seat, passenger and fare must be visible without oversized typography.
- Prototype and simulated-QR disclosures remain explicit.

### Manage

- Cancellation eligibility and financial consequence are the main content.
- The action is visible when available; otherwise the reason is stated plainly.
- Refund progress uses the shared success/status language.

## Functional constraints

- Preserve all APIs, booking/payment states, deterministic transport data and mock disclosures.
- Do not add real payment, MSRTC, GPS, identity or connection-booking integrations.
- Keep AI limited to language interpretation; deterministic services remain transport truth.
- Use Tailwind utilities and code-native SVG icons. No new visual dependency is required.

## Validation

- Verify 360px, 390px, 430px, tablet, short-laptop and desktop layouts.
- Verify keyboard operation through search, stop resolution, service selection, seats, passenger details, payment, pass and management.
- Run frontend lint and production build, backend regression tests and the production container build where available.
