from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel


class RouteQuery(BaseModel):
    origin: str
    destination: str
    mode: Literal["driving", "transit"] = "driving"


class HourlyDataPoint(BaseModel):
    hour: str           # "HH:00" e.g. "08:00"
    duration_minutes: float


class TransitLeg(BaseModel):
    line_name: str      # "North East Line", "Bus 65"
    short_name: str     # "NEL", "65"
    vehicle_type: str   # "SUBWAY", "BUS", "RAIL", "TRAM"
    num_stops: int
    departure_stop: str
    arrival_stop: str


class RouteResult(BaseModel):
    index: int
    summary: str
    distance: str
    duration_current: str   # with current traffic e.g. "42 mins"
    duration_typical: str   # baseline without traffic
    hourly_traffic: list[HourlyDataPoint]
    transit_legs: Optional[List[TransitLeg]] = None
    transfers: Optional[int] = None


class RoutesResponse(BaseModel):
    origin: str             # formatted by Geocoding API
    destination: str
    routes: list[RouteResult]


class SuggestResponse(BaseModel):
    suggestions: list[str]
