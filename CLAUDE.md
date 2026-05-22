# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project does

**RushMap** (formerly Jam Oracle) predicts rush-hour traffic. Given an origin and destination, it fetches 24-hour traffic data across up to 3 alternative routes from the Google Maps Directions API and visualises it as an interactive area chart. Supports both driving and transit modes.

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
api/routes.py          FastAPI app — 3 endpoints, two-layer TTL cache
services/maps.py       All async Google Maps API calls (httpx.AsyncClient)
services/traffic.py    Pure data-shaping — raw API dicts → Pydantic models
models/schemas.py      Pydantic request/response models
main.py                Uvicorn entry point
scripts/fetch_presets.py  Regenerates frontend/src/data/presets.ts (run with backend live)
```

### Frontend structure

```
frontend/src/
  app/
    page.tsx           Main page — owns all state; two views: landing and results
    layout.tsx         Root layout + metadata (title: "RushMap")
    globals.css        Tailwind directives, fade-in keyframe, font variable
  components/
    SearchForm.tsx     Unified search card: two stacked inputs + mode buttons + submit
    AddressInput.tsx   Input + debounced autocomplete + keyboard nav; variant="minimal" for inline use
    TrafficChart.tsx   Chart.js area chart, 19 hours × up to 3 routes, gradient fills
    RouteCard.tsx      Driving route card — Route A/B/C label, peak hour, peak/off-peak mins
    TransitCard.tsx    Transit route card — same label style + transit legs + transfers
    SkeletonChart.tsx  animate-pulse chart placeholder
    SkeletonCard.tsx   animate-pulse card placeholder
  data/
    presets.ts         Auto-generated baked API responses for the 3 preset routes (zero API cost)
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
pytest                          # 30 tests, ~0.25s, zero real network calls
pytest tests/test_services_traffic.py   # pure unit tests only
pytest -v                       # verbose
```

**Refresh preset cache** (run with backend live at localhost:8000):
```bash
source .venv/bin/activate
python scripts/fetch_presets.py
# then commit the updated frontend/src/data/presets.ts
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

`POST /api/routes` body: `{ "origin": str, "destination": str, "mode": "driving"|"transit", "origin_place_id"?: str, "destination_place_id"?: str }`

Response: `RoutesResponse` — origin, destination, and up to 3 `RouteResult` objects each with `hourly_traffic: [{ hour: "HH:00", duration_minutes: float }]` for hours 05–23.

---

## Key implementation details

### Caching (two layers)
- **Backend**: `TTLCache(maxsize=100, ttl=3600)` in `api/routes.py`. Two-layer keying: prelim key (`place_id:...` or `text.lower()`) checked before geocoding; result stored under both prelim and resolved (post-geocoding) keys.
- **Frontend session**: Module-level `Map<string, RoutesResponse>` in `SearchForm.tsx`, keyed by `${origin}|${destination}|${mode}`. Seeded from `PRESET_CACHE` on module load so preset clicks are instant.
- **Baked presets**: `frontend/src/data/presets.ts` contains actual API responses for the 3 preset routes — zero network calls ever for those.

### Driving vs transit divergence
- **Driving**: Routes anchored at `now_hour[:3]` in `_shape_driving_routes()` — only those 3 routes appear across all hours, no new routes can enter. `spanGaps: true` in chart (bridges API omissions). `pointRadius: 0` always.
- **Transit**: Full aggregation across all hours in `_shape_transit_routes()`. `spanGaps: false` (gaps are genuine no-service). Isolated single-hour points get `pointRadius: 5` dot.

### Route highlight (click-to-isolate)
- `selectedIndex: number | null` state in `page.tsx`.
- Clicking a card toggles that route's index. Chart filters to only the selected dataset. Non-selected cards get `opacity-30`. Selected card gets a colored `boxShadow` ring.
- Chart legend click is disabled (`onClick: () => {}` noop) to prevent dataset toggling conflicting with card-based highlight.

### Parallelisation
- `fetch_all_hourly_traffic()` fires 24 Directions API calls concurrently via `asyncio.gather()`. Response time ~3–6 s vs ~60 s sequential.

### Place ID threading
- When autocomplete selection provides a `place_id`, it's passed through `SearchForm → fetchRoutes → POST body → api/routes.py` as `origin_place_id`/`destination_place_id`. Backend uses `place_id:ChIJ...` directly in Directions API calls, skipping geocoding.

---

## Design system (RushMap brand)

The UI was redesigned in May 2026 to match a new brand direction. **Do not revert to the old Jam Oracle styling.**

### Brand
- App name: **RushMap** (not "Jam Oracle")
- Logo: Black circle containing a white ECG/waveform SVG polyline, followed by "RushMap" in `font-semibold text-sm`
- Page background: pure white (`bg-white`), NOT `bg-gray-50`

### Page layout (two views, no persistent nav except logo)
- **Landing**: Logo nav + vertically centered hero text + `SearchForm` (max-w-lg) + preset pills
  - Hero: `text-4xl font-bold` — "Outsmart rush hour."
  - Subtext: `text-sm text-gray-400` — two-line tagline
- **Results**: Logo nav + `← Back` pill + route pill + `Open in Maps` link + chart + route cards
  - Triggered by a result existing; "Back" resets result to null, remounting the landing view
  - Max width: `max-w-5xl`

### SearchForm card
- Single rounded card (`rounded-2xl border border-gray-200 bg-gray-50 shadow-sm`) containing:
  1. Origin row: hollow-circle SVG icon + minimal `AddressInput` + swap-arrows button
  2. Horizontal divider (`border-t border-gray-200 mx-4`)
  3. Destination row: filled-circle SVG icon + minimal `AddressInput`
  4. Horizontal divider
  5. Mode row: "Car" pill + "Public Transit" pill + spacer + black-circle submit arrow
- Active mode pill: `bg-black text-white rounded-full`; inactive: `border border-gray-200 bg-white`
- Submit button: 40×40px black circle with `→` arrow SVG

### Route cards (RouteCard / TransitCard)
- Clean white card, `rounded-xl border border-gray-200` — NO colored left border
- **No** `shadow-sm` at rest; `hover:shadow-md` on hover
- Selected state: `boxShadow: "0 0 0 2px white, 0 0 0 4px {color}"` (colored ring)
- Content pattern:
  ```
  ● ROUTE A          ← colored dot + uppercase tracking-wider label
  5pm  peak          ← text-3xl font-bold + text-sm "peak"
  55min peak · 13min off-peak   ← text-sm text-gray-500
  ```
- Route labels use letters not numbers: index 0→A, 1→B, 2→C (`String.fromCharCode(65 + route.index)`)
- Peak = worst hour (max duration), off-peak = best hour (min duration)
- Hour formatted as "5pm", "9am", "12pm" etc. (not "17:00")

### Chart (TrafficChart)
- Container: `rounded-2xl bg-gray-50 p-5` (NOT white, NOT border)
- Title: `text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400` — "Travel Time (min) over 24 hours"
- Legend: `position: "top", align: "end"`, `onClick: () => {}` (disabled), `boxWidth: 24, boxHeight: 2`
- Area fill: gradient via `ctx.createLinearGradient` — color at 33% opacity top → transparent bottom
- X-axis labels: "5am", "6am", ..., "12pm", "1pm", ..., "11pm" (NOT "05:00")
- Y-axis labels: `${value}m` format (e.g. "34m")
- Grid: `color: "#F3F4F6"`, no border lines (`border: { display: false }`)
- Dataset labels: "Route A", "Route B", "Route C"

### Colours
```ts
const COLORS = ["#5B7FF7", "#F97316", "#8B5CF6", "#F59E0B", "#EC4899", "#14B8A6"];
//               Route A    Route B    Route C    (fallbacks for transit)
```
This array is defined in BOTH `page.tsx` and `TrafficChart.tsx` — keep them in sync.

---

## In-progress: UI screenshot verification

After a terminal restart (to enable macOS Screen Recording), run the dev server (`cd frontend && npm run dev`) and use the computer-use MCP to screenshot `http://localhost:3000` and compare against the two design mockups:

1. **Landing page**: Logo top-left, "Outsmart rush hour." hero centered, unified search card below, 3 preset pills beneath the card.
2. **Results page**: `← Back` + route pill header, area chart with gradient fills + "Route A/B/C" legend, 3 route cards showing peak hour + peak/off-peak duration.

Any remaining gaps between the live app and the mockup should be fixed before closing this task.

---

## Google Maps APIs used

| Service | Used in | Key params |
|---|---|---|
| Geocoding | `services/maps.py: validate_address` | `address` |
| Places Autocomplete | `services/maps.py: suggest_address` | `input` (global, no country restriction) |
| Directions (hourly) | `services/maps.py: fetch_all_hourly_traffic` | `departure_time=<unix timestamp>` per hour, `alternatives=true`, `mode=driving\|transit` |

---

## Legacy / deprecated

- `bot.py` — original Telegram bot, not used. Safe to delete.
- `legacy/` — earlier Flask + Vue.js frontend. Not used. Safe to delete.
