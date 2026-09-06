# 010 — Round 2 Top-10 Product Refinement

- Status: complete
- Depends on: 009

## Implementation plan

### Affected frontend

- `frontend/src/App.tsx`: global language state, voice input, connected itinerary selection, Journey Pass/management entry points, complaint and tracking views.
- `frontend/src/components/TesterGuide.tsx`: Round 2 demo guidance.
- `frontend/src/types.ts`: itinerary, complaint and tracking contracts.
- `frontend/src/i18n/*` (new): deterministic English and Marathi dictionaries and locale helpers.

### Affected backend

- `journey_service.py`: retain deterministic one-transfer validation and expose selected connection identifiers without AI-generated routing.
- `booking_service.py` and booking schemas: accept one or two known trip IDs, hold/confirm seats per leg, and return leg-aware booking data while retaining the legacy single-trip request.
- `ticket_service.py`: render each confirmed leg in the pass.
- new complaint/tracking services and schemas: customer-facing mock data only.
- Tracking and complaint state are served by an isolated synthetic aftercare adapter. They remain intentionally transient because the prototype has no operational MSRTC account, GPS, notification, or complaint system; booking and ticket state remain durable in SQL.

### Reuse and constraints

- Voice recognition writes a transcript into the existing natural-language field and calls the existing `/intent/parse` route.
- Transport truth remains deterministic in `JourneyService`; the browser speech API is progressive enhancement only.
- The current SQL booking aggregate is single-trip, so multi-leg booking is extended compatibly by treating `trip_id` as the first leg and adding `trip_ids`/per-leg seats.
- Bus assignment, locations and complaint submission are explicitly labelled synthetic/simulated. No map SDK, government endpoint or real notification channel is introduced.

### Tests and risks

- Add domain/API coverage for valid and invalid connected bookings, complaint reference generation, and each tracking state; run current regression tests plus frontend lint/build.
- Main risks are preserving the established booking state machine for two legs and avoiding Marathi overflow. The UI will use the existing responsive utility system and stable translation keys rather than component-level locale conditionals.

## Implemented outcome

- English and Marathi now share one translation catalog across the shell, journey search, stop resolution, results, both booking legs, Journey Pass, management, tracking, complaints, errors, and reviewer guidance. Stop identity remains canonical at the API boundary while labels are localized in the UI.
- Voice capture is user-initiated, releases the microphone after capture, sends the selected English/Marathi locale as a guarded transcription hint with Maharashtra journey vocabulary, supports ordinary code-switching, keeps the transcript editable, and resumes the same deterministic stop-resolution/search flow used by typed and manual input.
- The curated network exposes four deliberate demo journeys, including one bookable Pune → Satara → Demo Destination connection with an independently selected seat on each bus.
- A connected Journey Pass presents the complete route, both buses and both seats; browser-local recent references allow up to five confirmed prototype bookings to be reopened.
- Tracking exposes all six synthetic states with explicit mock-map/status treatment, while structured complaints retain journey context, optional local evidence preview, server-validated image metadata, and a simulated reference/status. The image itself stays browser-local because the prototype deliberately has no evidence store.
- Unsupported routes are acknowledged as understood requests and redirected to the available demo journeys instead of being presented as product failures.
- Connected bookings revalidate route continuity, travel date, transfer window, and current seat inventory when the booking draft is created. Each leg requires an explicit independent seat, and cancellation releases both legs.
- The final presentation pass consolidates semantic colour, spacing, radius, shadow, typography, focus and motion primitives without changing the product flow. Mobile navigation, task summaries, results, Journey Pass, management, tracking, complaints, dialogs, FAQ and reviewer guidance now share the same restrained visual language.
- Operational values retain Latin numerals in both locales, while all seeded stop descriptions and service-name/type combinations use Marathi presentation mappings without changing canonical transport identifiers.
- The superseded `AppShell`, `Discovery`, and `BookingFlow` prototypes were removed so the repository has one active component language and no parallel legacy UI.

## Validation

- All 58 backend domain/API regression tests pass, covering direct and connected booking, Marathi aliases, multilingual voice transport, all tracking states, complaint linkage and evidence rules, SQL persistence, cancellation, and ticket generation.
- Frontend lint and production build pass; a fresh Alembic upgrade reaches the Round 2 head revision. Responsive layouts use mobile-first breakpoints and reduced-motion-safe progress feedback. Rendered checks cover the core English/Marathi experience at mobile and desktop widths without horizontal overflow.

## Functional acceptance audit

- Localization: locale persistence and document metadata, primary journey/booking/aftercare copy, dynamic stop/status/error labels, and active-flow switching are implemented for English and Marathi.
- Voice: explicit start/stop/cancel, permission and empty-audio recovery, multilingual/code-switched server transcription, editable transcript, microphone cleanup, ambiguity continuation, and typed fallback are implemented.
- Connections: deterministic direct-first search, bounded one-transfer routing, unavailable-leg filtering, two-leg booking validation, independent seats, combined fare, durable legs, cancellation release, and complete Journey Pass are implemented.
- Aftercare: all required synthetic assignment/tracking states, mock route position, ticket-linked structured complaints, prefilled journey context, optional validated photo metadata, and reference/status confirmation are implemented.
- Regression: original direct booking and the Round 2 connected flow are covered by the domain/API suite; frontend lint/build and a fresh migration to `0002_round2_booking_legs` pass.
