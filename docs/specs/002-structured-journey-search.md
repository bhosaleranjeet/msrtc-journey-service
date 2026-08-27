# 002 — Structured Journey Search

- Status: complete
- Depends on: 001

## Goal

Enable a passenger to search From → To → Date and receive understandable deterministic direct-journey options.

## In scope

- Stop search API using canonical names, aliases and deterministic matching.
- Ambiguous-stop response that returns known human-readable candidates.
- Direct journey engine that filters dated trips by resolved stops, date, time preferences and availability.
- Deterministic ranking and labels for Recommended, Cheapest, Fastest and Earliest.
- Search form and responsive results UI showing departure, arrival, duration, service type, AC status, fare, boarding/alighting context and availability.
- Machine-readable API errors for invalid queries, missing stops, ambiguity and no journeys.

## Out of scope

- OpenAI parsing, transfer journeys, seat hold, booking.

## Acceptance criteria

- Pune → Nashik returns several seeded direct options.
- “Nashik” can require a passenger-facing stop selection instead of silently selecting an invented stop.
- Ranking is deterministic and tested.
- No-results and error states explain the next action; no frontend string parsing determines behavior.
