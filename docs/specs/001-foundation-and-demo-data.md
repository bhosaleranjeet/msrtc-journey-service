# 001 — Foundation and Demo Data

- Status: complete
- Depends on: none

## Goal

Create the smallest runnable application foundation and deterministic synthetic transport data required for every later vertical slice.

## In scope

- Initialise the agreed frontend and FastAPI backend structure without premature empty modules.
- Add environment configuration and `.env.example`; never commit secrets.
- Define typed domain models for stops, routes, services, trip instances and seats.
- Provide repository/provider boundaries suitable for SQLite initially and PostgreSQL later.
- Seed a small deterministic network:
  - multiple Pune → Nashik direct services, including AC and non-AC choices;
  - Nashik ambiguity (Mahamarg, CBS, Road);
  - Pune → Satara and Satara → Demo Destination services with a valid 15–120 minute transfer;
  - stable seat layouts and availability.
- Clearly label all data as mock/synthetic in the application.

## Out of scope

- Natural-language parsing, full search UI, booking, payment, ticketing, authentication, deployment.

## Acceptance criteria

- The frontend and backend start using documented commands.
- Seed data is repeatable and exposes the stated direct, ambiguous, and connecting scenarios.
- Models distinguish a service definition from a dated trip instance and its seat inventory.
- No frontend component contains route or fare rules.
- Automated tests cover seed-data integrity and the required demo scenarios.
