from __future__ import annotations

import asyncio
from datetime import datetime, timedelta

import httpx

GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"
PLACES_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json"


async def validate_address(address: str, api_key: str) -> tuple[bool, str | None]:
    async with httpx.AsyncClient() as client:
        resp = await client.get(GEOCODING_URL, params={"address": address, "key": api_key})
    data = resp.json()
    results = data.get("results", [])
    if data.get("status") == "OK" and results:
        return True, results[0]["formatted_address"]
    return False, None


async def suggest_address(query: str, api_key: str) -> list[str]:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            PLACES_URL,
            params={"input": query, "key": api_key, "types": "geocode"},
        )
    data = resp.json()
    if data.get("status") == "OK" and data.get("predictions"):
        return [p["description"] for p in data["predictions"][:3]]
    return []


async def _fetch_hourly(
    client: httpx.AsyncClient,
    origin: str,
    destination: str,
    hour: int,
    api_key: str,
    mode: str = "driving",
) -> tuple[int, list[dict]]:
    now = datetime.now()
    departure = now.replace(hour=hour, minute=0, second=0, microsecond=0)
    if departure < now:
        departure += timedelta(days=1)

    params: dict = {
        "origin": origin,
        "destination": destination,
        "key": api_key,
        "mode": mode,
        "departure_time": int(departure.timestamp()),
        "alternatives": "true",
    }
    if mode == "driving":
        params["traffic_model"] = "best_guess"

    resp = await client.get(DIRECTIONS_URL, params=params)
    data = resp.json()
    return hour, data.get("routes", [])


async def fetch_all_hourly_traffic(
    origin: str, destination: str, api_key: str, mode: str = "driving"
) -> dict[int, list[dict]]:
    async with httpx.AsyncClient(timeout=30) as client:
        tasks = [
            _fetch_hourly(client, origin, destination, hour, api_key, mode)
            for hour in range(24)
        ]
        results = await asyncio.gather(*tasks)
    return {hour: routes for hour, routes in results}


async def fetch_current_routes(
    origin: str, destination: str, api_key: str, mode: str = "driving"
) -> list[dict]:
    params: dict = {
        "origin": origin,
        "destination": destination,
        "key": api_key,
        "mode": mode,
        "alternatives": "true",
    }
    if mode == "driving":
        params["departure_time"] = "now"
        params["traffic_model"] = "best_guess"

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(DIRECTIONS_URL, params=params)
    return resp.json().get("routes", [])
