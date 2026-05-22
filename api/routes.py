from __future__ import annotations

import os
from datetime import datetime

from cachetools import TTLCache
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import RouteQuery, RoutesResponse, Suggestion, SuggestResponse
from services import maps, traffic

app = FastAPI(title="Jam Oracle API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_cache: TTLCache = TTLCache(maxsize=100, ttl=3600)

GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")


def _prelim_key(text: str, place_id: str | None) -> str:
    return f"place_id:{place_id}" if place_id else text.strip().lower()


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/suggest", response_model=SuggestResponse)
async def suggest(q: str = Query(..., min_length=1)):
    suggestions = await maps.suggest_address(q, GOOGLE_MAPS_API_KEY)
    return SuggestResponse(suggestions=[Suggestion(**s) for s in suggestions])


@app.post("/api/routes", response_model=RoutesResponse)
async def get_routes(query: RouteQuery):
    # Fast-path cache check using normalised inputs — avoids geocoding on cache hits.
    prelim_cache_key = (
        _prelim_key(query.origin, query.origin_place_id),
        _prelim_key(query.destination, query.destination_place_id),
        query.mode,
    )
    if prelim_cache_key in _cache:
        return _cache[prelim_cache_key]

    # Resolve origin — use place_id directly if supplied (no geocoding needed)
    if query.origin_place_id:
        origin = query.origin
        origin_directions = f"place_id:{query.origin_place_id}"
        origin_key = f"place_id:{query.origin_place_id}"
    else:
        origin_valid, origin = await maps.validate_address(query.origin, GOOGLE_MAPS_API_KEY)
        if not origin_valid:
            raise HTTPException(status_code=422, detail=f"Could not resolve origin: {query.origin}")
        origin_directions = origin
        origin_key = origin

    # Resolve destination — same logic
    if query.destination_place_id:
        destination = query.destination
        destination_directions = f"place_id:{query.destination_place_id}"
        destination_key = f"place_id:{query.destination_place_id}"
    else:
        dest_valid, destination = await maps.validate_address(query.destination, GOOGLE_MAPS_API_KEY)
        if not dest_valid:
            raise HTTPException(status_code=422, detail=f"Could not resolve destination: {query.destination}")
        destination_directions = destination
        destination_key = destination

    # Check again with resolved keys — catches e.g. same geocoded address reached via different text.
    resolved_cache_key = (origin_key, destination_key, query.mode)
    if resolved_cache_key in _cache:
        _cache[prelim_cache_key] = _cache[resolved_cache_key]
        return _cache[resolved_cache_key]

    hourly_data = await maps.fetch_all_hourly_traffic(
        origin_directions, destination_directions, GOOGLE_MAPS_API_KEY, query.mode
    )
    now_hour = max(5, min(23, datetime.now().hour))
    routes = traffic.shape_routes(hourly_data, query.mode, now_hour)

    if not routes:
        raise HTTPException(status_code=404, detail="No routes found between these locations")
    response = RoutesResponse(origin=origin, destination=destination, routes=routes)

    _cache[prelim_cache_key] = response
    _cache[resolved_cache_key] = response
    return response
