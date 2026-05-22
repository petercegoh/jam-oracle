# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project does

Jam Oracle predicts rush-hour traffic for driving commutes. Given an origin and destination, it fetches 24-hour traffic data across up to 3 alternative routes from the Google Maps Directions API and visualises it as an interactive line chart in the browser.

**The Telegram bot (`bot.py`) is deprecated.** The active implementation is a FastAPI backend + Next.js frontend web app.

---

## Architecture

```
frontend/          Next.js 16 (React 19, Tailwind v4, Chart.js)
  └── calls ──→   FastAPI backend (Python 3.9, httpx, cachetools)
                    └── calls ──→  Google Maps APIs
```

### Backend structure

```
api/routes.py          FastAPI app — 3 endpoints, TTL cache
services/maps.py       All async Google Maps API calls (httpx.AsyncClient)
services/traffic.py    Pure data-shaping — raw API dicts → Pydantic models
models/schemas.py      Pydantic request/response models
main.py                Uvicorn entry point
```

### Frontend structure

```
frontend/src/
  app/
    page.tsx           Main page — owns all state ("use client")
    layout.tsx         Root layout + metadata
    globals.css        Tailwind directives, fade-in keyframe, font fix
  components/
    SearchForm.tsx     Two address inputs + submit, local submitting state
    AddressInput.tsx   Single input + debounced autocomplete + keyboard nav
    TrafficChart.tsx   Chart.js Line chart, 24 data points × 3 routes
    RouteCard.tsx      Route summary card + Google Maps link
    SkeletonChart.tsx  animate-pulse chart placeholder
    SkeletonCard.tsx   animate-pulse card placeholder
  lib/api.ts           fetchRoutes(), fetchSuggestions()
  types/api.ts         TypeScript interfaces mirroring Pydantic schemas
```

---

## Running locally

**Backend:**
```bash
source .venv/bin/activate       # existing venv, Python 3.9
pip install -r requirements.txt
python main.py                  # http://localhost:8000
                                # interactive docs: http://localhost:8000/docs
```

**Frontend:**
```bash
cd frontend
npm run dev                     # http://localhost:3000
npm run build                   # production build check
npm run lint
```

**Tests:**
```bash
source .venv/bin/activate
pip install -r requirements-dev.txt
pytest                          # 18 tests, ~0.25s, zero real network calls
pytest tests/test_services_traffic.py   # pure unit tests only
pytest -v                       # verbose
```

---

## Environment variables

**Backend** (`.env` at repo root):
- `GOOGLE_MAPS_API_KEY` — needs Places, Geocoding, and Directions APIs enabled

**Frontend** (`frontend/.env.local`):
- `NEXT_PUBLIC_API_URL=http://localhost:8000` — backend base URL

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/suggest?q=<str>` | Address autocomplete (Places API) |
| `POST` | `/api/routes` | Main endpoint — validate addresses, fetch 24h traffic, return JSON |

`POST /api/routes` body: `{ "origin": str, "destination": str }`

Response: `RoutesResponse` — origin, destination, and up to 3 `RouteResult` objects each with `hourly_traffic: [{ hour: "HH:00", duration_minutes: float }]` for all 24 hours.

---

## Key implementation details

- **Parallelisation**: `fetch_all_hourly_traffic()` fires 24 Directions API calls concurrently via `asyncio.gather()` on a shared `httpx.AsyncClient`. Response time ~3–6 s vs ~60 s sequential.
- **Cache**: `TTLCache(maxsize=100, ttl=3600)` in `api/routes.py`. Key is `(formatted_origin, formatted_destination)` — uses post-geocoding addresses to normalise input variation.
- **Python 3.9 compat**: All files use `from __future__ import annotations` to support `X | Y` union syntax and `list[...]` generics in type hints.
- **Chart smoothing**: `tension: 0.4` in Chart.js matches the visual of the original scipy cubic spline from the Telegram bot.
- **Google Maps link**: Each `RouteCard` links to `https://www.google.com/maps/dir/?api=1&origin=...&destination=...&travelmode=driving`. Route is not pre-selectable via URL — user matches by the `summary` field shown on the card (e.g. "via CTE").

---

## In-progress / planned

- **`feat/transit-mode` branch**: Add `mode=transit` support. Requires a mode selector on the frontend, a separate backend endpoint (or extended `RouteQuery` with `mode` field), new Pydantic models for transit response shape (legs, transit lines, transfer count), and a different route card design. Note: `duration_in_traffic` does not exist for transit — use `duration` only. Refer to the planning discussion before starting.

---

## Google Maps APIs used

| Service | Used in | Key params |
|---|---|---|
| Geocoding | `services/maps.py: validate_address` | `address` |
| Places Autocomplete | `services/maps.py: suggest_address` | `input`, `types=geocode` |
| Directions (current) | `services/maps.py: fetch_current_routes` | `departure_time=now`, `alternatives=true`, `traffic_model=best_guess`, `mode=driving` |
| Directions (hourly) | `services/maps.py: fetch_all_hourly_traffic` | `departure_time=<unix timestamp>` per hour, same route params |

---

## Legacy / deprecated

- `bot.py` — original Telegram bot, left in place but not used. References matplotlib, scipy, python-telegram-bot (all removed from `requirements.txt`).
- `legacy/` — earlier Flask REST API and Vue.js 3 frontend. Not used. Safe to delete eventually.
