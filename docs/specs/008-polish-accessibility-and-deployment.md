# 008 — Polish, Accessibility and Deployment

- Status: ready for deployment
- Depends on: 003, 004, 007

## Goal

Make the complete prototype reliable, accessible, visually coherent and ready for a public hackathon demonstration.

## In scope

- End-to-end golden-path review and responsive/mobile polish.
- Keyboard navigation, semantic controls, labelled fields, visible focus, adequate contrast, touch targets and screen-reader-friendly errors.
- Mock-integration disclosure across relevant screens.
- Lightweight structured domain-event logging without sensitive passenger data.
- Public HTTPS deployment, configured secrets, deterministic seeded data and documented run/deploy commands.
- Final verification of the direct and connecting demo scripts.

## Out of scope

- New product capabilities outside previous specifications.

## Acceptance criteria

- Both demo scenarios are reproducible in approximately one minute.
- Core flow is usable on a mobile viewport and with keyboard navigation.
- No real integration is implied by UI copy or documentation.
- Relevant automated tests, lint and type checks pass in the deployed codebase.
- Public deployment is reachable over HTTPS with secrets kept out of source control.

## Implementation notes

- Completed locally: mobile and keyboard polish, semantic error announcements, visible focus styles, global mock disclosure, same-origin production API configuration, safe structured domain-event logging, deterministic demo scripts, and a Render-ready Docker deployment configuration.
- Added a frontend-only, session-scoped demo access gate with one configurable credential pair, visible judge credentials, sign-out, keyboard-friendly fields, and an explicit warning that it is not real authentication.
- Added a persistent “My booking” path that remembers the latest confirmed booking ID and restores authoritative booking, ticket, and cancellation details from the backend after refresh or sign-in.
- Public release verified on 2026-08-28: the frontend is deployed on Vercel, the stateful Docker backend is deployed on Render, production CORS is restricted to the frontend origin, and both structured and OpenAI-assisted searches were exercised successfully over HTTPS.
- Submission update: specification 009 replaces process-local state with SQLite/PostgreSQL repositories. The next Render deployment must set a secret Neon `DATABASE_URL`; startup migrations and the idempotent rolling seed run automatically.
