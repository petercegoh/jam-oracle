from __future__ import annotations

from pydantic import BaseModel


class RouteQuery(BaseModel):
    origin: str
    destination: str


class HourlyDataPoint(BaseModel):
    hour: str           # "HH:00" e.g. "08:00"
    duration_minutes: float


class RouteResult(BaseModel):
    index: int
    summary: str
    distance: str
    duration_current: str   # with current traffic e.g. "42 mins"
    duration_typical: str   # baseline without traffic
    hourly_traffic: list[HourlyDataPoint]


class RoutesResponse(BaseModel):
    origin: str             # formatted by Geocoding API
    destination: str
    routes: list[RouteResult]


class SuggestResponse(BaseModel):
    suggestions: list[str]
