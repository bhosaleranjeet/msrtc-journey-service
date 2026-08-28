# Citizen-First MSRTC Journey Platform

Hackathon prototype for intent-first MSRTC journey discovery and booking. Transport, payment and tracking data are synthetic; this application has no real MSRTC integration.

## Prerequisites

- Node.js 20+
- Python 3.11+

## Run locally

Create local configuration from `.env.example`. Add an OpenAI key to enable natural-language intent parsing; the structured search remains available without one. Without `DATABASE_URL`, the backend uses `sqlite:///./msrtc.db` and seeds the supported network at startup.

```sh
cp .env.example .env
npm --prefix frontend install
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
```

Run the backend:

```sh
.venv/bin/alembic -c backend/alembic.ini upgrade head
.venv/bin/uvicorn app.main:app --app-dir backend --reload --port 8000
```

Run the frontend in a second terminal:

```sh
npm --prefix frontend run dev
```

The frontend runs on `http://localhost:5173`; Vite proxies `/api` calls to the backend at `http://localhost:8000`. Confirm it is running at `http://localhost:8000/api/health`.

## Demo scripts

All transport, seat, payment, refund and ticket data is seeded synthetic data. The 15-hub network, schedules, availability and fares are illustrative, not an official MSRTC feed. Do not enter real passenger information or represent this prototype as connected to MSRTC or a real payment provider.

### Direct journey and booking

1. Open the frontend and enter `Pune to Nashik tomorrow morning, AC` in the AI journey planner.
2. Submit the request. If prompted, choose the intended Nashik stop; matching buses then load automatically.
3. Select a service and an available seat, add passenger details, and use the mock payment action.
4. Confirm the reservation and open the mock journey pass.

### Connecting journey

1. In the structured search, use `Pune` → `Demo Destination` and keep the prefilled demo date (tomorrow in India).
2. Select **Find buses** to see the deterministic Pune → Satara → Demo Destination connection.

## Deployment

The included `Dockerfile` produces a single deployment unit: it builds the frontend and serves it, together with the FastAPI API, from one origin. The hosting platform supplies HTTPS; never commit deployment secrets.

For Render, connect this repository and create the Blueprint from `render.yaml`. Set `OPENAI_API_KEY` in Render's secret environment-variable UI (or leave it unset to demonstrate the structured-search fallback). Also set `DATABASE_URL` to a pooled Neon PostgreSQL connection string with TLS enabled. The generated `https://…onrender.com` URL should return `{"status":"ok","data_mode":"seeded_synthetic"}` at `/api/health`.

### Neon database for Render

1. Create a free Neon project in a nearby region and copy its pooled connection URL.
2. Ensure the URL includes `sslmode=require`; keep it only in Render's secret environment-variable UI.
3. Set Render `DATABASE_URL` to that value and redeploy. The Docker start command runs `alembic upgrade head` before the API starts.
4. Open `/api/demo-network?summary=true` and verify `hub_count: 15`, the active coverage dates, and non-zero route/service/trip counts.

The seed is safe to run on every restart: it adds missing rolling dates and does not overwrite an existing trip or its booking inventory.

### Vercel frontend + Render backend

The booking and ticket repositories are persistent, but the FastAPI backend still belongs on Render because it owns the API, migrations, and database transactions. Deploy only the static frontend to Vercel:

1. Push the repository to a Git provider and import it into Vercel.
2. Set the Vercel project **Root Directory** to `frontend`. The included `frontend/vercel.json` builds the Vite app into `dist`.
3. Set `VITE_API_URL` in Vercel to `https://YOUR-RENDER-SERVICE.onrender.com/api` and redeploy.
4. Set `FRONTEND_ORIGINS` in Render to the exact Vercel production URL. Add comma-separated preview origins only if they are intentionally supported.
5. Set `OPENAI_API_KEY` and `OPENAI_MODEL` on Render, then verify both the Vercel homepage and the Render `/api/health` endpoint.

Do not expose the frontend-only demo login as a security boundary. The production database and API still contain prototype-only data and require normal platform secret controls.

Before sharing the public URL, run:

```sh
.venv/bin/python -m pytest
npm --prefix frontend run lint
npm --prefix frontend run build
docker build -t msrtc-journey-prototype .
```

The final Docker command validates the production build locally; starting a public deployment requires connecting a hosting account/repository, which is intentionally not performed from this workspace.
