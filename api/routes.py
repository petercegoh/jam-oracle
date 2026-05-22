from __future__ import annotations

import asyncio
import os

from cachetools import TTLCache
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import RouteQuery, RoutesResponse, SuggestResponse
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


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/suggest", response_model=SuggestResponse)
async def suggest(q: str = Query(..., min_length=1)):
    suggestions = await maps.suggest_address(q, GOOGLE_MAPS_API_KEY)
    return SuggestResponse(suggestions=suggestions)


@app.post("/api/routes", response_model=RoutesResponse)
async def get_routes(query: RouteQuery):
    (origin_valid, origin), (dest_valid, destination) = await asyncio.gather(
        maps.validate_address(query.origin, GOOGLE_MAPS_API_KEY),
        maps.validate_address(query.destination, GOOGLE_MAPS_API_KEY),
    )

    if not origin_valid:
        raise HTTPException(status_code=422, detail=f"Could not resolve origin: {query.origin}")
    if not dest_valid:
        raise HTTPException(status_code=422, detail=f"Could not resolve destination: {query.destination}")

    cache_key = (origin, destination, query.mode)
    if cache_key in _cache:
        return _cache[cache_key]

    current_routes, hourly_data = await asyncio.gather(
        maps.fetch_current_routes(origin, destination, GOOGLE_MAPS_API_KEY, query.mode),
        maps.fetch_all_hourly_traffic(origin, destination, GOOGLE_MAPS_API_KEY, query.mode),
    )

    if not current_routes:
        raise HTTPException(status_code=404, detail="No routes found between these locations")

    routes = traffic.shape_routes(current_routes, hourly_data, query.mode)
    response = RoutesResponse(origin=origin, destination=destination, routes=routes)

    _cache[cache_key] = response
    return response
