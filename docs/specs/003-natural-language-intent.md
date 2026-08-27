# 003 — Natural-Language Intent

- Status: complete
- Depends on: 002

## Goal

Convert a natural-language journey request into validated structured search intent without making AI a dependency for core search.

## In scope

- `POST /api/intent/parse` behind an OpenAI provider interface.
- Structured output schema for origin, destination, travel date, optional time window and preferences.
- Validation before intent enters stop resolution/search.
- A search entry point accepting text such as “Pune to Nashik tomorrow morning, AC”.
- Recoverable failure experience that exposes editable From, To, Date and Time fields.
- Mocked provider responses in automated tests; no live OpenAI dependency in CI.

## Out of scope

- AI-generated schedules, fares, routes, booking decisions or unbounded stop creation.

## Acceptance criteria

- Valid model output produces a schema-valid intent and feeds the existing structured search flow.
- Invalid/partial output is rejected without invented values.
- When AI is unavailable, passengers can still complete structured search.
- AI may rank only known stop candidates; it cannot create a stop.
